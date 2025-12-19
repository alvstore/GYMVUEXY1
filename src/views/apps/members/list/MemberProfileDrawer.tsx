'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Chip,
  Avatar,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
  Alert
} from '@mui/material'
import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'

import type { Member } from '@/types/apps/memberTypes'

interface MemberProfileDrawerProps {
  open: boolean
  memberId: string | null
  onClose: () => void
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`member-tabpanel-${index}`}
      aria-labelledby={`member-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `member-tab-${index}`,
    'aria-controls': `member-tabpanel-${index}`
  }
}

const ProfileHeaderBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden'
}))

const MemberStatusColor: Record<string, any> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  EXPIRED: 'error',
  FROZEN: 'warning',
  PENDING: 'info'
}

const MemberProfileDrawer = ({ open, memberId, onClose }: MemberProfileDrawerProps) => {
  const [tabValue, setTabValue] = useState(0)

  // In a real app, you'd fetch member data via server action
  // For now, mock data structure
  const mockMemberData: Member = {
    id: memberId || '',
    tenantId: 'tenant-demo-001',
    branchId: 'branch-main',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    membershipId: 'MEM-001',
    status: 'ACTIVE',
    membershipPlan: 'Premium',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2025-01-15'),
    lastAttendance: new Date('2024-11-20'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-11-22')
  }

  const mockGoals = [
    {
      id: 'goal-1',
      memberId: memberId,
      goalType: 'WEIGHT_LOSS',
      currentValue: 85,
      targetValue: 75,
      unit: 'kg',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-15'),
      targetDate: new Date('2024-06-15'),
      progress: 55
    },
    {
      id: 'goal-2',
      memberId: memberId,
      goalType: 'STRENGTH',
      currentValue: 65,
      targetValue: 100,
      unit: 'kg',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-03-01'),
      targetDate: new Date('2024-12-01'),
      progress: 35
    }
  ]

  const mockMembershipHistory = [
    {
      id: 'mem-1',
      plan: 'Basic',
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-12-31'),
      status: 'EXPIRED',
      amount: 199
    },
    {
      id: 'mem-2',
      plan: 'Premium',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-01-15'),
      status: 'ACTIVE',
      amount: 299
    }
  ]

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  if (!open || !memberId) return null

  const member = mockMemberData
  const statusColor = MemberStatusColor[member.status] || 'default'

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 500 },
          boxShadow: 3
        }
      }}
    >
      <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h5' component='h2'>
            Member Profile
          </Typography>
          <IconButton onClick={onClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Profile Header Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <CustomAvatar
                skin='light'
                variant='rounded'
                sx={{
                  width: 100,
                  height: 100,
                  margin: '0 auto',
                  mb: 2,
                  fontSize: '3rem'
                }}
              >
                {getInitials(`${member.firstName} ${member.lastName}`)}
              </CustomAvatar>
              <Typography variant='h6' sx={{ mb: 1 }}>
                {member.firstName} {member.lastName}
              </Typography>
              <Chip
                label={member.status}
                color={statusColor as any}
                variant='tonal'
                size='small'
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant='body2' color='textSecondary'>
                  ID: {member.membershipId}
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  •
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  {member.membershipPlan}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Email
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {member.email}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Phone
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {member.phone}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Member Since
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {member.startDate.toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Membership Expiry
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {member.endDate.toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Last Visit
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {member.lastAttendance?.toLocaleDateString() || 'Never'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label='member profile tabs'>
            <Tab label='Goals' {...a11yProps(0)} />
            <Tab label='Membership History' {...a11yProps(1)} />
            <Tab label='Activity' {...a11yProps(2)} />
          </Tabs>
        </Box>

        {/* Goals Tab */}
        <TabPanel value={tabValue} index={0}>
          {mockGoals.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {mockGoals.map(goal => (
                <Card key={goal.id} variant='outlined'>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant='subtitle2' sx={{ textTransform: 'capitalize' }}>
                        {goal.goalType?.replace(/_/g, ' ').toLowerCase()}
                      </Typography>
                      <Chip
                        label={goal.status || 'IN_PROGRESS'}
                        size='small'
                        color={goal.status === 'COMPLETED' ? 'success' : 'primary'}
                        variant='tonal'
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant='body2'>
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </Typography>
                        <Typography variant='body2' color='textSecondary'>
                          {goal.progress || 0}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'action.hover',
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${goal.progress || 0}%`,
                            backgroundColor: 'primary.main',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box>
                        <Typography variant='caption' color='textSecondary'>
                          Start Date
                        </Typography>
                        <Typography variant='body2'>
                          {goal.startDate.toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant='caption' color='textSecondary'>
                          Target Date
                        </Typography>
                        <Typography variant='body2'>
                          {goal.targetDate.toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Alert severity='info'>No goals created yet</Alert>
          )}
        </TabPanel>

        {/* Membership History Tab */}
        <TabPanel value={tabValue} index={1}>
          {mockMembershipHistory.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {mockMembershipHistory.map(history => (
                <Card key={history.id} variant='outlined'>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant='subtitle2'>{history.plan}</Typography>
                        <Typography variant='body2' color='textSecondary' sx={{ mt: 0.5 }}>
                          ${history.amount}
                        </Typography>
                      </Box>
                      <Chip
                        label={history.status}
                        size='small'
                        color={history.status === 'ACTIVE' ? 'success' : 'default'}
                        variant='tonal'
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Box>
                        <Typography variant='caption' color='textSecondary'>
                          Start Date
                        </Typography>
                        <Typography variant='body2'>
                          {history.startDate.toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant='caption' color='textSecondary'>
                          End Date
                        </Typography>
                        <Typography variant='body2'>
                          {history.endDate.toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Alert severity='info'>No membership history</Alert>
          )}
        </TabPanel>

        {/* Activity Tab */}
        <TabPanel value={tabValue} index={2}>
          <Alert severity='info'>Activity tracking coming soon</Alert>
        </TabPanel>
      </Box>
    </Drawer>
  )
}

export default MemberProfileDrawer
