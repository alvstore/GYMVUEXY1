'use client'

import { useState } from 'react'
import {
  Drawer,
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Divider,
  Tab,
  Tabs
} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'

interface ManagerProfileDrawerProps {
  open: boolean
  userId: string | null
  userName?: string
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
    <div role='tabpanel' hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `manager-tab-${index}`,
    'aria-controls': `manager-tabpanel-${index}`
  }
}

const ManagerProfileDrawer = ({ open, userId, userName = '', onClose }: ManagerProfileDrawerProps) => {
  const [tabValue, setTabValue] = useState(0)

  const mockManagerData = {
    id: userId,
    name: 'Manager User',
    email: 'manager@demogym.com',
    phone: '+1555666777',
    roles: ['MANAGER'],
    permissions: ['members.*', 'classes.*', 'invoices.*', 'staff.view'],
    lastLoginAt: new Date('2024-11-22'),
    isActive: true,
    createdAt: new Date('2024-01-01')
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  if (!open || !userId) return null

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h5' component='h2'>
            Manager Profile
          </Typography>
          <IconButton onClick={onClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>

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
                {getInitials(mockManagerData.name)}
              </CustomAvatar>
              <Typography variant='h6' sx={{ mb: 1 }}>
                {mockManagerData.name}
              </Typography>
              <Chip
                label={mockManagerData.isActive ? 'ACTIVE' : 'INACTIVE'}
                color={mockManagerData.isActive ? 'success' : 'default'}
                variant='tonal'
                size='small'
                sx={{ mb: 2 }}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant='body2' color='textSecondary'>
                  Email
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockManagerData.email}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='body2' color='textSecondary'>
                  Phone
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockManagerData.phone}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='body2' color='textSecondary'>
                  Last Login
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockManagerData.lastLoginAt.toLocaleDateString()} {mockManagerData.lastLoginAt.toLocaleTimeString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label='manager profile tabs'>
            <Tab label='Roles' {...a11yProps(0)} />
            <Tab label='Permissions' {...a11yProps(1)} />
            <Tab label='Activity' {...a11yProps(2)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {mockManagerData.roles.map((role, idx) => (
              <Chip key={idx} label={role} color='primary' variant='tonal' />
            ))}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {mockManagerData.permissions.map((perm, idx) => (
              <Chip key={idx} label={perm} variant='outlined' size='small' />
            ))}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Account Created
              </Typography>
              <Typography variant='body2'>
                {mockManagerData.createdAt.toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
      </Box>
    </Drawer>
  )
}

export default ManagerProfileDrawer
