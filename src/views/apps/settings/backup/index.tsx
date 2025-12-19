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
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const BackupSettings = () => {
  // States
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false)
  const [backupFrequency, setBackupFrequency] = useState('daily')
  const [backupTime, setBackupTime] = useState('02:00')
  const [s3Bucket, setS3Bucket] = useState('')
  const [s3Region, setS3Region] = useState('ap-south-1')
  const [s3AccessKey, setS3AccessKey] = useState('')
  const [s3SecretKey, setS3SecretKey] = useState('')

  const handleSaveSettings = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/apps/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'backup.config',
          value: {
            autoBackupEnabled,
            frequency: backupFrequency,
            time: backupTime,
            s3: {
              bucket: s3Bucket,
              region: s3Region,
              accessKeyId: s3AccessKey,
              secretAccessKey: s3SecretKey
            }
          },
          description: 'Automated backup configuration',
          isEncrypted: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save backup settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save backup settings')
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerBackup = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/apps/backup/trigger', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to trigger backup')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to trigger backup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      {success && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='success'>Backup settings saved successfully!</Alert>
        </Grid>
      )}

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}

      {/* Auto Backup Configuration */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Automated Backups'
            subheader='Configure automatic database backups'
            action={
              <FormControlLabel
                control={
                  <Switch checked={autoBackupEnabled} onChange={e => setAutoBackupEnabled(e.target.checked)} />
                }
                label='Enable'
              />
            }
          />
          <CardContent>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Backup Frequency'
                  value={backupFrequency}
                  onChange={e => setBackupFrequency(e.target.value)}
                  disabled={!autoBackupEnabled}
                >
                  <MenuItem value='daily'>Daily</MenuItem>
                  <MenuItem value='weekly'>Weekly</MenuItem>
                  <MenuItem value='monthly'>Monthly</MenuItem>
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  type='time'
                  label='Backup Time'
                  value={backupTime}
                  onChange={e => setBackupTime(e.target.value)}
                  disabled={!autoBackupEnabled}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* S3 Storage Configuration */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='S3 Storage' subheader='Configure AWS S3 or compatible storage for backups' />
          <CardContent>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='S3 Bucket Name'
                  placeholder='my-gym-backups'
                  value={s3Bucket}
                  onChange={e => setS3Bucket(e.target.value)}
                  disabled={!autoBackupEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='S3 Region'
                  value={s3Region}
                  onChange={e => setS3Region(e.target.value)}
                  disabled={!autoBackupEnabled}
                >
                  <MenuItem value='ap-south-1'>Asia Pacific (Mumbai)</MenuItem>
                  <MenuItem value='us-east-1'>US East (N. Virginia)</MenuItem>
                  <MenuItem value='us-west-2'>US West (Oregon)</MenuItem>
                  <MenuItem value='eu-west-1'>Europe (Ireland)</MenuItem>
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Access Key ID'
                  placeholder='AKIAIOSFODNN7EXAMPLE'
                  value={s3AccessKey}
                  onChange={e => setS3AccessKey(e.target.value)}
                  disabled={!autoBackupEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  type='password'
                  label='Secret Access Key'
                  placeholder='Enter secret access key'
                  value={s3SecretKey}
                  onChange={e => setS3SecretKey(e.target.value)}
                  disabled={!autoBackupEnabled}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Manual Backup */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Manual Backup' subheader='Trigger an immediate database backup' />
          <CardContent>
            <Typography color='text.secondary' className='mbe-4'>
              Click the button below to create a manual backup of your database. This backup will be stored in your
              configured S3 bucket.
            </Typography>
            <Button variant='outlined' color='primary' onClick={handleTriggerBackup} disabled={loading}>
              {loading ? 'Creating Backup...' : 'Trigger Backup Now'}
            </Button>
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

export default BackupSettings
