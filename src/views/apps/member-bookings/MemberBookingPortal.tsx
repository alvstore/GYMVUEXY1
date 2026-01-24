'use client'

import { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { createBooking, getAvailableSlots, cancelBooking, getMemberCredits, getMemberBookings } from '@/app/actions/bookings'
import { toast } from 'react-toastify'

interface Facility {
  id: string
  name: string
  facilityType: string
  description: string | null
  maxCapacity: number
  durationMinutes: number
  linkedBenefitName: string | null
}

interface Credit {
  benefitId: string
  benefitName: string
  totalAllocated: number
  usedCount: number
  remainingCount: number
}

interface Booking {
  id: string
  facilityName: string
  facilityType: string
  bookingDate: Date
  startTime: string
  endTime: string
  status: string
}

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  bookedCount: number
  availableSpots: number
  isFull: boolean
}

interface MemberBookingPortalProps {
  memberId: string
  initialFacilities: Facility[]
  initialCredits: Credit[]
  initialBookings: Booking[]
}

const facilityIcons: Record<string, string> = {
  SAUNA: 'ri-fire-line',
  ICE_BATH: 'ri-snowflake-line',
  STEAM_ROOM: 'ri-cloud-line',
  POOL: 'ri-water-flash-line',
  MASSAGE: 'ri-hand-heart-line',
  GROUP_CLASS: 'ri-group-line',
  PERSONAL_TRAINING: 'ri-user-star-line',
  OTHER: 'ri-service-line',
}

