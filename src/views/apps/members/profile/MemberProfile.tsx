'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'

import { freezeMembership, unfreezeMembership } from '@/app/actions/members'
import { toast } from 'react-toastify'
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'
import type { Locale } from '@configs/i18n'

type TimelineItem = {
  id: string
  type: 'attendance' | 'payment' | 'membership' | 'class' | 'goal' | 'lifecycle'
  title: string
  description: string
  date: Date
  icon: string
  color: string
}

type MemberProfileProps = {
  member: any
  onRefresh: () => void
}

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  SUSPENDED: 'error',
  PENDING: 'warning',
  CANCELLED: 'error',
  FROZEN: 'info',
}

const MemberProfile = ({ member, onRefresh }: MemberProfileProps) => {
  const { lang: locale } = useParams()
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false)
  const [freezeReason, setFreezeReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const activeMembership = member.memberships?.find((m: any) => m.status === 'ACTIVE' || m.status === 'FROZEN')
  const daysRemaining = activeMembership 
    ? Math.max(0, Math.ceil((new Date(activeMembership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0
  const totalDays = activeMembership
    ? Math.ceil((new Date(activeMembership.endDate).getTime() - new Date(activeMembership.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const progress = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 0

  const handleFreeze = async () => {
    if (!activeMembership) return

    try {
      setIsProcessing(true)
      await freezeMembership(activeMembership.id, freezeReason)
      toast.success('Membership frozen successfully')
      setFreezeDialogOpen(false)
      setFreezeReason('')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to freeze membership')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUnfreeze = async () => {
    if (!activeMembership) return

    try {
      setIsProcessing(true)
      await unfreezeMembership(activeMembership.id)
      toast.success('Membership unfrozen successfully')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to unfreeze membership')
    } finally {
      setIsProcessing(false)
    }
  }

  const getTimelineColor = (color: string) => {
    const colorMap: Record<string, 'success' | 'error' | 'primary' | 'warning' | 'info' | 'secondary' | 'grey'> = {
      success: 'success',
      error: 'error',
      primary: 'primary',
      warning: 'warning',
      info: 'info',
      secondary: 'secondary',
    }
    return colorMap[color] || 'grey'
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-8">
            <Avatar
              src={member.avatarUrl}
              sx={{ width: 100, height: 100, fontSize: '2rem' }}
            >
              {getInitials(`${member.firstName} ${member.lastName}`)}
            </Avatar>
            <div className="text-center">
              <Typography variant="h5">
                {member.firstName} {member.lastName}
              </Typography>
              <Typography color="text.secondary">
                {member.membershipId}
              </Typography>
              <Chip 
                label={member.status} 
                color={statusColors[member.status] || 'secondary'} 
                size="small"
                sx={{ mt: 1 }}
              />
            </div>
          </CardContent>
          <Divider />
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" className="mb-2">
              CONTACT INFO
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2">{member.email || '-'}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2">{member.phone || '-'}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Branch</Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2">{member.branch?.name || '-'}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Gender</Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2">{member.gender || '-'}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2">
                      {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <Divider />
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" className="mb-2">
              EMERGENCY CONTACT
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2">{member.emergencyContact || '-'}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2">{member.emergencyPhone || '-'}</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <Divider />
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" className="mb-2">
              STATS
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Total Visits</Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{member.totalAttendance}</Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Member Since</Typography>
                  </TableCell>
                  <TableCell sx={{ border: 0, py: 1 }}>
                    <Typography variant="body2">
                      {new Date(member.joinDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={6}>
          {activeMembership && (
            <Grid size={12}>
              <Card>
                <CardHeader 
                  title="Current Membership"
                  action={
                    <Box display="flex" gap={1}>
                      {activeMembership.status === 'ACTIVE' && (
                        <Button 
                          variant="outlined" 
                          color="info"
                          size="small"
                          onClick={() => setFreezeDialogOpen(true)}
                          disabled={isProcessing}
                        >
                          Freeze
                        </Button>
                      )}
                      {activeMembership.status === 'FROZEN' && (
                        <Button 
                          variant="contained" 
                          color="success"
                          size="small"
                          onClick={handleUnfreeze}
                          disabled={isProcessing}
                        >
                          Unfreeze
                        </Button>
                      )}
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Typography variant="h6">{activeMembership.plan?.name}</Typography>
                        <Chip 
                          label={activeMembership.status} 
                          color={statusColors[activeMembership.status]}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(activeMembership.startDate).toLocaleDateString()} - {new Date(activeMembership.endDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="text.secondary">Days Remaining</Typography>
                          <Typography variant="body2" fontWeight={600}>{daysRemaining} days</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={progress} 
                          color={daysRemaining < 7 ? 'error' : daysRemaining < 30 ? 'warning' : 'primary'}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {member.benefitBalances && member.benefitBalances.length > 0 && (
            <Grid size={12}>
              <Card>
                <CardHeader title="Benefit Balances" />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    {member.benefitBalances.map((balance: any) => (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={balance.id}>
                        <Box 
                          sx={{ 
                            p: 2, 
                            border: 1, 
                            borderColor: 'divider', 
                            borderRadius: 1,
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="h5" color="primary">{balance.currentBalance}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {balance.benefit?.name || 'Benefit'}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {member.goals && member.goals.length > 0 && (
            <Grid size={12}>
              <Card>
                <CardHeader title="Fitness Goals" />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    {member.goals.map((goal: any) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={goal.id}>
                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle2">{goal.goalType}</Typography>
                            <Chip 
                              label={goal.status} 
                              size="small" 
                              color={goal.status === 'ACHIEVED' ? 'success' : 'primary'}
                            />
                          </Box>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" color="text.secondary">
                              Target: {goal.targetValue} {goal.unit}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Current: {goal.currentValue || 0} {goal.unit}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(100, ((goal.currentValue || 0) / goal.targetValue) * 100)}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid size={12}>
            <Card>
              <CardHeader title="Activity Timeline" />
              <Divider />
              <CardContent sx={{ maxHeight: 500, overflow: 'auto' }}>
                {member.activityTimeline && member.activityTimeline.length > 0 ? (
                  <Timeline position="alternate">
                    {member.activityTimeline.map((item: TimelineItem) => (
                      <TimelineItem key={item.id}>
                        <TimelineOppositeContent color="text.secondary">
                          <Typography variant="caption">
                            {new Date(item.date).toLocaleDateString()}
                          </Typography>
                          <br />
                          <Typography variant="caption">
                            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color={getTimelineColor(item.color)} />
                          <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="subtitle2">{item.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">No activity recorded yet</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card>
              <CardHeader title="Recent Transactions" />
              <Divider />
              <CardContent>
                {member.transactions && member.transactions.length > 0 ? (
                  <Table size="small">
                    <TableBody>
                      {member.transactions.map((tx: any) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={tx.transactionType} 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              ₹{tx.amount.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={tx.status} 
                              size="small"
                              color={tx.status === 'COMPLETED' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">No transactions yet</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      <Dialog open={freezeDialogOpen} onClose={() => setFreezeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Freeze Membership</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Freezing will pause the membership. The end date will be extended by the number of frozen days when unfrozen.
          </Typography>
          <TextField
            fullWidth
            label="Reason (optional)"
            multiline
            rows={3}
            value={freezeReason}
            onChange={(e) => setFreezeReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFreezeDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="info" 
            onClick={handleFreeze}
            disabled={isProcessing}
          >
            Freeze Membership
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default MemberProfile
