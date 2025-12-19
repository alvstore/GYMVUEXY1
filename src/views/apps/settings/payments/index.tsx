'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const PaymentGateways = () => {
  // States
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Razorpay Settings
  const [razorpayEnabled, setRazorpayEnabled] = useState(false)
  const [razorpayKeyId, setRazorpayKeyId] = useState('')
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('')
  const [razorpayTestMode, setRazorpayTestMode] = useState(true)

  // CCAvenue Settings
  const [ccavenueEnabled, setCcavenueEnabled] = useState(false)
  const [ccavenueMerchantId, setCcavenueMerchantId] = useState('')
  const [ccavenueAccessCode, setCcavenueAccessCode] = useState('')
  const [ccavenueWorkingKey, setCcavenueWorkingKey] = useState('')
  const [ccavenueTestMode, setCcavenueTestMode] = useState(true)

  // PhonePe Settings
  const [phonepeEnabled, setPhonepeEnabled] = useState(false)
  const [phonepeMerchantId, setPhonepeMerchantId] = useState('')
  const [phonepeSaltKey, setPhonepeSaltKey] = useState('')
  const [phonepeSaltIndex, setPhonepeSaltIndex] = useState('')
  const [phonepeTestMode, setPhonepeTestMode] = useState(true)

  // Load existing settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/apps/settings?category=payment')
        if (!response.ok) throw new Error('Failed to load settings')
        
        const { settings } = await response.json()

        // Load Razorpay settings
        const razorpay = settings.find((s: any) => s.key === 'payment.razorpay')
        if (razorpay?.value) {
          setRazorpayEnabled(razorpay.value.enabled || false)
          setRazorpayKeyId(razorpay.value.keyId || '')
          setRazorpayKeySecret(razorpay.value.keySecret || '')
          setRazorpayTestMode(razorpay.value.isTestMode !== undefined ? razorpay.value.isTestMode : true)
        }

        // Load CCAvenue settings
        const ccavenue = settings.find((s: any) => s.key === 'payment.ccavenue')
        if (ccavenue?.value) {
          setCcavenueEnabled(ccavenue.value.enabled || false)
          setCcavenueMerchantId(ccavenue.value.merchantId || '')
          setCcavenueAccessCode(ccavenue.value.accessCode || '')
          setCcavenueWorkingKey(ccavenue.value.workingKey || '')
          setCcavenueTestMode(ccavenue.value.isTestMode !== undefined ? ccavenue.value.isTestMode : true)
        }

        // Load PhonePe settings
        const phonepe = settings.find((s: any) => s.key === 'payment.phonepe')
        if (phonepe?.value) {
          setPhonepeEnabled(phonepe.value.enabled || false)
          setPhonepeMerchantId(phonepe.value.merchantId || '')
          setPhonepeSaltKey(phonepe.value.saltKey || '')
          setPhonepeSaltIndex(phonepe.value.saltIndex || '')
          setPhonepeTestMode(phonepe.value.isTestMode !== undefined ? phonepe.value.isTestMode : true)
        }
      } catch (err: any) {
        console.error('Failed to load payment settings:', err)
        setError('Failed to load existing settings')
      } finally {
        setInitialLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const settings = []

      // Razorpay settings - ALWAYS send to persist enabled/disabled state
      settings.push({
        key: 'payment.razorpay',
        value: razorpayEnabled
          ? {
              keyId: razorpayKeyId,
              keySecret: razorpayKeySecret,
              isTestMode: razorpayTestMode,
              enabled: true
            }
          : { enabled: false },
        description: 'Razorpay payment gateway configuration',
        isEncrypted: razorpayEnabled
      })

      // CCAvenue settings - ALWAYS send to persist enabled/disabled state
      settings.push({
        key: 'payment.ccavenue',
        value: ccavenueEnabled
          ? {
              merchantId: ccavenueMerchantId,
              accessCode: ccavenueAccessCode,
              workingKey: ccavenueWorkingKey,
              isTestMode: ccavenueTestMode,
              enabled: true
            }
          : { enabled: false },
        description: 'CCAvenue payment gateway configuration',
        isEncrypted: ccavenueEnabled
      })

      // PhonePe settings - ALWAYS send to persist enabled/disabled state
      settings.push({
        key: 'payment.phonepe',
        value: phonepeEnabled
          ? {
              merchantId: phonepeMerchantId,
              saltKey: phonepeSaltKey,
              saltIndex: phonepeSaltIndex,
              isTestMode: phonepeTestMode,
              enabled: true
            }
          : { enabled: false },
        description: 'PhonePe payment gateway configuration',
        isEncrypted: phonepeEnabled
      })

      const response = await fetch('/api/apps/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <Typography>Loading payment settings...</Typography>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={6}>
      {success && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='success'>Payment gateway settings saved successfully!</Alert>
        </Grid>
      )}

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}

      {/* Razorpay */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Razorpay'
            subheader='Configure Razorpay payment gateway for online payments'
            action={
              <FormControlLabel
                control={<Switch checked={razorpayEnabled} onChange={e => setRazorpayEnabled(e.target.checked)} />}
                label='Enable'
              />
            }
          />
          <CardContent>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Key ID'
                  placeholder='rzp_test_xxxxx'
                  value={razorpayKeyId}
                  onChange={e => setRazorpayKeyId(e.target.value)}
                  disabled={!razorpayEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Key Secret'
                  type='password'
                  placeholder='Enter key secret'
                  value={razorpayKeySecret}
                  onChange={e => setRazorpayKeySecret(e.target.value)}
                  disabled={!razorpayEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={razorpayTestMode} onChange={e => setRazorpayTestMode(e.target.checked)} />}
                  label='Test Mode'
                  disabled={!razorpayEnabled}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* CCAvenue */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='CCAvenue'
            subheader='Configure CCAvenue payment gateway'
            action={
              <FormControlLabel
                control={<Switch checked={ccavenueEnabled} onChange={e => setCcavenueEnabled(e.target.checked)} />}
                label='Enable'
              />
            }
          />
          <CardContent>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Merchant ID'
                  placeholder='Enter merchant ID'
                  value={ccavenueMerchantId}
                  onChange={e => setCcavenueMerchantId(e.target.value)}
                  disabled={!ccavenueEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Access Code'
                  placeholder='Enter access code'
                  value={ccavenueAccessCode}
                  onChange={e => setCcavenueAccessCode(e.target.value)}
                  disabled={!ccavenueEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Working Key'
                  type='password'
                  placeholder='Enter working key'
                  value={ccavenueWorkingKey}
                  onChange={e => setCcavenueWorkingKey(e.target.value)}
                  disabled={!ccavenueEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={ccavenueTestMode} onChange={e => setCcavenueTestMode(e.target.checked)} />}
                  label='Test Mode'
                  disabled={!ccavenueEnabled}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* PhonePe */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='PhonePe'
            subheader='Configure PhonePe payment gateway'
            action={
              <FormControlLabel
                control={<Switch checked={phonepeEnabled} onChange={e => setPhonepeEnabled(e.target.checked)} />}
                label='Enable'
              />
            }
          />
          <CardContent>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Merchant ID'
                  placeholder='Enter merchant ID'
                  value={phonepeMerchantId}
                  onChange={e => setPhonepeMerchantId(e.target.value)}
                  disabled={!phonepeEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Salt Key'
                  type='password'
                  placeholder='Enter salt key'
                  value={phonepeSaltKey}
                  onChange={e => setPhonepeSaltKey(e.target.value)}
                  disabled={!phonepeEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Salt Index'
                  placeholder='Enter salt index'
                  value={phonepeSaltIndex}
                  onChange={e => setPhonepeSaltIndex(e.target.value)}
                  disabled={!phonepeEnabled}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={phonepeTestMode} onChange={e => setPhonepeTestMode(e.target.checked)} />}
                  label='Test Mode'
                  disabled={!phonepeEnabled}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Save Button */}
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

export default PaymentGateways
