'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import FacilityCalendar from './FacilityCalendar'
import FacilitySidebar from './FacilitySidebar'
import BookingDetailModal from './BookingDetailModal'

interface FacilityCalendarWrapperProps {
  initialFacilities: any[]
  initialBookings: any[]
}

const FacilityCalendarWrapper = ({ initialFacilities, initialBookings }: FacilityCalendarWrapperProps) => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>(initialFacilities.map(f => f.id))
  const [calendarApi, setCalendarApi] = useState<any>(null)
  const [bookings, setBookings] = useState(initialBookings)

  const mdAbove = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'))

  const handleLeftSidebarToggle = () => setLeftSidebarOpen(!leftSidebarOpen)

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking)
  }

  const handleCloseModal = () => {
    setSelectedBooking(null)
  }

  const handleBookingUpdate = (updatedBooking: any) => {
    setBookings(prev => 
      prev.map(b => b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b)
    )
  }

  const handleBookingRemove = (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId))
  }

  const facilityColors: Record<string, string> = {
    SAUNA: '#FF6B6B',
    ICE_BATH: '#4ECDC4',
    STEAM_ROOM: '#9B59B6',
    POOL: '#3498DB',
    MASSAGE: '#F39C12',
    GROUP_CLASS: '#27AE60',
    PERSONAL_TRAINING: '#E74C3C',
    OTHER: '#95A5A6',
  }

  const filteredBookings = bookings.filter(b => selectedFacilityIds.includes(b.facilityId))

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <FacilitySidebar
        mdAbove={mdAbove}
        leftSidebarOpen={leftSidebarOpen}
        handleLeftSidebarToggle={handleLeftSidebarToggle}
        facilities={initialFacilities}
        selectedFacilityIds={selectedFacilityIds}
        setSelectedFacilityIds={setSelectedFacilityIds}
        facilityColors={facilityColors}
        calendarApi={calendarApi}
      />
      <Box sx={{ flex: 1, p: 4, overflow: 'hidden' }}>
        <FacilityCalendar
          bookings={filteredBookings}
          calendarApi={calendarApi}
          setCalendarApi={setCalendarApi}
          handleLeftSidebarToggle={handleLeftSidebarToggle}
          onBookingClick={handleBookingClick}
          facilityColors={facilityColors}
        />
      </Box>
      {selectedBooking && (
        <BookingDetailModal
          open={!!selectedBooking}
          booking={selectedBooking}
          onClose={handleCloseModal}
          onUpdate={handleBookingUpdate}
          onRemove={handleBookingRemove}
        />
      )}
    </Box>
  )
}

export default FacilityCalendarWrapper
