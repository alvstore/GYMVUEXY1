'use server'

import { MembershipStatus, FacilityBookingStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/libs/prisma'

export type BookingError = {
  code: 'MEMBERSHIP_INACTIVE' | 'NO_CREDITS' | 'SLOT_FULL' | 'ALREADY_BOOKED' | 'INVALID_DATA' | 'NOT_FOUND' | 'UNKNOWN'
  message: string
}

export type BookingResult = {
  success: boolean
  data?: {
    bookingId: string
    facilityName: string
    bookingDate: Date
    startTime: string
    endTime: string
    remainingCredits: number
  }
  error?: BookingError
}

export async function createBooking(input: {
  memberId: string
  facilityId: string
  bookingSlotId: string
  bookingDate: Date
}): Promise<BookingResult> {
  try {
    const { memberId, facilityId, bookingSlotId, bookingDate } = input

    if (!memberId || !facilityId || !bookingSlotId || !bookingDate) {
      return {
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'Missing required booking information.',
        },
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id: memberId },
        include: {
          memberships: {
            where: { status: MembershipStatus.ACTIVE },
            include: {
              plan: true,
              benefitLedgers: {
                include: { benefit: true },
              },
            },
            orderBy: { endDate: 'desc' },
            take: 1,
          },
        },
      })

      if (!member) {
        throw { code: 'NOT_FOUND', message: 'Member not found.' }
      }

      const activeMembership = member.memberships[0]
      if (!activeMembership) {
        throw { code: 'MEMBERSHIP_INACTIVE', message: 'You do not have an active membership. Please renew your membership to book facilities.' }
      }

      const facility = await tx.facility.findUnique({
        where: { id: facilityId },
        include: { bookingSlots: true },
      })

      if (!facility || !facility.isActive) {
        throw { code: 'NOT_FOUND', message: 'Facility not found or is currently unavailable.' }
      }

      const bookingSlot = await tx.bookingSlot.findUnique({
        where: { id: bookingSlotId },
      })

      if (!bookingSlot || !bookingSlot.isActive || bookingSlot.facilityId !== facilityId) {
        throw { code: 'NOT_FOUND', message: 'Time slot not found or is currently unavailable.' }
      }

      const benefitLedger = activeMembership.benefitLedgers.find(
        (ledger) => ledger.benefit.name.toLowerCase() === facility.linkedBenefitName?.toLowerCase()
      )

      if (!benefitLedger) {
        throw { code: 'NO_CREDITS', message: `Your membership plan does not include access to ${facility.name}.` }
      }

      if (benefitLedger.remainingCount <= 0) {
        throw {
          code: 'NO_CREDITS',
          message: `You have used all your ${facility.name} sessions for this membership period. You have 0 of ${benefitLedger.totalAllocated} sessions remaining.`,
        }
      }

      const bookingDateOnly = new Date(bookingDate)
      bookingDateOnly.setHours(0, 0, 0, 0)

      const existingBookingsCount = await tx.facilityBooking.count({
        where: {
          facilityId,
          bookingSlotId,
          bookingDate: bookingDateOnly,
          status: { in: [FacilityBookingStatus.CONFIRMED, FacilityBookingStatus.ATTENDED] },
        },
      })

      if (existingBookingsCount >= facility.maxCapacity) {
        throw {
          code: 'SLOT_FULL',
          message: `This time slot is fully booked. Maximum capacity is ${facility.maxCapacity}. Please select another time.`,
        }
      }

      const existingMemberBooking = await tx.facilityBooking.findFirst({
        where: {
          memberId,
          facilityId,
          bookingSlotId,
          bookingDate: bookingDateOnly,
          status: { in: [FacilityBookingStatus.CONFIRMED, FacilityBookingStatus.ATTENDED] },
        },
      })

      if (existingMemberBooking) {
        throw { code: 'ALREADY_BOOKED', message: 'You already have a booking for this time slot.' }
      }

      const booking = await tx.facilityBooking.create({
        data: {
          tenantId: member.tenantId,
          branchId: member.branchId || facility.branchId,
          facilityId,
          bookingSlotId,
          memberId,
          benefitLedgerId: benefitLedger.id,
          bookingDate: bookingDateOnly,
          status: FacilityBookingStatus.CONFIRMED,
        },
      })

      const updatedLedger = await tx.benefitLedger.update({
        where: { id: benefitLedger.id },
        data: {
          usedCount: { increment: 1 },
          remainingCount: { decrement: 1 },
        },
      })

      return {
        bookingId: booking.id,
        facilityName: facility.name,
        bookingDate: booking.bookingDate,
        startTime: bookingSlot.startTime,
        endTime: bookingSlot.endTime,
        remainingCredits: updatedLedger.remainingCount,
      }
    })

    revalidatePath('/member/bookings')
    revalidatePath('/apps/facility-calendar')

    return { success: true, data: result }
  } catch (error: unknown) {
    const bookingError = error as BookingError
    if (bookingError.code && bookingError.message) {
      return { success: false, error: bookingError }
    }

    console.error('Booking error:', error)
    return {
      success: false,
      error: { code: 'UNKNOWN', message: 'An unexpected error occurred. Please try again.' },
    }
  }
}

