import type { Metadata } from 'next'
import MemberBookingPortal from '@/views/apps/member-bookings/MemberBookingPortal'
import { requirePermission } from '@/libs/serverAuth'
import { prisma } from '@/libs/prisma'
import { getFacilities, getMemberCredits, getMemberBookings } from '@/app/actions/bookings'
import { FacilityBookingStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Book Facilities',
  description: 'Book Sauna, Ice Bath, and other wellness facilities',
}

export default async function MemberBookingsPage() {
  const context = await requirePermission('self.view')
  
  const member = await prisma.member.findFirst({
    where: { 
      userId: context.userId,
      tenantId: context.tenantId,
    },
    select: { id: true, branchId: true },
  })

  if (!member) {
    return <div>No member profile found. Please contact support.</div>
  }

  const facilities = await getFacilities(member.branchId || undefined)
  const credits = await getMemberCredits(member.id)
  const upcomingBookings = await getMemberBookings(member.id, { 
    limit: 10,
    status: [FacilityBookingStatus.CONFIRMED] 
  })

  return (
    <MemberBookingPortal 
      memberId={member.id}
      initialFacilities={facilities}
      initialCredits={credits}
      initialBookings={upcomingBookings}
    />
  )
}
