'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import type { AttendanceRecord } from '@/types/apps/attendanceTypes'

export async function getAttendanceRecords(options?: { 
  date?: Date
  limit?: number 
}): Promise<AttendanceRecord[]> {
  const context = await requirePermission('attendance.view')
  
  const today = options?.date || new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const records = await prisma.attendance.findMany({
    where: { 
      branchId: context.branchId!,
      checkInTime: {
        gte: startOfDay,
        lte: endOfDay,
      }
    },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        }
      },
      branch: {
        select: {
          name: true,
        }
      }
    },
    orderBy: { checkInTime: 'desc' },
    take: options?.limit || 100,
  })

  return records.map(record => {
    let duration: number | undefined
    if (record.checkOutTime) {
      duration = Math.round((record.checkOutTime.getTime() - record.checkInTime.getTime()) / (1000 * 60))
    }

    return {
      id: record.id,
      memberId: record.memberId,
      memberName: `${record.member.firstName} ${record.member.lastName}`,
      memberAvatar: record.member.avatar || undefined,
      checkInTime: record.checkInTime.toISOString(),
      checkOutTime: record.checkOutTime?.toISOString(),
      duration,
      branchName: record.branch.name,
      date: record.checkInTime.toISOString().split('T')[0],
    }
  })
}

export async function getAttendanceByDateRange(startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
  const context = await requirePermission('attendance.view')
  
  const records = await prisma.attendance.findMany({
    where: { 
      branchId: context.branchId!,
      checkInTime: {
        gte: startDate,
        lte: endDate,
      }
    },
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        }
      },
      branch: {
        select: {
          name: true,
        }
      }
    },
    orderBy: { checkInTime: 'desc' },
  })

  return records.map(record => {
    let duration: number | undefined
    if (record.checkOutTime) {
      duration = Math.round((record.checkOutTime.getTime() - record.checkInTime.getTime()) / (1000 * 60))
    }

    return {
      id: record.id,
      memberId: record.memberId,
      memberName: `${record.member.firstName} ${record.member.lastName}`,
      memberAvatar: record.member.avatar || undefined,
      checkInTime: record.checkInTime.toISOString(),
      checkOutTime: record.checkOutTime?.toISOString(),
      duration,
      branchName: record.branch.name,
      date: record.checkInTime.toISOString().split('T')[0],
    }
  })
}
