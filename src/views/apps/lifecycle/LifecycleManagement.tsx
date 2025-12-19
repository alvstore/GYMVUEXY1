'use client'

import { useState } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'

const LifecycleManagement = ({ membership, events }: { membership: any, events: any[] }) => {
  const [action, setAction] = useState('')

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'PAUSED': return 'tabler-player-pause'
      case 'RESUMED': return 'tabler-player-play'
      case 'UPGRADED': return 'tabler-arrow-up'
      case 'DOWNGRADED': return 'tabler-arrow-down'
      case 'CANCELLED': return 'tabler-x'
      case 'TRANSFERRED': return 'tabler-transfer'
      default: return 'tabler-circle'
    }
  }

  const getEventColor = (eventType: string): any => {
    switch (eventType) {
      case 'PAUSED': return 'warning'
      case 'RESUMED': return 'success'
      case 'UPGRADED': return 'success'
      case 'DOWNGRADED': return 'warning'
      case 'CANCELLED': return 'error'
      default: return 'primary'
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title='Membership Lifecycle Operations' />
          <CardContent>
            <div className='mb-6'>
              <Typography variant='body2' color='textSecondary' className='mb-4'>
                Current Status: <Chip label={membership?.status || 'N/A'} size='small' color='primary' />
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                Plan: {membership?.plan?.name}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                Start: {membership?.startDate ? new Date(membership.startDate).toLocaleDateString() : 'N/A'}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                End: {membership?.endDate ? new Date(membership.endDate).toLocaleDateString() : 'N/A'}
              </Typography>
            </div>

            <TextField
              select
              fullWidth
              label='Select Action'
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className='mb-4'
            >
              <MenuItem value='pause'>Pause Membership</MenuItem>
              <MenuItem value='resume'>Resume Membership</MenuItem>
              <MenuItem value='upgrade'>Upgrade Plan</MenuItem>
              <MenuItem value='downgrade'>Downgrade Plan</MenuItem>
              <MenuItem value='cancel'>Cancel Membership</MenuItem>
              <MenuItem value='transfer'>Transfer to Another Branch</MenuItem>
            </TextField>

            {action === 'pause' && (
              <div className='space-y-4'>
                <TextField fullWidth label='Duration (days)' type='number' />
                <TextField fullWidth label='Reason' multiline rows={3} />
                <TextField fullWidth label='Notes' multiline rows={2} />
                <Button variant='contained' color='warning' fullWidth>
                  Pause Membership
                </Button>
              </div>
            )}

            {action === 'resume' && (
              <div className='space-y-4'>
                <TextField fullWidth label='Effective Date' type='date' InputLabelProps={{ shrink: true }} />
                <TextField fullWidth label='Notes' multiline rows={2} />
                <Button variant='contained' color='success' fullWidth>
                  Resume Membership
                </Button>
              </div>
            )}

            {action === 'upgrade' && (
              <div className='space-y-4'>
                <TextField select fullWidth label='New Plan'>
                  <MenuItem value='premium'>Premium Plan</MenuItem>
                  <MenuItem value='elite'>Elite Plan</MenuItem>
                </TextField>
                <TextField fullWidth label='Pro-rata Credit' type='number' />
                <TextField fullWidth label='Notes' multiline rows={2} />
                <Button variant='contained' color='success' fullWidth>
                  Upgrade Membership
                </Button>
              </div>
            )}

            {action === 'cancel' && (
              <div className='space-y-4'>
                <TextField fullWidth label='Effective Date' type='date' InputLabelProps={{ shrink: true }} />
                <TextField fullWidth label='Reason' multiline rows={3} required />
                <TextField fullWidth label='Refund Amount' type='number' />
                <TextField fullWidth label='Notes' multiline rows={2} />
                <Button variant='contained' color='error' fullWidth>
                  Cancel Membership
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title='Lifecycle History' />
          <CardContent>
            <Timeline>
              {events?.map((event) => (
                <TimelineItem key={event.id}>
                  <TimelineOppositeContent color='textSecondary' sx={{ flex: 0.3 }}>
                    {new Date(event.createdAt).toLocaleDateString()}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={getEventColor(event.eventType)}>
                      <i className={getEventIcon(event.eventType)} />
                    </TimelineDot>
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant='body2' className='font-medium'>
                      {event.eventType}
                    </Typography>
                    <Typography variant='caption' color='textSecondary'>
                      {event.reason || event.notes || 'No details'}
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>

            {(!events || events.length === 0) && (
              <Typography variant='body2' color='textSecondary' className='text-center py-4'>
                No lifecycle events yet
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default LifecycleManagement
