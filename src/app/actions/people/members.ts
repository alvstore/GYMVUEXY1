'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { ReferralCodeGenerator } from '@/libs/referral'
import { revalidatePath } from 'next/cache'

export async function createMember(data: {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  emergencyContactName?: string
  emergencyContactPhone?: string
}) {
  const context = await requirePermission('members.create')

  try {
    const membershipId = `MEM${Date.now().toString().slice(-8)}`
    
    const member = await prisma.member.create({
      data: {
        membershipId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        emergencyContact: data.emergencyContactName || null,
        emergencyPhone: data.emergencyContactPhone || null,
        referralCode: ReferralCodeGenerator.generateMemberCode(data.email),
        branchId: context.branchId || '',
        tenantId: context.tenantId,
        status: 'ACTIVE'
      }
    })

    await AuditLogger.log({
      userId: context.userId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      action: 'Member.created',
      resource: 'Member',
      resourceId: member.id,
      newValues: {
        memberName: `${member.firstName} ${member.lastName}`,
        email: member.email
      }
    })

    revalidatePath('/apps/members')

    return { success: true, member }
  } catch (error) {
    console.error('Error creating member:', error)
    return { success: false, error: 'Failed to create member' }
  }
}

export async function updateMember(
  memberId: string,
  data: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    dateOfBirth?: string
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
    emergencyContactName?: string
    emergencyContactPhone?: string
    tags?: string[]
  }
) {
  const context = await requirePermission('members.update')

  try {
    const member = await prisma.member.update({
      where: {
        id: memberId,
        tenantId: context.tenantId,
        branchId: context.branchId || undefined
      },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
        ...(data.gender && { gender: data.gender }),
        ...(data.emergencyContactName !== undefined && {
          emergencyContactName: data.emergencyContactName
        }),
        ...(data.emergencyContactPhone !== undefined && {
          emergencyContactPhone: data.emergencyContactPhone
        }),
        ...(data.tags && { tags: data.tags })
      }
    })

    await AuditLogger.log({
      userId: context.userId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      action: 'Member.updated',
      resource: 'Member',
      resourceId: member.id,
      newValues: data as any,
      oldValues: {
        memberName: `${member.firstName} ${member.lastName}`,
        updatedFields: Object.keys(data)
      }
    })

    revalidatePath('/apps/members')
    revalidatePath(`/apps/member/${memberId}`)

    return { success: true, member }
  } catch (error) {
    console.error('Error updating member:', error)
    return { success: false, error: 'Failed to update member' }
  }
}
