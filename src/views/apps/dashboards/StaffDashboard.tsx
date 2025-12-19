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
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Avatar from '@mui/material/Avatar'
import {
  getStaffDashboardMetrics,
  getRecentCheckins,
  getTodayClasses,
  getQuickMemberSearch,
} from '@/app/actions/dashboards/staff'
import { toast } from 'react-toastify'
import { format } from 'date-fns'

export default function StaffDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [checkins, setCheckins] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadDashboard = async () => {
    try {
      const [metricsData, checkinsData, classesData] = await Promise.all([
        getStaffDashboardMetrics(),
        getRecentCheckins(),
        getTodayClasses(),
      ])

      setMetrics(metricsData)
      setCheckins(checkinsData)
      setClasses(classesData)
    } catch (error) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    setSearching(true)
    try {
      const results = await getQuickMemberSearch(searchTerm)
      setSearchResults(results)
    } catch (error) {
      toast.error('Search failed')
    } finally {
      setSearching(false)
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
                Today's Check-ins
              </Typography>
              <Typography variant="h4" color="primary">
                {metrics?.todayCheckins || 0}
              </Typography>
              <Typography color="warning.main" variant="caption">
                {metrics?.pendingCheckouts || 0} still in gym
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
                Total Members
              </Typography>
              <Typography variant="h4" color="success.main">
                {metrics?.totalMembers || 0}
              </Typography>
              <Typography color="textSecondary" variant="caption">
                Active members
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
              <Typography variant="h4" color="info.main">
                {metrics?.activeClasses || 0}
              </Typography>
              <Typography color="textSecondary" variant="caption">
                Scheduled today
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
                Pending Checkouts
              </Typography>
              <Typography variant="h4" color="warning.main">
                {metrics?.pendingCheckouts || 0}
              </Typography>
              <Typography color="textSecondary" variant="caption">
                Members in gym
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Member Quick Search */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Member Quick Search" />
          <CardContent>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="tabler-search" />
                  </InputAdornment>
                ),
                endAdornment: searching ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : null,
              }}
              sx={{ mb: 2 }}
            />
            <List dense>
              {searchResults.length === 0 && searchTerm.length >= 2 && !searching && (
                <ListItem>
                  <ListItemText primary="No members found" secondary="Try a different search term" />
                </ListItem>
              )}
              {searchResults.map((member) => (
                <ListItem key={member.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <ListItemAvatar>
                    <Avatar>{member.name.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={
                      <>
                        {member.phone} | {member.plan}
                      </>
                    }
                  />
                  <Chip
                    label={member.status}
                    size="small"
                    color={member.status === 'ACTIVE' ? 'success' : 'default'}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Check-ins */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardHeader title="Recent Check-ins" subheader="Today's attendance log" />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Check-in</TableCell>
                  <TableCell>Check-out</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {checkins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="textSecondary" py={4}>
                        No check-ins today yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  checkins.map((checkin) => (
                    <TableRow key={checkin.id}>
                      <TableCell>{checkin.memberName}</TableCell>
                      <TableCell>{checkin.phone}</TableCell>
                      <TableCell>{format(new Date(checkin.checkInTime), 'hh:mm a')}</TableCell>
                      <TableCell>
                        {checkin.checkOutTime
                          ? format(new Date(checkin.checkOutTime), 'hh:mm a')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={checkin.checkOutTime ? 'Checked Out' : 'In Gym'}
                          size="small"
                          color={checkin.checkOutTime ? 'default' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      {/* Today's Classes */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title="Today's Classes" subheader="Scheduled classes and enrollment" />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Class Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Trainer</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Enrolled</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary" py={4}>
                        No classes scheduled
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell>{cls.name}</TableCell>
                      <TableCell>
                        <Chip label={cls.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{cls.trainer}</TableCell>
                      <TableCell>{cls.capacity}</TableCell>
                      <TableCell>{cls.enrolled}</TableCell>
                      <TableCell>
                        <Chip
                          label={cls.enrolled >= cls.capacity ? 'Full' : 'Open'}
                          size="small"
                          color={cls.enrolled >= cls.capacity ? 'error' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  )
}
