'use client'

import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import LinearProgress from '@mui/material/LinearProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { getMemberPortalData, getAvailableClasses, getMemberGoals, getMemberAttendanceHistory } from '@/app/actions/dashboards/member'
import { toast } from 'react-toastify'

interface MemberData {
  id: string
  name: string
  email: string | null
  phone: string
  joinDate: Date
  avatar: string | null
  activeMembership: {
    id: string
    planName: string
    planDescription: string | null
    startDate: Date
    endDate: Date
    daysRemaining: number
    features: string[]
    benefits: Array<{
      id: string
      name: string
      description: string | null
      type: string
      quantity: number
      accrualType: string
    }>
    gymAccess: boolean
    poolAccess: boolean
    lockerAccess: boolean
    personalTrainer: boolean
    groupClasses: boolean
  } | null
  goals: any[]
  recentAttendance: any[]
  benefitBalances: Array<{
    id: string
    name: string
    type: string
    balance: number
    totalAccrued: number
    totalConsumed: number
  }>
}

const benefitIcons: Record<string, string> = {
  GUEST_PASS: 'ri-user-add-line',
  CLASS_CREDIT: 'ri-calendar-check-line',
  SESSION_CREDIT: 'ri-user-star-line',
  FACILITY_ACCESS: 'ri-key-2-line',
  MERCHANDISE_CREDIT: 'ri-shopping-bag-line',
  DISCOUNT_VOUCHER: 'ri-coupon-line',
  CUSTOM: 'ri-gift-line',
}