export async function cancelBooking(input: {
  bookingId: string
  cancelledBy: string
  reason?: string
}): Promise<{ success: boolean; error?: BookingError }> {
  try {
    const { bookingId, cancelledBy, reason } = input

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.facilityBooking.findUnique({
        where: { id: bookingId },
        include: { benefitLedger: true },
      })

      if (!booking) {
        throw { code: 'NOT_FOUND', message: 'Booking not found.' }
      }

      if (booking.status === FacilityBookingStatus.CANCELLED) {
        throw { code: 'INVALID_DATA', message: 'This booking has already been cancelled.' }
      }

      if (booking.status === FacilityBookingStatus.ATTENDED) {
        throw { code: 'INVALID_DATA', message: 'Cannot cancel a booking that has already been marked as attended.' }
      }

      await tx.facilityBooking.update({
        where: { id: bookingId },
        data: {
          status: FacilityBookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy,
          cancelReason: reason,
        },
      })

      if (booking.benefitLedgerId) {
        await tx.benefitLedger.update({
          where: { id: booking.benefitLedgerId },
          data: {
            usedCount: { decrement: 1 },
            remainingCount: { increment: 1 },
          },
        })
      }

      return true
    })

    revalidatePath('/member/bookings')
    revalidatePath('/apps/facility-calendar')

    return { success: result }
  } catch (error: unknown) {
    const bookingError = error as BookingError
    if (bookingError.code && bookingError.message) {
      return { success: false, error: bookingError }
    }

    console.error('Cancel booking error:', error)
    return {
      success: false,
      error: { code: 'UNKNOWN', message: 'An unexpected error occurred. Please try again.' },
    }
  }
}

export async function markAsAttended(input: {
  bookingId: string
  markedBy: string
}): Promise<{ success: boolean; error?: BookingError }> {
  try {
    const { bookingId, markedBy } = input

    const booking = await prisma.facilityBooking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found.' } }
    }

    if (booking.status !== FacilityBookingStatus.CONFIRMED) {
      return {
        success: false,
        error: { code: 'INVALID_DATA', message: 'Only confirmed bookings can be marked as attended.' },
      }
    }

    await prisma.facilityBooking.update({
      where: { id: bookingId },
      data: {
        status: FacilityBookingStatus.ATTENDED,
        attendedAt: new Date(),
        markedAttendedBy: markedBy,
      },
    })

    revalidatePath('/apps/facility-calendar')

    return { success: true }
  } catch (error) {
    console.error('Mark attended error:', error)
    return {
      success: false,
      error: { code: 'UNKNOWN', message: 'An unexpected error occurred. Please try again.' },
    }
  }
}

export async function markAsNoShow(input: {
  bookingId: string
  markedBy: string
}): Promise<{ success: boolean; error?: BookingError }> {
  try {
    const { bookingId, markedBy } = input

    const booking = await prisma.facilityBooking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found.' } }
    }

    if (booking.status !== FacilityBookingStatus.CONFIRMED) {
      return {
        success: false,
        error: { code: 'INVALID_DATA', message: 'Only confirmed bookings can be marked as no-show.' },
      }
    }

    await prisma.facilityBooking.update({
      where: { id: bookingId },
      data: {
        status: FacilityBookingStatus.NO_SHOW,
        markedAttendedBy: markedBy,
      },
    })

    revalidatePath('/apps/facility-calendar')

    return { success: true }
  } catch (error) {
    console.error('Mark no-show error:', error)
    return {
      success: false,
      error: { code: 'UNKNOWN', message: 'An unexpected error occurred. Please try again.' },
    }
  }
}

