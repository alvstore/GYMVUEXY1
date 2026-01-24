'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  variant?: 'default' | 'relaxed' | 'minimal'
}

const relaxedMessages = [
  { title: 'All caught up!', description: 'Relax, nothing to do here right now.' },
  { title: 'Peace and quiet', description: 'No items to display at the moment.' },
  { title: 'Clear skies ahead', description: 'Everything is in order.' },
]

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  variant = 'default' 
}: EmptyStateProps) {
  const getRelaxedMessage = () => {
    const randomIndex = Math.floor(Math.random() * relaxedMessages.length)
    return relaxedMessages[randomIndex]
  }

  const displayTitle = variant === 'relaxed' ? getRelaxedMessage().title : title
  const displayDescription = variant === 'relaxed' ? getRelaxedMessage().description : description

  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: variant === 'minimal' ? 4 : 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      {icon && (
        <Box 
          sx={{ 
            mb: 2,
            color: 'text.secondary',
            opacity: 0.6,
          }}
        >
          {icon}
        </Box>
      )}
      {!icon && variant !== 'minimal' && (
        <Box 
          sx={{ 
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h3" sx={{ opacity: 0.4 }}>
            {variant === 'relaxed' ? '🧘' : '📭'}
          </Typography>
        </Box>
      )}
      <Typography 
        variant={variant === 'minimal' ? 'body1' : 'h6'} 
        color="textSecondary" 
        gutterBottom
      >
        {displayTitle}
      </Typography>
      {displayDescription && (
        <Typography 
          variant="body2" 
          color="textSecondary" 
          sx={{ maxWidth: 400, mb: action ? 3 : 0 }}
        >
          {displayDescription}
        </Typography>
      )}
      {action && (
        <Button 
          variant="contained" 
          onClick={action.onClick}
          href={action.href}
        >
          {action.label}
        </Button>
      )}
    </Box>
  )
}

export function NoBookingsToday() {
  return (
    <EmptyState
      title="Relax, no sessions today"
      description="No facility bookings scheduled for today. Enjoy the calm!"
      variant="relaxed"
    />
  )
}

export function NoMembersFound() {
  return (
    <EmptyState
      title="No members found"
      description="Try adjusting your search or filters."
      variant="default"
    />
  )
}

export function NoDataAvailable({ message }: { message?: string }) {
  return (
    <EmptyState
      title="No data available"
      description={message || "There's nothing to display here yet."}
      variant="minimal"
    />
  )
}

export function NoUpcomingBookings() {
  return (
    <EmptyState
      title="No upcoming bookings"
      description="Book a facility session to see it here."
      action={{
        label: 'Book a Session',
        href: '/en/member-portal/bookings',
      }}
    />
  )
}

export function NoLockersAvailable() {
  return (
    <EmptyState
      title="All lockers occupied"
      description="All lockers are currently assigned. Check back later."
      variant="default"
    />
  )
}

export function NoPendingReviews() {
  return (
    <EmptyState
      title="All clear!"
      description="No locker assignments need review. Great job keeping things organized!"
      variant="relaxed"
    />
  )
}
