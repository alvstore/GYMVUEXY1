'use client'

import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import { cancelBooking, markAsAttended, markAsNoShow } from '@/app/actions/bookings'
import { toast } from 'react-toastify'

interface BookingDetailModalProps {
  open: boolean
  booking: any
  onClose: () => void
  onUpdate: (booking: any) => void
  onRemove: (bookingId: string) => void
}

const BookingDetailModal = ({ open, booking, onClose, onUpdate, onRemove }: BookingDetailModalProps) => {
  const [loading, setLoading] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelForm, setShowCancelForm] = useState(false)

  const handleMarkAttended = async () => {
    setLoading(true)
    try {
      const result = await markAsAttended({
        bookingId: booking.bookingId || booking.id,
        markedBy: 'staff',
      })
      
      if (result.success) {
        toast.success('Booking marked as attended')
        onUpdate({ ...booking, status: 'ATTENDED' })
        onClose()
      } else {
        toast.error(result.error?.message || 'Failed to update booking')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkNoShow = async () => {
    setLoading(true)
    try {
      const result = await markAsNoShow({
        bookingId: booking.bookingId || booking.id,
        markedBy: 'staff',
      })
      
      if (result.success) {
        toast.success('Booking marked as no-show')
        onUpdate({ ...booking, status: 'NO_SHOW' })
        onClose()
      } else {
        toast.error(result.error?.message || 'Failed to update booking')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    setLoading(true)
    try {
      const result = await cancelBooking({
        bookingId: booking.bookingId || booking.id,
        cancelledBy: 'staff',
        reason: cancelReason,
      })
      
      if (result.success) {
        toast.success('Booking cancelled successfully')
        onRemove(booking.bookingId || booking.id)
        onClose()
      } else {
        toast.error(result.error?.message || 'Failed to cancel booking')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'primary'
      case 'ATTENDED': return 'success'
      case 'NO_SHOW': return 'warning'
      case 'CANCELLED': return 'error'
      default: return 'default'
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const isEditable = booking.status === 'CONFIRMED'

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='h6'>Booking Details</Typography>
          <Chip 
            label={booking.status} 
            color={getStatusColor(booking.status)}
            size='small'
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant='subtitle2' color='text.secondary'>Facility</Typography>
            <Typography variant='body1'>{booking.facilityName}</Typography>
          </Box>
          
          <Box>
            <Typography variant='subtitle2' color='text.secondary'>Member</Typography>
            <Typography variant='body1'>{booking.memberName}</Typography>
            {booking.memberPhone && (
              <Typography variant='body2' color='text.secondary'>{booking.memberPhone}</Typography>
            )}
          </Box>
          
          <Box>
            <Typography variant='subtitle2' color='text.secondary'>Time</Typography>
            <Typography variant='body1'>
              {formatDateTime(booking.start)}
              {booking.end && ` - ${new Date(booking.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
            </Typography>
          </Box>
          
          {showCancelForm && (
            <>
              <Divider />
              <TextField
                label='Cancellation Reason (Optional)'
                multiline
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                fullWidth
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        {loading ? (
          <CircularProgress size={24} />
        ) : showCancelForm ? (
          <>
            <Button onClick={() => setShowCancelForm(false)} color='inherit'>
              Back
            </Button>
            <Button onClick={handleCancelBooking} color='error' variant='contained'>
              Confirm Cancel
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} color='inherit'>
              Close
            </Button>
            {isEditable && (
              <>
                <Button onClick={() => setShowCancelForm(true)} color='error' variant='outlined'>
                  Cancel Booking
                </Button>
                <Button onClick={handleMarkNoShow} color='warning' variant='outlined'>
                  No Show
                </Button>
                <Button onClick={handleMarkAttended} color='success' variant='contained'>
                  Mark Attended
                </Button>
              </>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default BookingDetailModal
