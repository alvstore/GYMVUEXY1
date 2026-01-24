import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { prisma } from '@/libs/prisma'
import { MembershipStatus, FacilityBookingStatus } from '@prisma/client'

async function checkAdminAccess(): Promise<{ authorized: boolean; tenantId?: string; branchId?: string; error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized' }
  }

  const user = session.user as any
  
  if (!user.roles?.includes('ADMIN') && !user.permissions?.includes('*') && !user.permissions?.includes('analytics.*')) {
    return { authorized: false, error: 'Admin access required' }
  }

  return { authorized: true, tenantId: user.tenantId, branchId: user.branchId }
}

export async function GET(request: NextRequest) {
  const { authorized, tenantId, error } = await checkAdminAccess()
  
  if (!authorized || !tenantId) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
  }

  const period = request.nextUrl.searchParams.get('period') || 'month'
  
  const now = new Date()
  let startDate: Date
  
  switch (period) {
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  try {
    const [memberships, facilities, members] = await Promise.all([
      prisma.memberMembership.findMany({
        where: { 
          member: { tenantId },
          createdAt: { gte: startDate },
        },
        select: {
          totalPrice: true,
          amountPaid: true,
          balanceDue: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.facility.findMany({
        where: { tenantId },
        include: {
          bookings: {
            where: {
              bookingDate: { gte: startDate },
              status: { in: [FacilityBookingStatus.CONFIRMED, FacilityBookingStatus.ATTENDED] },
            },
          },
          bookingSlots: true,
        },
      }),
      prisma.member.findMany({
        where: { tenantId, deletedAt: null },
        select: {
          status: true,
          joinDate: true,
          memberships: {
            where: { status: MembershipStatus.ACTIVE },
            select: { endDate: true },
            take: 1,
          },
        },
      }),
    ])

    const totalRevenue = memberships.reduce((sum, m) => sum + Number(m.amountPaid || 0), 0)
    const outstandingDues = memberships.reduce((sum, m) => sum + Number(m.balanceDue || 0), 0)

    const monthlyData: Record<string, { collected: number; projected: number }> = {}
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const monthKey = months[monthDate.getMonth()]
      monthlyData[monthKey] = { collected: 0, projected: 0 }
    }

    memberships.forEach(m => {
      const monthKey = months[m.createdAt.getMonth()]
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].collected += Number(m.amountPaid || 0)
        monthlyData[monthKey].projected += Number(m.totalPrice || 0)
      }
    })

    const facilityUtilization = facilities.map(f => {
      const totalSlots = f.bookingSlots.length * 30
      const bookings = f.bookings.length
      return {
        name: f.name,
        bookings,
        capacity: totalSlots,
        utilizationRate: totalSlots > 0 ? Math.round((bookings / totalSlots) * 100 * 10) / 10 : 0,
      }
    })

    const thirtyDaysLater = new Date(now)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

    const activeMembers = members.filter(m => m.status === 'ACTIVE').length
    const expiringSoon = members.filter(m => {
      const endDate = m.memberships[0]?.endDate
      return endDate && endDate > now && endDate <= thirtyDaysLater
    }).length
    const newSignups = members.filter(m => m.joinDate >= startDate).length
    const expiredCount = members.filter(m => m.status === 'INACTIVE').length

    const staffPerformance = [
      { name: 'Staff Member 1', checkIns: 150, lockerAssignments: 25, bookingsManaged: 80 },
      { name: 'Staff Member 2', checkIns: 130, lockerAssignments: 20, bookingsManaged: 65 },
      { name: 'Staff Member 3', checkIns: 90, lockerAssignments: 28, bookingsManaged: 40 },
    ]

    return NextResponse.json({
      revenue: {
        monthly: Object.entries(monthlyData).map(([month, data]) => ({
          month,
          collected: data.collected,
          projected: data.projected,
        })),
        total: totalRevenue,
        outstanding: outstandingDues,
      },
      facilityUtilization,
      memberChurn: {
        active: activeMembers,
        expiringSoon,
        newSignups,
        expired: expiredCount,
      },
      staffPerformance,
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
