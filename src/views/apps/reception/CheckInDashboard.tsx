'use client'

import { useState, useCallback, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'

import { checkInMember, searchMembers, getTodayCheckins, getCheckInStats } from '@/app/actions/checkin'
import { toast } from 'react-toastify'

interface Member {
  id: string
  name: string
  email: string
  phone: string
  membershipId: string
  hasActiveMembership: boolean
  avatar?: string
}

interface CheckinRecord {
  id: string
  memberName: string
  email: string
  phone: string
  checkInTime: Date
  planName?: string
  notes?: string
  avatar?: string
}

interface CheckinStats {
  totalCheckinsToday: number
  activeMemberships: number
  attendanceRate: number
}

export default function CheckInDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [todayCheckins, setTodayCheckins] = useState<CheckinRecord[]>([])
  const [stats, setStats] = useState<CheckinStats | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  // Load stats and today's checkins on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, checkinsData] = await Promise.all([getCheckInStats(), getTodayCheckins()])

        setStats(statsData)
        setTodayCheckins(checkinsData)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load check-in data')
      }
    }

    loadData()
  }, [])

  // Search members
  const handleSearch = useCallback(
    async (value: string) => {
      setSearchQuery(value)
      if (value.length < 2) {
        setMembers([])
        return
      }

      setLoading(true)
      try {
        const results = await searchMembers(value)
        setMembers(results)
      } catch (error) {
        console.error('Search error:', error)
        toast.error('Failed to search members')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Check in member
  const handleCheckIn = async () => {
    if (!selectedMember) {
      toast.error('Please select a member')
      return
    }

    if (!selectedMember.hasActiveMembership) {
      toast.error('Member does not have an active membership')
      return
    }

    setCheckingIn(true)
    try {
      const result = await checkInMember(selectedMember.id, { notes: notes || undefined })

      if (result.success) {
        setSuccessMessage(`${selectedMember.name} checked in successfully!`)
        setTimeout(() => setSuccessMessage(''), 3000)

        // Reset form
        setSelectedMember(null)
        setSearchQuery('')
        setNotes('')
        setMembers([])

        // Refresh data
        const [statsData, checkinsData] = await Promise.all([getCheckInStats(), getTodayCheckins()])

        setStats(statsData)
        setTodayCheckins(checkinsData)

        toast.success('Member checked in successfully!')
      } else {
        toast.error(result.error || 'Failed to check in member')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      toast.error('Failed to check in member')
    } finally {
      setCheckingIn(false)
    }
  }

  return (
    <Grid container spacing={6}>
      {/* Header Stats */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <Typography color="textSecondary" variant="body2">
                Today's Check-ins
              </Typography>
              <Typography variant="h4">{stats?.totalCheckinsToday || 0}</Typography>
              <Chip label="Updated" size="small" color="success" variant="outlined" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <Typography color="textSecondary" variant="body2">
                Active Members
              </Typography>
              <Typography variant="h4">{stats?.activeMemberships || 0}</Typography>
              <Chip label="Capacity" size="small" color="info" variant="outlined" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <Typography color="textSecondary" variant="body2">
                Attendance Rate
              </Typography>
              <Typography variant="h4">{stats?.attendanceRate.toFixed(1)}%</Typography>
              <Chip label="Today" size="small" color="success" variant="outlined" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Check-in Form */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title="Member Check-In" subheader="Quick member check-in for daily operations" />
          <CardContent>
            {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

            <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-start">
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) => `${option.name} (${option.membershipId})`}
                  value={selectedMember}
                  onChange={(_, newValue) => setSelectedMember(newValue)}
                  onInputChange={(_, value) => handleSearch(value)}
                  inputValue={searchQuery}
                  loading={loading}
                  disabled={checkingIn}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Member"
                      placeholder="Name, Email, Phone, or ID"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} display="flex" gap={1} alignItems="center">
                      <Avatar src={option.avatar} sx={{ width: 32, height: 32 }}>
                        {option.name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{option.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {option.email}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Box>

              <Box sx={{ flex: 1, minWidth: 300 }}>
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  placeholder="Any special notes about this check-in"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={checkingIn || !selectedMember}
                  multiline
                  rows={1}
                />
              </Box>

              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={handleCheckIn}
                disabled={checkingIn || !selectedMember || !selectedMember.hasActiveMembership}
                sx={{ mt: 1 }}
              >
                {checkingIn ? <CircularProgress size={24} /> : 'Check In'}
              </Button>
            </Box>

            {selectedMember && !selectedMember.hasActiveMembership && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                ⚠️ This member does not have an active membership
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Today's Check-ins */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title="Today's Check-ins" subheader={`${todayCheckins.length} member(s) checked in`} />
          <CardContent>
            {todayCheckins.length === 0 ? (
              <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                No check-ins yet today
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Member</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Check-in Time</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todayCheckins.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          <Box display="flex" gap={1} alignItems="center">
                            <Avatar src={record.avatar} sx={{ width: 32, height: 32 }}>
                              {record.memberName[0]}
                            </Avatar>
                            {record.memberName}
                          </Box>
                        </TableCell>
                        <TableCell>{record.email}</TableCell>
                        <TableCell>{record.phone}</TableCell>
                        <TableCell>{record.planName || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(record.checkInTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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
    </Grid>
  )
}