export default function MemberPortal({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<MemberData | null>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPortalData()
  }, [memberId])

  const loadPortalData = async () => {
    try {
      const [memberData, classesData, goalsData, attendanceData] = await Promise.all([
        getMemberPortalData(memberId),
        getAvailableClasses(),
        getMemberGoals(memberId),
        getMemberAttendanceHistory(memberId),
      ])

      setMember(memberData as MemberData)
      setClasses(classesData)
      setGoals(goalsData)
      setAttendance(attendanceData)
    } catch (error) {
      toast.error('Failed to load member data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!member) {
    return <Alert severity="error">Member not found</Alert>
  }

  const totalDays = member.activeMembership
    ? Math.ceil((new Date(member.activeMembership.endDate).getTime() - new Date(member.activeMembership.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Typography variant="h4" fontWeight="bold">My Portal</Typography>
        <Typography variant="body2" color="text.secondary">Welcome back, {member.name.split(' ')[0]}!</Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardContent>
            <Box display="flex" gap={3} alignItems="start">
              <Avatar src={member.avatar || undefined} sx={{ width: 100, height: 100, fontSize: 40 }}>
                {member.name[0]}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h5" fontWeight="bold">{member.name}</Typography>
                <Typography color="text.secondary">{member.email}</Typography>
                <Typography variant="body2" color="text.secondary">{member.phone}</Typography>
                
                <Box mt={2}>
                  {member.activeMembership ? (
                    <>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Chip label="Active" color="success" size="small" />
                        <Typography variant="h6">{member.activeMembership.planName}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {member.activeMembership.planDescription}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Typography variant="body2">
                          <strong>{member.activeMembership.daysRemaining}</strong> days remaining
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Expires: {new Date(member.activeMembership.endDate).toLocaleDateString('en-IN')})
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, Math.min(100, (member.activeMembership.daysRemaining / totalDays) * 100))}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </>
                  ) : (
                    <Box>
                      <Chip label="No Active Membership" color="error" size="small" />
                      <Button variant="contained" size="small" sx={{ ml: 2 }}>
                        Subscribe Now
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Quick Access" />
          <CardContent>
            <Box display="flex" flexDirection="column" gap={2}>
              {member.activeMembership?.gymAccess && (
                <Chip icon={<i className="ri-home-line" />} label="Gym Access" color="success" variant="outlined" />
              )}
              {member.activeMembership?.poolAccess && (
                <Chip icon={<i className="ri-water-flash-line" />} label="Pool Access" color="info" variant="outlined" />
              )}
              {member.activeMembership?.lockerAccess && (
                <Chip icon={<i className="ri-key-line" />} label="Locker Access" color="primary" variant="outlined" />
              )}
              {member.activeMembership?.groupClasses && (
                <Chip icon={<i className="ri-group-line" />} label="Group Classes" color="secondary" variant="outlined" />
              )}
              {member.activeMembership?.personalTrainer && (
                <Chip icon={<i className="ri-user-star-line" />} label="Personal Trainer" color="warning" variant="outlined" />
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {member.activeMembership && member.activeMembership.benefits && member.activeMembership.benefits.length > 0 && (
        <Grid size={12}>
          <Card>
            <CardHeader 
              title="Your Plan Benefits" 
              subheader={`Included with ${member.activeMembership.planName}`}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                {member.activeMembership.benefits.map((benefit) => (
                  <Grid key={benefit.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box 
                      sx={{ 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <i className={benefitIcons[benefit.type] || 'ri-gift-line'} />
                      </Avatar>
                      <Box>
                        <Typography fontWeight="medium">{benefit.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {benefit.quantity >= 999 
                            ? 'Unlimited' 
                            : `${benefit.quantity} ${benefit.accrualType === 'MONTHLY' ? '/month' : benefit.accrualType === 'YEARLY' ? '/year' : ''}`}
                        </Typography>
                        {benefit.description && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {benefit.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      {member.benefitBalances && Array.isArray(member.benefitBalances) && member.benefitBalances.length > 0 && (
        <Grid size={12}>
          <Card>
            <CardHeader title="Your Benefit Balances" subheader="Credits available to use" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                {member.benefitBalances.map((balance) => (
                  <Grid key={balance.id} size={{ xs: 6, sm: 4, md: 3 }}>
                    <Box textAlign="center" p={2} sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {balance.balance}
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">{balance.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Used: {balance.totalConsumed} / {balance.totalAccrued}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Fitness Goals" subheader={`${goals.length} active goals`} />
          <Divider />
          <CardContent>
            {goals.length === 0 ? (
              <Alert severity="info">No active goals. Set one to get started!</Alert>
            ) : (
              <Box display="flex" flexDirection="column" gap={3}>
                {goals.map((goal) => (
                  <Box key={goal.id}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {goal.title || goal.type}
                      </Typography>
                      <Typography variant="caption" color="primary.main" fontWeight="bold">
                        {Math.round(goal.progress)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={goal.progress} 
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    {goal.targetDate && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Target: {new Date(goal.targetDate).toLocaleDateString('en-IN')}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Recent Check-ins" subheader={`Last ${attendance.length} visits`} />
          <Divider />
          <CardContent>
            {attendance.length === 0 ? (
              <Alert severity="info">No check-ins yet. Visit the gym!</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Check In</TableCell>
                      <TableCell>Check Out</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.checkIn).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell>
                          {new Date(record.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          {record.checkOut 
                            ? new Date(record.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardHeader title="Available Classes" subheader="Book your next workout" />
          <Divider />
          <CardContent>
            {classes.length === 0 ? (
              <Alert severity="info">No classes available at the moment.</Alert>
            ) : (
              <Grid container spacing={2}>
                {classes.slice(0, 6).map((cls) => (
                  <Grid key={cls.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box 
                      sx={{ 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 2 
                      }}
                    >
                      <Typography fontWeight="medium">{cls.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {cls.type} | {cls.trainer}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                        <Chip 
                          size="small" 
                          label={`${cls.enrolled}/${cls.capacity}`} 
                          color={cls.enrolled >= cls.capacity ? 'error' : 'success'}
                        />
                        <Button size="small" variant="outlined" disabled={cls.enrolled >= cls.capacity}>
                          Book
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardHeader title="Browse Products" subheader="Shop premium gym supplements and accessories" />
          <CardContent>
            <Button variant="contained" href="/apps/products" startIcon={<i className="ri-shopping-bag-line" />}>
              Go to Shop
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
