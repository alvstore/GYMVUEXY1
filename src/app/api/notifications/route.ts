import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { prisma } from '@/libs/prisma'
import { MembershipStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const userId = user.id
    const tenantId = user.tenantId
    const branchId = user.branchId

    if (!tenantId) {
      return NextResponse.json({ notifications: [] })
    }

    const now = new Date()
    const sevenDaysLater = new Date(now)
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
    
    const twoHoursLater = new Date(now)
    twoHoursLater.setHours(twoHoursLater.getHours() + 2)

    const [
      membersWithDues,
      expiringMemberships,
      upcomingBookings,
      dismissedNotifications,
    ] = await Promise.all([
      prisma.memberMembership.findMany({
        where: {
          member: { 
            tenantId,
            ...(branchId ? { branchId } : {}),
          },
          balanceDue: { gt: 0 },
          status: MembershipStatus.ACTIVE,
        },
        include: {
          member: { select: { firstName: true, lastName: true } },
        },
        orderBy: { balanceDue: 'desc' },
        take: 10,
      }),

      prisma.memberMembership.findMany({
        where: {
          member: { 
            tenantId,
            ...(branchId ? { branchId } : {}),
          },
          status: MembershipStatus.ACTIVE,
          endDate: { gte: now, lte: sevenDaysLater },
        },
        include: {
          member: { select: { firstName: true, lastName: true } },
          plan: { select: { name: true } },
        },
        orderBy: { endDate: 'asc' },
        take: 10,
      }),

      (prisma as any).facilityBooking?.findMany?.({
        where: {
          tenantId,
          ...(branchId ? { branchId } : {}),
          status: 'CONFIRMED',
          bookingDate: { gte: now, lte: twoHoursLater },
        },
        include: {
          member: { select: { firstName: true, lastName: true } },
          facility: { select: { name: true, facilityType: true } },
          bookingSlot: { select: { startTime: true } },
        },
        orderBy: { bookingDate: 'asc' },
        take: 10,
      }).catch(() => []) ?? Promise.resolve([]),

      userId ? prisma.dismissedNotification.findMany({
        where: {
          userId,
          expiresAt: { gt: now },
        },
        select: { notificationKey: true },
      }) : Promise.resolve([]),
    ])

    const dismissedKeys = new Set(dismissedNotifications.map((d: any) => d.notificationKey))

    const notifications: any[] = []

    for (const m of membersWithDues) {
      const daysOverdue = Math.floor((now.getTime() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const notificationId = `due_${m.id}`
      notifications.push({
        id: notificationId,
        type: 'payment_due',
        title: `Payment Due: ${m.member.firstName} ${m.member.lastName}`,
        subtitle: `Outstanding balance: ₹${Number(m.balanceDue).toFixed(0)}`,
        time: daysOverdue > 0 ? `${daysOverdue} days ago` : 'Today',
        read: dismissedKeys.has(notificationId),
        avatarIcon: 'tabler-currency-rupee',
        avatarColor: 'error',
      })
    }

    for (const m of expiringMemberships) {
      const daysUntil = Math.ceil((new Date(m.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const notificationId = `expiry_${m.id}`
      notifications.push({
        id: notificationId,
        type: 'membership_expiry',
        title: `Membership Expiring: ${m.member.firstName} ${m.member.lastName}`,
        subtitle: `${m.plan.name} expires ${daysUntil === 0 ? 'today' : `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}`,
        time: new Date(m.endDate).toLocaleDateString(),
        read: dismissedKeys.has(notificationId),
        avatarIcon: 'tabler-calendar-event',
        avatarColor: daysUntil <= 1 ? 'error' : daysUntil <= 3 ? 'warning' : 'info',
      })
    }

    for (const b of upcomingBookings) {
      const facilityName = b.facility.name
      const isSaunaOrIceBath = ['SAUNA', 'ICE_BATH'].includes(b.facility.facilityType as string)
      const notificationId = `booking_${b.id}`
      
      notifications.push({
        id: notificationId,
        type: 'upcoming_booking',
        title: `Upcoming: ${b.member.firstName} ${b.member.lastName}`,
        subtitle: `${facilityName} at ${b.bookingSlot.startTime}`,
        time: 'In 2 hours',
        read: dismissedKeys.has(notificationId),
        avatarIcon: isSaunaOrIceBath ? 'tabler-flame' : 'tabler-calendar-check',
        avatarColor: isSaunaOrIceBath ? 'warning' : 'success',
      })
    }

    notifications.sort((a, b) => {
      if (!a.read && b.read) return -1
      if (a.read && !b.read) return 1
      return 0
    })

    return NextResponse.json({
      notifications: notifications.slice(0, 20),
      counts: {
        paymentDue: membersWithDues.length,
        expiringMemberships: expiringMemberships.length,
        upcomingBookings: upcomingBookings.length,
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
      },
    })
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json({ notifications: [], error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const userId = user.id

    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    const body = await request.json()
    const { action, notificationId, notificationIds } = body

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    if (action === 'markRead' && notificationId) {
      await prisma.dismissedNotification.upsert({
        where: {
          userId_notificationKey: {
            userId,
            notificationKey: notificationId,
          },
        },
        create: {
          userId,
          notificationKey: notificationId,
          expiresAt,
        },
        update: {
          expiresAt,
        },
      })
      return NextResponse.json({ success: true, message: 'Notification marked as read' })
    }

    if (action === 'markAllRead' && notificationIds && Array.isArray(notificationIds)) {
      await Promise.all(
        notificationIds.map((nId: string) =>
          prisma.dismissedNotification.upsert({
            where: {
              userId_notificationKey: {
                userId,
                notificationKey: nId,
              },
            },
            create: {
              userId,
              notificationKey: nId,
              expiresAt,
            },
            update: {
              expiresAt,
            },
          })
        )
      )
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (action === 'markUnread' && notificationId) {
      await prisma.dismissedNotification.deleteMany({
        where: {
          userId,
          notificationKey: notificationId,
        },
      })
      return NextResponse.json({ success: true, message: 'Notification marked as unread' })
    }

    if (action === 'markAllUnread' && notificationIds && Array.isArray(notificationIds)) {
      await prisma.dismissedNotification.deleteMany({
        where: {
          userId,
          notificationKey: { in: notificationIds },
        },
      })
      return NextResponse.json({ success: true, message: 'All notifications marked as unread' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Failed to update notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