const MemberBookingPortal = ({ memberId, initialFacilities, initialCredits, initialBookings }: MemberBookingPortalProps) => {
  const [facilities] = useState<Facility[]>(initialFacilities)
  const [credits, setCredits] = useState<Credit[]>(initialCredits)
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [loading, setLoading] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [bookingInProgress, setBookingInProgress] = useState(false)

  useEffect(() => {
    if (selectedFacility && selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedFacility, selectedDate])

  const loadAvailableSlots = async () => {
    if (!selectedFacility) return
    
    setSlotsLoading(true)
    try {
      const slots = await getAvailableSlots({
        facilityId: selectedFacility.id,
        date: selectedDate.toDate(),
      })
      setAvailableSlots(slots)
    } catch (error) {
      toast.error('Failed to load available time slots')
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleFacilitySelect = (facility: Facility) => {
    setSelectedFacility(facility)
    setAvailableSlots([])
  }

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.isFull) {
      toast.warning('This time slot is fully booked')
      return
    }
    setSelectedSlot(slot)
    setBookingDialogOpen(true)
  }

  const handleConfirmBooking = async () => {
    if (!selectedFacility || !selectedSlot) return

    setBookingInProgress(true)
    try {
      const result = await createBooking({
        memberId,
        facilityId: selectedFacility.id,
        bookingSlotId: selectedSlot.id,
        bookingDate: selectedDate.toDate(),
      })

      if (result.success && result.data) {
        toast.success(`Booking confirmed! You have ${result.data.remainingCredits} ${selectedFacility.name} sessions remaining.`)
        setBookingDialogOpen(false)
        setSelectedSlot(null)
        
        const [updatedCredits, updatedBookings] = await Promise.all([
          getMemberCredits(memberId),
          getMemberBookings(memberId, { limit: 10, status: ['CONFIRMED'] as any }),
        ])
        setCredits(updatedCredits)
        setBookings(updatedBookings)
        loadAvailableSlots()
      } else {
        toast.error(result.error?.message || 'Failed to create booking')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setBookingInProgress(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    setLoading(true)
    try {
      const result = await cancelBooking({
        bookingId,
        cancelledBy: memberId,
      })

      if (result.success) {
        toast.success('Booking cancelled. Your credit has been refunded.')
        const [updatedCredits, updatedBookings] = await Promise.all([
          getMemberCredits(memberId),
          getMemberBookings(memberId, { limit: 10, status: ['CONFIRMED'] as any }),
        ])
        setCredits(updatedCredits)
        setBookings(updatedBookings)
      } else {
        toast.error(result.error?.message || 'Failed to cancel booking')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getCreditForFacility = (facility: Facility): Credit | undefined => {
    return credits.find(c => 
      c.benefitName.toLowerCase() === facility.linkedBenefitName?.toLowerCase()
    )
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <Typography variant='h4' sx={{ mb: 2 }}>Book Facilities</Typography>
          <Typography variant='body1' color='text.secondary'>
            Select a facility and choose an available time slot
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title='My Credits' />
            <CardContent>
              {credits.length === 0 ? (
                <Alert severity='info'>No facility credits available</Alert>
              ) : (
                <List disablePadding>
                  {credits.map((credit, index) => (
                    <Box key={credit.benefitId}>
                      {index > 0 && <Divider sx={{ my: 2 }} />}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant='subtitle2'>{credit.benefitName}</Typography>
                          <Typography variant='subtitle2' color='primary'>
                            {credit.remainingCount} / {credit.totalAllocated}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant='determinate' 
                          value={(credit.remainingCount / credit.totalAllocated) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
                          {credit.usedCount} used, {credit.remainingCount} remaining
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 4 }}>
            <CardHeader title='Upcoming Bookings' />
            <CardContent>
              {bookings.length === 0 ? (
                <Alert severity='info'>No upcoming bookings</Alert>
              ) : (
                <List disablePadding>
                  {bookings.map((booking, index) => (
                    <Box key={booking.id}>
                      {index > 0 && <Divider sx={{ my: 2 }} />}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant='subtitle2'>{booking.facilityName}</Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {formatDate(booking.bookingDate)}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </Typography>
                        </Box>
                        <Button 
                          size='small' 
                          color='error'
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader title='Select Facility' />
            <CardContent>
              <Grid container spacing={3}>
                {facilities.map((facility) => {
                  const credit = getCreditForFacility(facility)
                  const isSelected = selectedFacility?.id === facility.id
                  const hasCredits = credit && credit.remainingCount > 0

                  return (
                    <Grid size={{ xs: 12, sm: 6 }} key={facility.id}>
                      <Card 
                        variant={isSelected ? 'elevation' : 'outlined'}
                        sx={{ 
                          cursor: hasCredits ? 'pointer' : 'not-allowed',
                          opacity: hasCredits ? 1 : 0.6,
                          border: isSelected ? '2px solid' : undefined,
                          borderColor: isSelected ? 'primary.main' : undefined,
                          transition: 'all 0.2s',
                          '&:hover': hasCredits ? { boxShadow: 4 } : undefined,
                        }}
                        onClick={() => hasCredits && handleFacilitySelect(facility)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'action.hover',
                              }}
                            >
                              <i className={facilityIcons[facility.facilityType] || facilityIcons.OTHER} style={{ fontSize: 24 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant='subtitle1'>{facility.name}</Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {facility.durationMinutes} min session
                              </Typography>
                            </Box>
                          </Box>
                          {credit ? (
                            <Chip 
                              label={`${credit.remainingCount} sessions left`}
                              color={credit.remainingCount > 0 ? 'success' : 'error'}
                              size='small'
                            />
                          ) : (
                            <Chip label='Not included in plan' size='small' />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </CardContent>
          </Card>

          {selectedFacility && (
            <Card sx={{ mt: 4 }}>
              <CardHeader 
                title={`Book ${selectedFacility.name}`}
                subheader='Select a date and time slot'
              />
              <CardContent>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <DateCalendar
                      value={selectedDate}
                      onChange={handleDateChange}
                      minDate={dayjs()}
                      maxDate={dayjs().add(30, 'day')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <Typography variant='subtitle2' sx={{ mb: 2 }}>
                      Available slots for {selectedDate.format('dddd, MMMM D')}
                    </Typography>
                    
                    {slotsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : availableSlots.length === 0 ? (
                      <Alert severity='info'>No slots available for this date</Alert>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant={slot.isFull ? 'outlined' : 'contained'}
                            color={slot.isFull ? 'inherit' : 'primary'}
                            size='small'
                            disabled={slot.isFull}
                            onClick={() => handleSlotSelect(slot)}
                            sx={{ 
                              minWidth: 100,
                              opacity: slot.isFull ? 0.5 : 1,
                            }}
                          >
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant='body2'>
                                {formatTime(slot.startTime)}
                              </Typography>
                              {!slot.isFull && (
                                <Typography variant='caption' sx={{ display: 'block' }}>
                                  {slot.availableSpots} spots
                                </Typography>
                              )}
                            </Box>
                          </Button>
                        ))}
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog open={bookingDialogOpen} onClose={() => !bookingInProgress && setBookingDialogOpen(false)}>
        <DialogTitle>Confirm Booking</DialogTitle>
        <DialogContent>
          {selectedFacility && selectedSlot && (
            <Box sx={{ py: 2 }}>
              <Typography variant='body1' sx={{ mb: 2 }}>
                You are about to book:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant='subtitle2'>{selectedFacility.name}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {selectedDate.format('dddd, MMMM D, YYYY')}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </Typography>
              </Box>
              <Alert severity='info' sx={{ mt: 3 }}>
                This will use 1 session credit from your membership.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)} disabled={bookingInProgress}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmBooking} 
            variant='contained'
            disabled={bookingInProgress}
          >
            {bookingInProgress ? <CircularProgress size={20} /> : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

export default MemberBookingPortal
