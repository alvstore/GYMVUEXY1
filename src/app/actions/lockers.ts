'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import type { Locker } from '@/types/apps/lockerTypes'

export async function getLockers(): Promise<Locker[]> {
  const context = await requirePermission('lockers.view')
  
  const lockers = await prisma.locker.findMany({
    where: { 
      branchId: context.branchId!,
    },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      }
    },
    orderBy: [{ floor: 'asc' }, { section: 'asc' }, { lockerNumber: 'asc' }],
  })

  return lockers.map(locker => ({
    id: locker.id,
    number: locker.lockerNumber,
    floor: locker.floor || 1,
    section: locker.section || 'A',
    type: locker.lockerType as 'FREE' | 'PAID',
    status: locker.status as 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED',
    occupiedBy: locker.memberId || undefined,
    memberName: locker.member ? `${locker.member.firstName} ${locker.member.lastName}` : undefined,
    assignedDate: locker.assignedAt?.toISOString().split('T')[0],
    dueDate: locker.expiresAt?.toISOString().split('T')[0],
    monthlyFee: locker.monthlyFee ? Number(locker.monthlyFee) : undefined,
  }))
}

export async function assignLocker(lockerId: string, memberId: string, months: number = 1) {
  const context = await requirePermission('lockers.update')
  
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)

  const locker = await prisma.locker.update({
    where: { id: lockerId, branchId: context.branchId! },
    data: {
      memberId,
      status: 'OCCUPIED',
      assignedAt: new Date(),
      expiresAt,
    },
  })

  return locker
}

export async function releaseLocker(lockerId: string) {
  const context = await requirePermission('lockers.update')
  
  const locker = await prisma.locker.update({
    where: { id: lockerId, branchId: context.branchId! },
    data: {
      memberId: null,
      status: 'AVAILABLE',
      assignedAt: null,
      expiresAt: null,
    },
  })

  return locker
}

export async function setLockerMaintenance(lockerId: string, isMaintenance: boolean) {
  const context = await requirePermission('lockers.update')
  
  const locker = await prisma.locker.update({
    where: { id: lockerId, branchId: context.branchId! },
    data: {
      status: isMaintenance ? 'MAINTENANCE' : 'AVAILABLE',
    },
  })

  return locker
}
