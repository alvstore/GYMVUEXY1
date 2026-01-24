import { NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'
import { MembershipStatus, FacilityBookingStatus } from '@prisma/client'

const NotificationLogType = {
  MEMBERSHIP_EXPIRY_7_DAYS: 'MEMBERSHIP_EXPIRY_7_DAYS',
  MEMBERSHIP_EXPIRY_3_DAYS: 'MEMBERSHIP_EXPIRY_3_DAYS',
  MEMBERSHIP_EXPIRY_1_DAY: 'MEMBERSHIP_EXPIRY_1_DAY',
  PAYMENT_DUE_REMINDER: 'PAYMENT_DUE_REMINDER',
  BOOKING_REMINDER_2_HOURS: 'BOOKING_REMINDER_2_HOURS',
  LOCKER_EXPIRY_WARNING: 'LOCKER_EXPIRY_WARNING',
}

const NotificationLogStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  SKIPPED: 'SKIPPED',
}

const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  IN_APP: 'IN_APP',
}

async function createNotificationLog(data: {
  tenantId: string
  branchId?: string
  memberId: string
  notificationType: string
  channel: string
  subject?: string
  message: string
  dedupeKey: string
  metadata?: any
}) {
  const existing = await prisma.notificationLog.findUnique({
    where: { dedupeKey: data.dedupeKey },
  })

  if (existing) {
    return { skipped: true, reason: 'Already sent' }
  }

  await prisma.notificationLog.create({
    data: {
      tenantId: data.tenantId,
      branchId: data.branchId,
      memberId: data.memberId,
      notificationType: data.notificationType as any,
      channel: data.channel as any,
      status: NotificationLogStatus.PENDING as any,
      subject: data.subject,
      message: data.message,
      dedupeKey: data.dedupeKey,
      metadata: data.metadata,
      scheduledFor: new Date(),
    },
  })

  return { created: true }
}

async function processMembershipExpiryNotifications() {
  const now = new Date()
  const results = { day7: 0, day3: 0, day1: 0 }

  const day7 = new Date(now)
  day7.setDate(day7.getDate() + 7)
  day7.setHours(0, 0, 0, 0)

  const day7End = new Date(day7)
  day7End.setHours(23, 59, 59, 999)

  const expiring7Days = await prisma.memberMembership.findMany({
    where: {
      status: MembershipStatus.ACTIVE,
      endDate: { gte: day7, lte: day7End },
    },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, tenantId: true, branchId: true } },
      plan: { select: { name: true } },
    },
  })

  for (const membership of expiring7Days) {
    const result = await createNotificationLog({
      tenantId: membership.member.tenantId,
      branchId: membership.member.branchId || undefined,
      memberId: membership.member.id,
      notificationType: NotificationLogType.MEMBERSHIP_EXPIRY_7_DAYS,
      channel: NotificationChannel.SMS,
      subject: 'Membership Expiring Soon',
      message: `Hi ${membership.member.firstName}, your ${membership.plan.name} membership expires in 7 days (${membership.endDate.toLocaleDateString()}). Renew now to continue enjoying our facilities!`,
      dedupeKey: `membership_expiry_7d_${membership.id}`,
      metadata: { membershipId: membership.id, planName: membership.plan.name },
    })
    if (result.created) results.day7++
  }

  const day3 = new Date(now)
  day3.setDate(day3.getDate() + 3)
  day3.setHours(0, 0, 0, 0)

  const day3End = new Date(day3)
  day3End.setHours(23, 59, 59, 999)

  const expiring3Days = await prisma.memberMembership.findMany({
    where: {
      status: MembershipStatus.ACTIVE,
      endDate: { gte: day3, lte: day3End },
    },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, phone: true, tenantId: true, branchId: true } },
      plan: { select: { name: true } },
    },
  })

  for (const membership of expiring3Days) {
    const result = await createNotificationLog({
      tenantId: membership.member.tenantId,
      branchId: membership.member.branchId || undefined,
      memberId: membership.member.id,
      notificationType: NotificationLogType.MEMBERSHIP_EXPIRY_3_DAYS,
      channel: NotificationChannel.SMS,
      subject: 'Membership Expiring in 3 Days',
      message: `Hi ${membership.member.firstName}, your membership expires in just 3 days! Renew today to avoid service interruption.`,
      dedupeKey: `membership_expiry_3d_${membership.id}`,
      metadata: { membershipId: membership.id },
    })
    if (result.created) results.day3++
  }

  const day1 = new Date(now)
  day1.setDate(day1.getDate() + 1)
  day1.setHours(0, 0, 0, 0)

  const day1End = new Date(day1)
  day1End.setHours(23, 59, 59, 999)

  const expiring1Day = await prisma.memberMembership.findMany({
    where: {
      status: MembershipStatus.ACTIVE,
      endDate: { gte: day1, lte: day1End },
    },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, phone: true, tenantId: true, branchId: true } },
      plan: { select: { name: true } },
    },
  })

  for (const membership of expiring1Day) {
    const result = await createNotificationLog({
      tenantId: membership.member.tenantId,
      branchId: membership.member.branchId || undefined,
      memberId: membership.member.id,
      notificationType: NotificationLogType.MEMBERSHIP_EXPIRY_1_DAY,
      channel: NotificationChannel.SMS,
      subject: 'Membership Expires Tomorrow!',
      message: `URGENT: Hi ${membership.member.firstName}, your membership expires TOMORROW! Visit us today to renew and continue your fitness journey.`,
      dedupeKey: `membership_expiry_1d_${membership.id}`,
      metadata: { membershipId: membership.id },
    })
    if (result.created) results.day1++
  }

  return results
}

