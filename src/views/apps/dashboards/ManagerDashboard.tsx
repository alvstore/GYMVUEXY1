'use client'

import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { getManagerDashboardMetrics, getStaffList, getClassScheduleOverview, getMembershipRenewalAlerts } from '@/app/actions/dashboards/manager'
import { toast } from 'react-toastify'

export default function ManagerDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [staff, setStaff] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [renewals, setRenewals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [metricsData, staffData, classesData, renewalsData] = await Promise.all([
        getManagerDashboardMetrics(),
        getStaffList(),
        getClassScheduleOverview(),
        getMembershipRenewalAlerts(),
      ])

      setMetrics(metricsData)
      setStaff(staffData)
      setClasses(classesData)
      setRenewals(renewalsData)
    } catch (error) {
      toast.error('Failed to load dashboard')
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

  return (
    <Grid container spacing={6}>
      {/* Key Metrics */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box textAlign="center">
              <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                Total Members
              </Typography>
              <Typography variant="h4">{metrics?.totalMembers}</Typography>
              <Typography color="success.main" variant="caption">
                {metrics?.activeMembers} active
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box textAlign="center">
              <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                This Month Revenue
              </Typography>
              <Typography variant="h4">₹{(metrics?.totalRevenue / 1000).toFixed(1)}k</Typography>
              <Typography color="info.main" variant="caption">
                Income
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box textAlign="center">
              <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                Active Classes
              </Typography>
              <Typography variant="h4">{metrics?.activeClasses}</Typography>
              <Typography color="warning.main" variant="caption">
                Scheduled
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box textAlign="center">
              <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                Today Check-ins
              </Typography>
              <Typography variant="h4">{metrics?.todayCheckins}</Typography>
              <Typography color="secondary.main" variant="caption">
                Staff: {metrics?.staffCount}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Staff Management */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Staff Team" subheader={`${staff.length} team members`} />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id} hover>
                      <TableCell>
                        <Box display="flex" gap={1} alignItems="center">
                          <Avatar src={member.avatar} sx={{ width: 32, height: 32 }}>
                            {member.name[0]}
                          </Avatar>
                          {member.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={member.role} size="small" />
                      </TableCell>
                      <TableCell>{member.department}</TableCell>
                      <TableCell>{member.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Membership Renewals */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Expiring Soon" subheader={`${renewals.length} memberships`} />
          <CardContent>
            {renewals.length === 0 ? (
              <Alert severity="success">No expiring memberships in next 30 days</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Member</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Expires In</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {renewals.map((renewal) => (
                      <TableRow key={renewal.id} hover>
                        <TableCell>{renewal.memberName}</TableCell>
                        <TableCell>{renewal.plan}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${renewal.expiresIn} days`}
                            color={renewal.expiresIn <= 7 ? 'error' : 'warning'}
                            size="small"
                          />
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

      {/* Class Schedule */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title="Popular Classes" subheader={`${classes.length} active classes`} />
          <CardContent>
            <Grid container spacing={2}>
              {classes.map((cls) => (
                <Grid key={cls.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{cls.name}</Typography>
                      <Typography color="textSecondary" variant="body2" sx={{ my: 1 }}>
                        Trainer: {cls.trainer}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {cls.enrolled}/{cls.capacity} enrolled
                        </Typography>
                        <Chip
                          label={cls.type}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
