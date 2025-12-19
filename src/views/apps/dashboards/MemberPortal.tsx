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
import { getMemberPortalData, getAvailableClasses, getMemberGoals, getMemberAttendanceHistory } from '@/app/actions/dashboards/member'
import { toast } from 'react-toastify'

interface MemberData {
  id: string
  name: string
  email: string | null
  phone: string
  joinDate: Date
  avatar: string | null
  activeMembership?: any
  goals: any[]
  recentAttendance: any[]
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

      setMember(memberData)
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

  return (
    <Grid container spacing={6}>
      {/* Shop Section - Quick Link */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title="Browse Products" subheader="Shop premium gym supplements and accessories" />
          <CardContent>
            <Button variant="contained" href="/apps/products">
              Go to Shop
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Member Profile Card */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Box display="flex" gap={3} alignItems="start">
              <Avatar src={member.avatar || undefined} sx={{ width: 100, height: 100 }}>
                {member.name[0]}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h4">{member.name}</Typography>
                <Typography color="textSecondary">{member.email}</Typography>
                <Box mt={2}>
                  {member.activeMembership ? (
                    <>
                      <Typography variant="subtitle2" color="success.main">
                        Active Membership
                      </Typography>
                      <Typography variant="body2">{member.activeMembership.planName}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {member.activeMembership.daysRemaining} days remaining
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          100,
                          (member.activeMembership.daysRemaining /
                            Math.ceil(
                              (member.activeMembership.endDate - member.activeMembership.startDate) /
                                (1000 * 60 * 60 * 24)
                            )) *
                            100
                        )}
                        sx={{ mt: 1 }}
                      />
                    </>
                  ) : (
                    <>
                      <Typography variant="subtitle2" color="error.main">
                        No Active Membership
                      </Typography>
                      <Button variant="contained" size="small" sx={{ mt: 1 }}>
                        Upgrade Plan
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Fitness Goals */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Fitness Goals" subheader={`${goals.length} active goals`} />
          <CardContent>
            {goals.length === 0 ? (
              <Alert severity="info">No active goals. Set one to get started!</Alert>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {goals.map((goal) => (
                  <Box key={goal.id}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight="500">
                        {goal.type}
                      </Typography>
                      <Typography variant="caption">{Math.round(goal.progress)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={goal.progress} />
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                      {goal.current} / {goal.target}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Attendance Summary */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Recent Check-ins" subheader={`${attendance.length} visits`} />
          <CardContent>
            {attendance.length === 0 ? (
              <Alert severity="info">No check-ins yet. Visit the gym!</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.slice(0, 5).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.checkInTime).toLocaleString()}
                        </TableCell>
                        <TableCell>{record.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Available Classes */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title="Available Classes" subheader="Browse and book classes" />
          <CardContent>
            {classes.length === 0 ? (
              <Alert severity="info">No classes available</Alert>
            ) : (
              <Grid container spacing={2}>
                {classes.map((cls) => (
                  <Grid key={cls.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {cls.name}
                        </Typography>
                        <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                          Trainer: {cls.trainer}
                        </Typography>
                        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                          <Chip label={cls.type} size="small" variant="outlined" />
                          <Chip label={`${cls.enrolled}/${cls.capacity}`} size="small" />
                        </Box>
                        <Button variant="contained" size="small" fullWidth>
                          Book Class
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