async function processPaymentDueNotifications() {
  const membershipsWithDues = await prisma.memberMembership.findMany({
    where: {
      status: MembershipStatus.ACTIVE,
      balanceDue: { gt: 0 },
    },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, phone: true, tenantId: true, branchId: true } },
    },
  })

  let count = 0
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))

  for (const membership of membershipsWithDues) {
    const result = await createNotificationLog({
      tenantId: membership.member.tenantId,
      branchId: membership.member.branchId || undefined,
      memberId: membership.member.id,
      notificationType: NotificationLogType.PAYMENT_DUE_REMINDER,
      channel: NotificationChannel.SMS,
      subject: 'Payment Reminder',
      message: `Hi ${membership.member.firstName}, you have an outstanding balance of ₹${Number(membership.balanceDue).toFixed(2)}. Please visit the gym to clear your dues.`,
      dedupeKey: `payment_due_${membership.id}_week_${weekNumber}`,
      metadata: { membershipId: membership.id, balanceDue: Number(membership.balanceDue) },
    })
    if (result.created) count++
  }

  return count
}

async function processBookingReminders() {
  const now = new Date()
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  const upcomingBookings = await prisma.facilityBooking.findMany({
    where: {
      status: FacilityBookingStatus.CONFIRMED,
      bookingDate: {
        gte: now,
        lte: twoHoursLater,
      },
    },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, phone: true, tenantId: true, branchId: true } },
      facility: { select: { name: true } },
      bookingSlot: { select: { startTime: true } },
    },
  })

  let count = 0

  for (const booking of upcomingBookings) {
    const result = await createNotificationLog({
      tenantId: booking.member.tenantId,
      branchId: booking.member.branchId || undefined,
      memberId: booking.member.id,
      notificationType: NotificationLogType.BOOKING_REMINDER_2_HOURS,
      channel: NotificationChannel.SMS,
      subject: 'Booking Reminder',
      message: `Reminder: Hi ${booking.member.firstName}, your ${booking.facility.name} session is in 2 hours at ${booking.bookingSlot.startTime}. See you soon!`,
      dedupeKey: `booking_reminder_${booking.id}`,
      metadata: { bookingId: booking.id, facilityName: booking.facility.name },
    })
    if (result.created) count++
  }

  return count
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [expiryResults, paymentDueCount, bookingReminderCount] = await Promise.all([
      processMembershipExpiryNotifications(),
      processPaymentDueNotifications(),
      processBookingReminders(),
    ])

    const summary = {
      timestamp: new Date().toISOString(),
      membershipExpiry: expiryResults,
      paymentDueReminders: paymentDueCount,
      bookingReminders: bookingReminderCount,
      totalCreated: expiryResults.day7 + expiryResults.day3 + expiryResults.day1 + paymentDueCount + bookingReminderCount,
    }

    console.log('Notification cron job completed:', summary)

    return NextResponse.json({
      success: true,
      ...summary,
    })
  } catch (error: any) {
    console.error('Notification cron job failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