export async function getFacilities(branchId?: string) {
  const facilities = await prisma.facility.findMany({
    where: {
      isActive: true,
      ...(branchId && { branchId }),
    },
    include: {
      bookingSlots: {
        where: { isActive: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
    orderBy: { name: 'asc' },
  })

  return facilities
}

export async function getAvailableSlots(input: {
  facilityId: string
  date: Date
}) {
  const { facilityId, date } = input

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  })

  if (!facility) {
    return []
  }

  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)
  const dayOfWeek = dateOnly.getDay()

  const slots = await prisma.bookingSlot.findMany({
    where: {
      facilityId,
      dayOfWeek,
      isActive: true,
    },
    orderBy: { startTime: 'asc' },
  })

  const existingBookings = await prisma.facilityBooking.groupBy({
    by: ['bookingSlotId'],
    where: {
      facilityId,
      bookingDate: dateOnly,
      status: { in: [FacilityBookingStatus.CONFIRMED, FacilityBookingStatus.ATTENDED] },
    },
    _count: { id: true },
  })

  const bookingCountMap = new Map(
    existingBookings.map((b) => [b.bookingSlotId, b._count.id])
  )

  return slots.map((slot) => {
    const bookedCount = bookingCountMap.get(slot.id) || 0
    const availableSpots = facility.maxCapacity - bookedCount

    return {
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      bookedCount,
      availableSpots,
      isFull: availableSpots <= 0,
    }
  })
}

export async function getMemberCredits(memberId: string) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      memberships: {
        where: { status: MembershipStatus.ACTIVE },
        include: {
          plan: true,
          benefitLedgers: {
            include: { benefit: true },
          },
        },
        orderBy: { endDate: 'desc' },
        take: 1,
      },
    },
  })

  if (!member || !member.memberships[0]) {
    return []
  }

  const activeMembership = member.memberships[0]

  return activeMembership.benefitLedgers.map((ledger) => ({
    benefitId: ledger.benefitId,
    benefitName: ledger.benefit.name,
    totalAllocated: ledger.totalAllocated,
    usedCount: ledger.usedCount,
    remainingCount: ledger.remainingCount,
  }))
}

export async function getMemberBookings(memberId: string, options?: { limit?: number; status?: FacilityBookingStatus[] }) {
  const bookings = await prisma.facilityBooking.findMany({
    where: {
      memberId,
      ...(options?.status && { status: { in: options.status } }),
    },
    include: {
      facility: true,
      bookingSlot: true,
    },
    orderBy: { bookingDate: 'desc' },
    take: options?.limit,
  })

  return bookings.map((booking) => ({
    id: booking.id,
    facilityName: booking.facility.name,
    facilityType: booking.facility.facilityType,
    bookingDate: booking.bookingDate,
    startTime: booking.bookingSlot.startTime,
    endTime: booking.bookingSlot.endTime,
    status: booking.status,
    bookedAt: booking.bookedAt,
    cancelledAt: booking.cancelledAt,
    attendedAt: booking.attendedAt,
  }))
}

export async function getAllBookingsForCalendar(input: {
  branchId?: string
  startDate: Date
  endDate: Date
  facilityIds?: string[]
}) {
  const { branchId, startDate, endDate, facilityIds } = input

  const bookings = await prisma.facilityBooking.findMany({
    where: {
      ...(branchId && { branchId }),
      ...(facilityIds && facilityIds.length > 0 && { facilityId: { in: facilityIds } }),
      bookingDate: {
        gte: startDate,
        lte: endDate,
      },
      status: { in: [FacilityBookingStatus.CONFIRMED, FacilityBookingStatus.ATTENDED] },
    },
    include: {
      facility: true,
      bookingSlot: true,
      member: {
        select: { id: true, firstName: true, lastName: true, phone: true },
      },
    },
    orderBy: [{ bookingDate: 'asc' }, { bookingSlot: { startTime: 'asc' } }],
  })

  return bookings.map((booking) => ({
    id: booking.id,
    title: `${booking.member.firstName} ${booking.member.lastName} - ${booking.facility.name}`,
    start: combineDateAndTime(booking.bookingDate, booking.bookingSlot.startTime),
    end: combineDateAndTime(booking.bookingDate, booking.bookingSlot.endTime),
    facilityId: booking.facilityId,
    facilityName: booking.facility.name,
    facilityType: booking.facility.facilityType,
    memberId: booking.member.id,
    memberName: `${booking.member.firstName} ${booking.member.lastName}`,
    memberPhone: booking.member.phone,
    status: booking.status,
    extendedProps: {
      bookingId: booking.id,
      status: booking.status,
    },
  }))
}

function combineDateAndTime(date: Date, timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(hours, minutes, 0, 0)
  return combined.toISOString()
}
