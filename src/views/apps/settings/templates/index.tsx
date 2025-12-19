'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const TemplateSettings = () => {
  // States
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [welcomeEnabled, setWelcomeEnabled] = useState(true)
  const [welcomeSubject, setWelcomeSubject] = useState('Welcome to {{gymName}}!')
  const [welcomeBody, setWelcomeBody] = useState('Hi {{memberName}},\n\nWelcome to our gym family!')

  const [renewalEnabled, setRenewalEnabled] = useState(true)
  const [renewalSubject, setRenewalSubject] = useState('Your membership is expiring soon')
  const [renewalBody, setRenewalBody] = useState('Hi {{memberName}},\n\nYour membership expires on {{expiryDate}}.')

  const handleSaveSettings = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const settings = [
        {
          key: 'template.welcome_email',
          value: {
            enabled: welcomeEnabled,
            subject: welcomeSubject,
            body: welcomeBody
          },
          description: 'Welcome email template for new members'
        },
        {
          key: 'template.renewal_reminder',
          value: {
            enabled: renewalEnabled,
            subject: renewalSubject,
            body: renewalBody
          },
          description: 'Membership renewal reminder template'
        }
      ]

      const response = await fetch('/api/apps/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (!response.ok) {
        throw new Error('Failed to save template settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save template settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      {success && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='success'>Template settings saved successfully!</Alert>
        </Grid>
      )}

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}

      {/* Welcome Email Template */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Welcome Email'
            subheader='Email sent to new members upon registration'
            action={
              <FormControlLabel
                control={<Switch checked={welcomeEnabled} onChange={e => setWelcomeEnabled(e.target.checked)} />}
                label='Enable'
              />
            }
          />
          <CardContent>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Subject'
                  placeholder='Email subject'
                  value={welcomeSubject}
                  onChange={e => setWelcomeSubject(e.target.value)}
                  disabled={!welcomeEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={6}
                  label='Email Body'
                  placeholder='Email content (use {{memberName}}, {{gymName}} for dynamic values)'
                  value={welcomeBody}
                  onChange={e => setWelcomeBody(e.target.value)}
                  disabled={!welcomeEnabled}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Renewal Reminder Template */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Renewal Reminder'
            subheader='Email sent before membership expiration'
            action={
              <FormControlLabel
                control={<Switch checked={renewalEnabled} onChange={e => setRenewalEnabled(e.target.checked)} />}
                label='Enable'
              />
            }
          />
          <CardContent>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Subject'
                  placeholder='Email subject'
                  value={renewalSubject}
                  onChange={e => setRenewalSubject(e.target.value)}
                  disabled={!renewalEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={6}
                  label='Email Body'
                  placeholder='Email content (use {{memberName}}, {{expiryDate}} for dynamic values)'
                  value={renewalBody}
                  onChange={e => setRenewalBody(e.target.value)}
                  disabled={!renewalEnabled}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <div className='flex justify-end gap-4'>
          <Button variant='tonal' color='secondary'>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleSaveSettings} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Grid>
    </Grid>
  )
}

export default TemplateSettings
