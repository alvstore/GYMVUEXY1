import type { Metadata } from 'next'
import Card from '@mui/material/Card'
import FacilityCalendarWrapper from '@/views/apps/facility-calendar/FacilityCalendarWrapper'
import AppFullCalendar from '@/libs/styles/AppFullCalendar'
import { getFacilities, getAllBookingsForCalendar } from '@/app/actions/bookings'

export const metadata: Metadata = {
  title: 'Facility Booking Calendar',
  description: 'View and manage facility bookings for Sauna, Ice Bath, and other amenities',
}

export default async function FacilityCalendarPage() {
  const facilities = await getFacilities()
  
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0)
  
  const bookings = await getAllBookingsForCalendar({
    startDate,
    endDate,
  })

  return (
    <Card className='overflow-visible'>
      <AppFullCalendar className='app-calendar'>
        <FacilityCalendarWrapper 
          initialFacilities={facilities} 
          initialBookings={bookings}
        />
      </AppFullCalendar>
    </Card>
  )
}
