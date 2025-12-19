import { prisma } from '@/lib/prisma'
import { MemberMembership, MembershipStatus } from '@prisma/client'

export interface FreezeMembershipData {
  membershipId: string
  freezeReason: string
  freezeCharges?: number
  freezeDuration?: number // days
}

export interface UnfreezeMembershipData {
  membershipId: string
  extendDuration?: number // days to extend due to freeze
}

export class MembershipService {
  static async freezeMembership(data: FreezeMembershipData, performedBy: string): Promise<MemberMembership> {
    const membership = await prisma.memberMembership.findUnique({
      where: { id: data.membershipId },
      include: { member: true, plan: true },
    })

    if (!membership) {
      throw new Error('Membership not found')
    }

    if (membership.isFrozen) {
      throw new Error('Membership is already frozen')
    }

    if (membership.status !== 'ACTIVE') {
      throw new Error('Only active memberships can be frozen')
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update membership
      const updatedMembership = await tx.memberMembership.update({
        where: { id: data.membershipId },
        data: {
          isFrozen: true,
          frozenDate: new Date(),
          freezeReason: data.freezeReason,
          freezeCharges: data.freezeCharges || 0,
          originalEndDate: membership.endDate, // Store original end date
          status: 'FROZEN',
        },
      })

      // Create invoice for freeze charges if applicable
      if (data.freezeCharges && data.freezeCharges > 0) {
        const invoiceCount = await tx.invoice.count({
          where: { branchId: membership.branchId }
        })
        const invoiceNumber = `INV-${membership.branchId.slice(-4).toUpperCase()}-${String(invoiceCount + 1).padStart(4, '0')}`

        await tx.invoice.create({
          data: {
            tenantId: membership.member.tenantId,
            branchId: membership.branchId,
            invoiceNumber,
            memberId: membership.memberId,
            membershipId: membership.id,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            subtotal: data.freezeCharges,
            totalAmount: data.freezeCharges,
            status: 'DRAFT',
            notes: `Membership freeze charges - ${data.freezeReason}`,
          },
        })
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          tenantId: membership.member.tenantId,
          branchId: membership.branchId,
          userId: performedBy,
          action: 'FREEZE_MEMBERSHIP',
          resource: 'memberships',
          resourceId: membership.id,
          oldData: membership,
          newData: updatedMembership,
          metadata: {
            reason: data.freezeReason,
            charges: data.freezeCharges,
          },
        },
      })

      return updatedMembership
    })

    return result
  }

  static async unfreezeMembership(data: UnfreezeMembershipData, performedBy: string): Promise<MemberMembership> {
    const membership = await prisma.memberMembership.findUnique({
      where: { id: data.membershipId },
      include: { member: true },
    })

    if (!membership) {
      throw new Error('Membership not found')
    }

    if (!membership.isFrozen) {
      throw new Error('Membership is not frozen')
    }

    const result = await prisma.$transaction(async (tx) => {
      // Calculate new end date
      let newEndDate = membership.originalEndDate || membership.endDate
      
      if (data.extendDuration) {
        newEndDate = new Date(newEndDate.getTime() + data.extendDuration * 24 * 60 * 60 * 1000)
      }

      // Update membership
      const updatedMembership = await tx.memberMembership.update({
        where: { id: data.membershipId },
        data: {
          isFrozen: false,
          unfrozenDate: new Date(),
          endDate: newEndDate,
          status: 'ACTIVE',
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          tenantId: membership.member.tenantId,
          branchId: membership.branchId,
          userId: performedBy,
          action: 'UNFREEZE_MEMBERSHIP',
          resource: 'memberships',
          resourceId: membership.id,
          oldData: membership,
          newData: updatedMembership,
          metadata: {
            extendDuration: data.extendDuration,
            newEndDate: newEndDate.toISOString(),
          },
        },
      })

      return updatedMembership
    })

    return result
  }

  static async getFrozenMemberships(branchId?: string) {
    const where: any = { isFrozen: true }
    if (branchId) where.branchId = branchId

    return await prisma.memberMembership.findMany({
      where,
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            membershipId: true,
            phone: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { frozenDate: 'desc' },
    })
  }

  static async getExpiringMemberships(branchId?: string, daysAhead = 30) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const where: any = {
      status: 'ACTIVE',
      isFrozen: false,
      endDate: {
        lte: futureDate,
        gte: new Date(),
      },
    }

    if (branchId) where.branchId = branchId

    return await prisma.memberMembership.findMany({
      where,
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            membershipId: true,
            email: true,
            phone: true,
          },
        },
        plan: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
    })
  }
}