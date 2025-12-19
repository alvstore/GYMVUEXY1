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
  Tabs,
  Alert
} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'

interface StaffProfileDrawerProps {
  open: boolean
  staffId: string | null
  staffName?: string
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
    id: `staff-tab-${index}`,
    'aria-controls': `staff-tabpanel-${index}`
  }
}

const StaffProfileDrawer = ({ open, staffId, staffName = '', onClose }: StaffProfileDrawerProps) => {
  const [tabValue, setTabValue] = useState(0)

  const mockStaffData = {
    id: staffId,
    firstName: 'Alex',
    lastName: 'Manager',
    email: 'alex@demogym.com',
    phone: '+1111222333',
    employeeId: 'EMP-001',
    role: 'MANAGER',
    department: 'Operations',
    designation: 'Operations Manager',
    joinDate: new Date('2023-06-01'),
    status: 'ACTIVE',
    salary: 50000,
    shiftType: 'MORNING',
    shiftStartTime: '09:00',
    shiftEndTime: '18:00'
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  if (!open || !staffId) return null

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
            Staff Profile
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
                {getInitials(`${mockStaffData.firstName} ${mockStaffData.lastName}`)}
              </CustomAvatar>
              <Typography variant='h6' sx={{ mb: 1 }}>
                {mockStaffData.firstName} {mockStaffData.lastName}
              </Typography>
              <Chip
                label={mockStaffData.status}
                color={mockStaffData.status === 'ACTIVE' ? 'success' : 'default'}
                variant='tonal'
                size='small'
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant='body2' color='textSecondary'>
                  {mockStaffData.role}
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  •
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  {mockStaffData.designation}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Employee ID
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockStaffData.employeeId}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Email
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockStaffData.email}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Phone
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockStaffData.phone}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Department
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockStaffData.department}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Join Date
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockStaffData.joinDate.toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Shift
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockStaffData.shiftStartTime} - {mockStaffData.shiftEndTime}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label='staff profile tabs'>
            <Tab label='Details' {...a11yProps(0)} />
            <Tab label='Schedule' {...a11yProps(1)} />
            <Tab label='Performance' {...a11yProps(2)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Card variant='outlined'>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Salary
                  </Typography>
                  <Typography variant='body2'>${mockStaffData.salary?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Department
                  </Typography>
                  <Typography variant='body2'>{mockStaffData.department}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Designation
                  </Typography>
                  <Typography variant='body2'>{mockStaffData.designation}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Alert severity='info'>Shift schedule details coming soon</Alert>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Alert severity='info'>Performance metrics coming soon</Alert>
        </TabPanel>
      </Box>
    </Drawer>
  )
}

export default StaffProfileDrawer
