'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'

import { getLockerStats, getLockerAssignmentsForReview } from '@/app/actions/lockers'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  href: string
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
}

const quickActions: QuickAction[] = [
  {
    id: 'checkin',
    title: 'Member Check-in',
    description: 'Scan or search to check in members',
    icon: 'i-tabler-scan',
    href: '/en/apps/attendance',
    color: 'primary',
  },
  {
    id: 'attendance',
    title: 'Today\'s Attendance',
    description: 'View check-ins and check-outs',
    icon: 'i-tabler-users',
    href: '/en/apps/attendance/list',
    color: 'success',
  },
  {
    id: 'lockers',
    title: 'Locker Handovers',
    description: 'Assign or release lockers',
    icon: 'i-tabler-lock',
    href: '/en/apps/lockers/grid',
    color: 'warning',
  },
  {
    id: 'bookings',
    title: 'Facility Bookings',
    description: 'View today\'s facility bookings',
    icon: 'i-tabler-calendar',
    href: '/en/apps/facility-calendar',
    color: 'info',
  },
  {
    id: 'newmember',
    title: 'New Member',
    description: 'Register a new gym member',
    icon: 'i-tabler-user-plus',
    href: '/en/apps/members/add',
    color: 'secondary',
  },
  {
    id: 'classes',
    title: 'Class Schedule',
    description: 'View today\'s class schedule',
    icon: 'i-tabler-yoga',
    href: '/en/apps/classes',
    color: 'primary',
  },
]

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true)
  const [lockerStats, setLockerStats] = useState<any>(null)
  const [pendingReviews, setPendingReviews] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [stats, reviews] = await Promise.all([
          getLockerStats().catch(() => null),
          getLockerAssignmentsForReview().catch(() => []),
        ])
        setLockerStats(stats)
        setPendingReviews(reviews)
      } catch (err) {
        console.error('Failed to load staff dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()

    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" gutterBottom>Staff Dashboard</Typography>
          <Typography variant="body1" color="textSecondary">
            {formatDate(currentTime)} | {formatTime(currentTime)}
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search member by phone or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 300 }}
        />
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={action.id}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
              component="a"
              href={action.href}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: `${action.color}.light`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <i className={action.icon} style={{ fontSize: 24, color: `var(--mui-palette-${action.color}-main)` }} />
                </Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Locker Overview" />
            <CardContent>
              {lockerStats ? (
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Occupancy Rate</Typography>
                    <Typography variant="body2" fontWeight="bold">{lockerStats.occupancyRate}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(lockerStats.occupancyRate)} 
                    sx={{ mb: 3, height: 8, borderRadius: 4 }}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h5" color="success.main">{lockerStats.available}</Typography>
                        <Typography variant="caption">Available</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h5" color="error.main">{lockerStats.occupied}</Typography>
                        <Typography variant="caption">Occupied</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h5" color="warning.main">{lockerStats.pendingReview}</Typography>
                        <Typography variant="caption">Needs Review</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Button fullWidth variant="outlined" href="/en/apps/lockers/grid">
                    Open Locker Grid
                  </Button>
                </Box>
              ) : (
                <Alert severity="info">No locker data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Locker Reviews Needed" 
              subheader="Members with expired memberships"
              action={
                <Chip label={pendingReviews.length} color="warning" size="small" />
              }
            />
            <CardContent sx={{ maxHeight: 300, overflow: 'auto' }}>
              {pendingReviews.length > 0 ? (
                <List dense>
                  {pendingReviews.slice(0, 5).map((review) => (
                    <ListItem key={review.id} divider>
                      <ListItemAvatar>
                        <Avatar>{review.memberName.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={review.memberName}
                        secondary={`Locker ${review.lockerNumber} - ${review.daysOverdue} days overdue`}
                      />
                      <Chip 
                        label={review.hasActiveMembership ? 'Active' : 'Expired'} 
                        size="small"
                        color={review.hasActiveMembership ? 'success' : 'error'}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="success">No locker reviews pending</Alert>
              )}
              {pendingReviews.length > 5 && (
                <Button fullWidth sx={{ mt: 2 }} href="/en/apps/lockers/review">
                  View All ({pendingReviews.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
