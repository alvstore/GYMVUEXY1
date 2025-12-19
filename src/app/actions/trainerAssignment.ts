'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { revalidatePath } from 'next/cache'

interface AssignTrainerData {
  memberId: string
  trainerId: string
  sessionType?: 'PERSONAL_TRAINING' | 'GROUP_CLASS' | 'CONSULTATION' | 'ASSESSMENT'
  totalSessions?: number
  rate?: number
  startDate: string
  endDate?: string
  notes?: string
}

/**
 * Assign a trainer to a member with branch validation
 * 
 * Enforces:
 * - Branch matching (member.branchId === trainer.branchId)
 * - RBAC (trainers.assign permission)
 * - Audit trail
 */
export async function assignTrainer(data: AssignTrainerData) {
  const context = await requirePermission('trainers.assign')

  try {
    // Fetch member and trainer with branch validation
    const [member, trainer] = await Promise.all([
      prisma.member.findFirst({
        where: {
          id: data.memberId,
          tenantId: context.tenantId,
          ...(context.branchId ? { branchId: context.branchId } : {})
        }
      }),
      prisma.trainerProfile.findFirst({
        where: {
          id: data.trainerId,
          tenantId: context.tenantId,
          ...(context.branchId 
            ? { OR: [{ branchId: context.branchId }, { branchId: null }] } 
            : {})
        }
      })
    ])

    if (!member) {
      return { success: false, error: 'Member not found or not in your branch' }
    }

    if (!trainer) {
      return { success: false, error: 'Trainer not found or not available' }
    }

    // Verify branch matching (tenant-wide trainers can serve any branch)
    if (trainer.branchId !== null && member.branchId !== trainer.branchId) {
      return { success: false, error: 'Member and trainer must be in the same branch' }
    }

    // Create trainer assignment with proper branch isolation
    // Use member's branchId to maintain branch isolation, even for tenant-wide trainers
    const assignment = await prisma.trainerAssignment.create({
      data: {
        memberId: data.memberId,
        trainerId: data.trainerId,
        branchId: member.branchId,
        sessionType: data.sessionType || 'PERSONAL_TRAINING',
        totalSessions: data.totalSessions || 1,
        completedSessions: 0,
        rate: data.rate || 0,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'ACTIVE',
        notes: data.notes || null,
        requestedBy: context.userId,
        approvedBy: context.userId,
        approvedAt: new Date()
      }
    })

    // Update trainer's active member count if needed
    await prisma.trainerProfile.update({
      where: { id: data.trainerId },
      data: {
        totalSessions: { increment: data.totalSessions || 1 }
      }
    })

    // Audit logging with proper details
    await AuditLogger.logCreate(
      context.userId,
      context.tenantId,
      'TrainerAssignment',
      assignment.id,
      {
        memberName: `${member.firstName} ${member.lastName}`,
        memberId: member.id,
        trainerId: trainer.id,
        trainerUserId: trainer.userId,
        branchId: assignment.branchId,
        sessionType: assignment.sessionType,
        totalSessions: assignment.totalSessions
      },
      context.branchId
    )

    // Revalidate paths after successful operations
    revalidatePath('/apps/trainers')
    revalidatePath('/apps/members')

    return { success: true, assignment }
  } catch (error) {
    console.error('Error assigning trainer:', error)
    return { success: false, error: 'Failed to assign trainer. Please try again.' }
  }
}

/**
 * Get members without trainer assignments
 */
export async function getMembersWithoutTrainers() {
  const context = await requirePermission('members.read')

  try {
    const members = await prisma.member.findMany({
      where: {
        tenantId: context.tenantId,
        branchId: context.branchId || undefined,
        trainerAssignments: {
          none: {
            status: 'ACTIVE'
          }
        },
        status: 'ACTIVE',
        deletedAt: null
      },
      select: {
        id: true,
        membershipId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        joinDate: true
      },
      orderBy: {
        joinDate: 'desc'
      }
    })

    return { success: true, members }
  } catch (error) {
    console.error('Error fetching members without trainers:', error)
    return { success: false, error: 'Failed to fetch members', members: [] }
  }
}

/**
 * Get available trainers in the branch
 */
export async function getAvailableTrainers() {
  const context = await requirePermission('trainers.read')

  try {
    const trainers = await prisma.trainerProfile.findMany({
      where: {
        tenantId: context.tenantId,
        ...(context.branchId 
          ? { OR: [{ branchId: context.branchId }, { branchId: null }] }
          : {}),
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            assignments: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { success: true, trainers }
  } catch (error) {
    console.error('Error fetching available trainers:', error)
    return { success: false, error: 'Failed to fetch trainers', trainers: [] }
  }
}
