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

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const BrandingSettings = () => {
  // States
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [brandName, setBrandName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#FF6B6B')
  const [secondaryColor, setSecondaryColor] = useState('#4ECDC4')
  const [tagline, setTagline] = useState('')

  const handleSaveSettings = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/apps/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'branding.theme',
          value: {
            brandName,
            logoUrl,
            primaryColor,
            secondaryColor,
            tagline
          },
          description: 'Gym branding and theme configuration'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save branding settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save branding settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      {success && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='success'>Branding settings saved successfully!</Alert>
        </Grid>
      )}

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Brand Identity' subheader='Customize your gym brand appearance' />
          <CardContent>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Brand Name'
                  placeholder='e.g., FitZone Gym'
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Logo URL'
                  placeholder='https://example.com/logo.png'
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Tagline'
                  placeholder='e.g., Transform Your Life'
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  type='color'
                  label='Primary Color'
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  type='color'
                  label='Secondary Color'
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
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

export default BrandingSettings
