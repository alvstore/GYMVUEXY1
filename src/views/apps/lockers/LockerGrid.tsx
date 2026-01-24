'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Autocomplete from '@mui/material/Autocomplete'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'

import type { LockerGridItem } from '@/app/actions/lockers'
import { getLockerGrid, assignLocker, releaseLocker, getLockerStats, setLockerMaintenance } from '@/app/actions/lockers'
import { getMembers } from '@/app/actions/members'

interface LockerGridProps {
  onRefresh?: () => void
}

export default function LockerGrid({ onRefresh }: LockerGridProps) {
  const [lockers, setLockers] = useState<LockerGridItem[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLocker, setSelectedLocker] = useState<LockerGridItem | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [syncWithMembership, setSyncWithMembership] = useState(true)
  const [includedInPlan, setIncludedInPlan] = useState(false)
  const [customEndDate, setCustomEndDate] = useState('')
  const [releaseReason, setReleaseReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [lockersData, statsData] = await Promise.all([
        getLockerGrid(),
        getLockerStats(),
      ])
      setLockers(lockersData)
      setStats(statsData)
    } catch (err: any) {
      setError(err.message || 'Failed to load locker data')
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const result = await getMembers({ limit: 100 })
      setMembers(result.members || [])
    } catch (err) {
      console.error('Failed to load members:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'AVAILABLE': return 'success'
      case 'OCCUPIED': return 'error'
      case 'MAINTENANCE': return 'warning'
      case 'OUT_OF_ORDER': return 'default'
      default: return 'default'
    }
  }

  const getLockerBgColor = (locker: LockerGridItem): string => {
    if (locker.assignment?.status === 'PENDING_REVIEW') {
      return 'rgba(255, 152, 0, 0.15)'
    }
    switch (locker.status) {
      case 'AVAILABLE': return 'rgba(76, 175, 80, 0.1)'
      case 'OCCUPIED': return 'rgba(244, 67, 54, 0.1)'
      case 'MAINTENANCE': return 'rgba(255, 152, 0, 0.1)'
      case 'OUT_OF_ORDER': return 'rgba(158, 158, 158, 0.2)'
      default: return 'transparent'
    }
  }

  const handleLockerClick = async (locker: LockerGridItem) => {
    setSelectedLocker(locker)
    setError(null)
    setSuccess(null)
    
    if (locker.status === 'AVAILABLE') {
      await loadMembers()
      setAssignDialogOpen(true)
    } else if (locker.status === 'OCCUPIED') {
      setReleaseDialogOpen(true)
    }
  }

  const handleAssign = async () => {
    if (!selectedLocker || !selectedMember) return
    
    setActionLoading(true)
    setError(null)
    
    try {
      const result = await assignLocker({
        lockerId: selectedLocker.id,
        memberId: selectedMember.id,
        syncWithMembership,
        customEndDate: syncWithMembership ? undefined : customEndDate,
        includedInPlan,
      })
      
      setSuccess(result.message)
      setAssignDialogOpen(false)
      setSelectedMember(null)
      setSyncWithMembership(true)
      setIncludedInPlan(false)
      setCustomEndDate('')
      await loadData()
      onRefresh?.()
    } catch (err: any) {
      setError(err.message || 'Failed to assign locker')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRelease = async () => {
    if (!selectedLocker) return
    
    setActionLoading(true)
    setError(null)
    
    try {
      const result = await releaseLocker(selectedLocker.id, releaseReason)
      setSuccess(result.message)
      setReleaseDialogOpen(false)
      setReleaseReason('')
      await loadData()
      onRefresh?.()
    } catch (err: any) {
      setError(err.message || 'Failed to release locker')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSetMaintenance = async (locker: LockerGridItem, underMaintenance: boolean) => {
    try {
      await setLockerMaintenance(locker.id, underMaintenance)
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to update maintenance status')
    }
  }

  const groupedLockers = lockers.reduce((acc, locker) => {
    const key = `Floor ${locker.floor} - Section ${locker.section}`
    if (!acc[key]) acc[key] = []
    acc[key].push(locker)
    return acc
  }, {} as Record<string, LockerGridItem[]>)

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary">{stats.total}</Typography>
                <Typography variant="body2" color="textSecondary">Total</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: 'success.light' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="success.dark">{stats.available}</Typography>
                <Typography variant="body2" color="success.dark">Available</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: 'error.light' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="error.dark">{stats.occupied}</Typography>
                <Typography variant="body2" color="error.dark">Occupied</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: 'warning.light' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="warning.dark">{stats.pendingReview}</Typography>
                <Typography variant="body2" color="warning.dark">Needs Review</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4">{stats.occupancyRate}%</Typography>
                <Typography variant="body2" color="textSecondary">Occupancy</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ bgcolor: 'info.light' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="info.dark">{stats.premium}</Typography>
                <Typography variant="body2" color="info.dark">Premium</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {Object.entries(groupedLockers).map(([section, sectionLockers]) => (
        <Box key={section} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>{section}</Typography>
          <Grid container spacing={1}>
            {sectionLockers.map((locker) => (
              <Grid item key={locker.id}>
                <Tooltip
                  title={
                    locker.assignment
                      ? `${locker.assignment.memberName} - Until ${locker.assignment.endDate}`
                      : locker.status
                  }
                >
                  <Card
                    sx={{
                      width: 70,
                      height: 70,
                      cursor: locker.status !== 'OUT_OF_ORDER' ? 'pointer' : 'default',
                      bgcolor: getLockerBgColor(locker),
                      border: locker.isPremium ? '2px solid gold' : '1px solid',
                      borderColor: locker.isPremium ? 'gold' : 'divider',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: locker.status !== 'OUT_OF_ORDER' ? 'scale(1.05)' : 'none',
                        boxShadow: locker.status !== 'OUT_OF_ORDER' ? 4 : 0,
                      },
                    }}
                    onClick={() => handleLockerClick(locker)}
                  >
                    <CardContent sx={{ p: 1, textAlign: 'center', '&:last-child': { pb: 1 } }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {locker.lockerNumber}
                      </Typography>
                      <Chip
                        label={locker.status.charAt(0)}
                        size="small"
                        color={getStatusColor(locker.status)}
                        sx={{ fontSize: '0.6rem', height: 18, mt: 0.5 }}
                      />
                      {locker.assignment?.status === 'PENDING_REVIEW' && (
                        <Typography variant="caption" display="block" color="warning.main" sx={{ fontSize: '0.5rem' }}>
                          REVIEW
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Locker {selectedLocker?.lockerNumber}
          {selectedLocker?.isPremium && (
            <Chip label="Premium" size="small" color="warning" sx={{ ml: 1 }} />
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              options={members}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.membershipId})`}
              value={selectedMember}
              onChange={(_, value) => setSelectedMember(value)}
              renderInput={(params) => (
                <TextField {...params} label="Select Member" required />
              )}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={syncWithMembership}
                  onChange={(e) => setSyncWithMembership(e.target.checked)}
                />
              }
              label="Sync with membership end date"
            />
            
            {!syncWithMembership && (
              <TextField
                type="date"
                label="Custom End Date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}
            
            <FormControlLabel
              control={
                <Switch
                  checked={includedInPlan}
                  onChange={(e) => setIncludedInPlan(e.target.checked)}
                />
              }
              label="Included in membership plan (no extra charge)"
            />
            
            {!includedInPlan && selectedLocker && (
              <Alert severity="info">
                Locker fee of ₹{selectedLocker.monthlyRate}/month will be added to member's balance due.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={!selectedMember || actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Assign Locker'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={releaseDialogOpen} onClose={() => setReleaseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Release Locker {selectedLocker?.lockerNumber}</DialogTitle>
        <DialogContent>
          {selectedLocker?.assignment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Currently assigned to:</strong> {selectedLocker.assignment.memberName}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Assignment ends: {selectedLocker.assignment.endDate}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <TextField
                fullWidth
                label="Reason for release (optional)"
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value)}
                multiline
                rows={2}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReleaseDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRelease}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Release Locker'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" color="textSecondary">Legend:</Typography>
        <Box display="flex" gap={2} mt={1} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'success.light', borderRadius: 0.5 }} />
            <Typography variant="caption">Available</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'error.light', borderRadius: 0.5 }} />
            <Typography variant="caption">Occupied</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'warning.light', borderRadius: 0.5 }} />
            <Typography variant="caption">Maintenance / Review</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 16, height: 16, border: '2px solid gold', borderRadius: 0.5 }} />
            <Typography variant="caption">Premium</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
