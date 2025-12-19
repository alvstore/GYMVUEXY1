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
      assignments: {
        where: { status: 'ACTIVE' },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        },
        take: 1,
      }
    },
    orderBy: { lockerNumber: 'asc' },
  })

  return lockers.map(locker => {
    const activeAssignment = locker.assignments[0]
    const locationParts = locker.location?.split(',') || []
    const floorMatch = locker.location?.match(/Floor (\d+)/)
    const sectionMatch = locker.location?.match(/Section (\w+)/)
    
    return {
      id: locker.id,
      number: locker.lockerNumber,
      floor: floorMatch ? parseInt(floorMatch[1]) : 1,
      section: sectionMatch ? sectionMatch[1] : 'A',
      type: locker.lockerType as 'STANDARD' | 'PREMIUM' | 'VIP' | 'TEMPORARY',
      status: locker.status as 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_ORDER',
      size: locker.size as 'SMALL' | 'MEDIUM' | 'LARGE' | undefined,
      occupiedBy: activeAssignment?.memberId || undefined,
      memberName: activeAssignment?.member ? `${activeAssignment.member.firstName} ${activeAssignment.member.lastName}` : undefined,
      assignedDate: activeAssignment?.startDate?.toISOString().split('T')[0],
      dueDate: activeAssignment?.endDate?.toISOString().split('T')[0],
      monthlyFee: Number(locker.monthlyRate) || undefined,
    }
  })
}

export async function assignLocker(lockerId: string, memberId: string, months: number = 1) {
  const context = await requirePermission('lockers.update')
  
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + months)

  await prisma.$transaction([
    prisma.lockerAssignment.create({
      data: {
        tenantId: context.tenantId!,
        lockerId,
        memberId,
        startDate,
        endDate,
        status: 'ACTIVE',
      }
    }),
    prisma.locker.update({
      where: { id: lockerId },
      data: {
        status: 'OCCUPIED',
        isOccupied: true,
      }
    })
  ])

  return { success: true }
}

export async function releaseLocker(lockerId: string) {
  const context = await requirePermission('lockers.update')
  
  await prisma.$transaction([
    prisma.lockerAssignment.updateMany({
      where: { 
        lockerId, 
        status: 'ACTIVE',
      },
      data: {
        status: 'TERMINATED',
        endDate: new Date(),
      }
    }),
    prisma.locker.update({
      where: { id: lockerId },
      data: {
        status: 'AVAILABLE',
        isOccupied: false,
      }
    })
  ])

  return { success: true }
}
