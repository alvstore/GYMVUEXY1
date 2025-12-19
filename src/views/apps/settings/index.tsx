'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomTabList from '@core/components/mui/TabList'
import PaymentGateways from './payments'
import BrandingSettings from './branding'
import TemplateSettings from './templates'
import BackupSettings from './backup'

const SettingsView = () => {
  // States
  const [activeTab, setActiveTab] = useState('payments')

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  const tabContentList: { [key: string]: ReactElement } = {
    payments: <PaymentGateways />,
    branding: <BrandingSettings />,
    templates: <TemplateSettings />,
    backup: <BackupSettings />
  }

  return (
    <TabContext value={activeTab}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant='h5' className='mbe-4'>
            System Settings
          </Typography>
          <CustomTabList orientation='vertical' onChange={handleChange} className='is-full' pill='true'>
            <Tab
              label='Payment Gateways'
              icon={<i className='tabler-credit-card' />}
              iconPosition='start'
              value='payments'
              className='flex-row justify-start !min-is-full'
            />
            <Tab
              label='Branding'
              icon={<i className='tabler-palette' />}
              iconPosition='start'
              value='branding'
              className='flex-row justify-start !min-is-full'
            />
            <Tab
              label='Templates'
              icon={<i className='tabler-mail' />}
              iconPosition='start'
              value='templates'
              className='flex-row justify-start !min-is-full'
            />
            <Tab
              label='Backup & Export'
              icon={<i className='tabler-database-export' />}
              iconPosition='start'
              value='backup'
              className='flex-row justify-start !min-is-full'
            />
          </CustomTabList>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <TabPanel value={activeTab} className='p-0'>
            {tabContentList[activeTab]}
          </TabPanel>
        </Grid>
      </Grid>
    </TabContext>
  )
}

export default SettingsView
