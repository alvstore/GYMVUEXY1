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
  Alert,
  LinearProgress
} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import StarIcon from '@mui/icons-material/Star'

import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'

interface TrainerProfileDrawerProps {
  open: boolean
  trainerId: string | null
  trainerName?: string
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
    id: `trainer-tab-${index}`,
    'aria-controls': `trainer-tabpanel-${index}`
  }
}

const TrainerProfileDrawer = ({ open, trainerId, trainerName = '', onClose }: TrainerProfileDrawerProps) => {
  const [tabValue, setTabValue] = useState(0)

  const mockTrainerData = {
    id: trainerId,
    name: 'Trainer User',
    email: 'trainer@demogym.com',
    phone: '+1444555666',
    experience: 8,
    rating: 4.8,
    totalSessions: 156,
    status: 'ACTIVE',
    specializations: ['YOGA', 'FLEXIBILITY'],
    certifications: ['RYT-500', 'Yoga Alliance Certified', 'CPR Certified'],
    languages: ['English', 'Spanish'],
    bio: 'Certified Yoga Instructor with 8+ years of experience',
    joinDate: new Date('2024-01-01')
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  if (!open || !trainerId) return null

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
            Trainer Profile
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
                {getInitials(mockTrainerData.name)}
              </CustomAvatar>
              <Typography variant='h6' sx={{ mb: 1 }}>
                {mockTrainerData.name}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      sx={{
                        fontSize: 16,
                        color: i < Math.floor(mockTrainerData.rating) ? '#ffc107' : '#e0e0e0'
                      }}
                    />
                  ))}
                </Box>
                <Typography variant='body2' color='textSecondary'>
                  {mockTrainerData.rating} ({mockTrainerData.totalSessions} sessions)
                </Typography>
              </Box>
              <Chip
                label={mockTrainerData.status}
                color={mockTrainerData.status === 'ACTIVE' ? 'success' : 'default'}
                variant='tonal'
                size='small'
                sx={{ mb: 2 }}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Experience
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockTrainerData.experience} years
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Email
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockTrainerData.email}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Phone
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockTrainerData.phone}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant='body2' color='textSecondary'>
                  Join Date
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {mockTrainerData.joinDate.toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label='trainer profile tabs'>
            <Tab label='Bio' {...a11yProps(0)} />
            <Tab label='Specializations' {...a11yProps(1)} />
            <Tab label='Certifications' {...a11yProps(2)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='body2'>{mockTrainerData.bio}</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Languages
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {mockTrainerData.languages.map((lang, idx) => (
                    <Chip key={idx} label={lang} size='small' variant='tonal' />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {mockTrainerData.specializations.map((spec, idx) => (
              <Chip key={idx} label={spec.replace(/_/g, ' ')} color='primary' variant='tonal' />
            ))}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {mockTrainerData.certifications.map((cert, idx) => (
              <Card key={idx} variant='outlined'>
                <CardContent>
                  <Typography variant='body2'>{cert}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>
      </Box>
    </Drawer>
  )
}

export default TrainerProfileDrawer
