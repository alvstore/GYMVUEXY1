'use client'

import { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { getMembershipPlans } from '@/app/actions/payments'
import { toast } from 'react-toastify'

interface Plan {
  id: string
  name: string
  description?: string
  price: number
  setupFee: number
  duration: number
  gymAccess: boolean
  poolAccess: boolean
  lockerAccess: boolean
  personalTrainer: boolean
  groupClasses: boolean
  maxClasses?: number
  features: string[]
}

interface MembershipSelectorProps {
  memberId: string
  onSelectPlan: (plan: Plan) => void
  loading?: boolean
}

export default function MembershipSelector({ memberId, onSelectPlan, loading = false }: MembershipSelectorProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPlans = async () => {
      const result = await getMembershipPlans(memberId)
      if (result.success) {
        setPlans(result.plans)
      } else {
        setError(result.error || 'Failed to load plans')
        toast.error('Failed to load membership plans')
      }
      setLoadingPlans(false)
    }

    loadPlans()
  }, [memberId])

  if (loadingPlans) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (plans.length === 0) {
    return <Alert severity="info">No membership plans available</Alert>
  }

  return (
    <Grid container spacing={3}>
      {plans.map((plan) => (
        <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                {plan.name}
              </Typography>

              {plan.description && (
                <Typography variant="body2" color="textSecondary" paragraph>
                  {plan.description}
                </Typography>
              )}

              <Box my={2}>
                <Typography variant="h4" color="primary">
                  ₹{plan.price.toLocaleString('en-IN')}
                  <Typography variant="caption" component="span" sx={{ ml: 1 }}>
                    /{plan.duration} days
                  </Typography>
                </Typography>

                {plan.setupFee > 0 && (
                  <Typography variant="body2" color="textSecondary">
                    + ₹{plan.setupFee.toLocaleString('en-IN')} setup fee
                  </Typography>
                )}
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Benefits:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {plan.gymAccess && <Chip label="Gym Access" size="small" />}
                  {plan.poolAccess && <Chip label="Pool" size="small" />}
                  {plan.lockerAccess && <Chip label="Locker" size="small" />}
                  {plan.personalTrainer && <Chip label="Personal Trainer" size="small" />}
                  {plan.groupClasses && <Chip label={`${plan.maxClasses || 'Unlimited'} Classes/mo`} size="small" />}
                </Box>
              </Box>

              {plan.features && plan.features.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Features:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>
                        <Typography variant="body2">{feature}</Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
            </CardContent>

            <Box p={2} borderTop="1px solid #eee">
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => onSelectPlan(plan)}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Select Plan'}
              </Button>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
