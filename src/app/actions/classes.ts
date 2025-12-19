'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

export async function scheduleClass(data: {
  name: string
  classType: 'YOGA' | 'PILATES' | 'ZUMBA' | 'AEROBICS' | 'STRENGTH_TRAINING' | 'CARDIO' | 'HIIT' | 'CROSSFIT' | 'MARTIAL_ARTS' | 'DANCE' | 'MEDITATION' | 'STRETCHING' | 'FUNCTIONAL_TRAINING' | 'BODYBUILDING' | 'POWERLIFTING'
  trainerId: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  capacity: number
  duration?: number // minutes
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  description?: string
  roomId?: string
  branchId?: string
}) {
  const context = await requirePermission('classes.create')

  const branchId = data.branchId || context.branchId

  try {
    // Calculate duration in minutes if not provided
    const duration = data.duration || 60
    
    const gymClass = await prisma.class.create({
      data: {
        name: data.name,
        classType: data.classType,
        trainerId: data.trainerId,
        tenantId: context.tenantId,
        branchId: branchId || '',
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: data.capacity,
        duration: duration,
        difficulty: data.difficulty || 'BEGINNER',
        description: data.description,
        roomId: data.roomId,
        isActive: true
      }
    })

    await AuditLogger.log({
      userId: context.userId,
      tenantId: context.tenantId,
      branchId: branchId,
      action: 'Class.scheduled',
      resource: 'Class',
      resourceId: gymClass.id,
      newValues: {
        name: data.name,
        classType: data.classType,
        capacity: data.capacity,
        time: `${data.startTime} - ${data.endTime}`
      }
    })

    return { success: true, gymClass }
  } catch (error) {
    console.error('Error scheduling class:', error)
    return { success: false, error: 'Failed to schedule class' }
  }
}

export async function getClasses(filters?: {
  isActive?: boolean
  branchId?: string
  trainerId?: string
  classType?: string
}) {
  const context = await requirePermission('classes.view')

  const where: any = {
    tenantId: context.tenantId
  }

  if (filters?.branchId) {
    where.branchId = filters.branchId
  } else if (context.branchId) {
    where.branchId = context.branchId
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  if (filters?.trainerId) {
    where.trainerId = filters.trainerId
  }

  if (filters?.classType) {
    where.classType = filters.classType
  }

  const classes = await prisma.class.findMany({
    where,
    include: {
      trainer: {
        include: {
          user: {
            select: { name: true, avatar: true }
          }
        }
      },
      room: {
        select: { id: true, name: true }
      }
    },
    orderBy: { startTime: 'asc' }
  })

  return classes
}

export async function cancelClass(id: string) {
  const context = await requirePermission('classes.delete')

  const gymClass = await prisma.class.findFirst({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId })
    }
  })

  if (!gymClass) {
    throw new Error('Class not found')
  }

  const updated = await prisma.class.update({
    where: { id },
    data: { isActive: false }
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: gymClass.branchId,
    action: 'Class.cancelled',
    resource: 'Class',
    resourceId: id,
    oldValues: { isActive: gymClass.isActive }
  })

  return updated
}
