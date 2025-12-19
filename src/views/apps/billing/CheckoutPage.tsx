'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import MembershipSelector from './MembershipSelector'
import { createCheckoutSession } from '@/app/actions/payments'
import { toast } from 'react-toastify'

interface Plan {
  id: string
  name: string
  price: number
  setupFee: number
}

interface CheckoutPageProps {
  memberId: string
}

export default function CheckoutPage({ memberId }: CheckoutPageProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setError(null)
  }

  const handleProceed = async () => {
    if (!selectedPlan) return

    setLoading(true)
    setError(null)

    try {
      const result = await createCheckoutSession({
        memberId,
        planId: selectedPlan.id,
        successUrl: `${window.location.origin}/apps/billing/success`,
        cancelUrl: `${window.location.origin}/apps/billing/checkout`,
      })

      if (result.success && result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url
      } else {
        setError(result.error || 'Failed to create checkout session')
        toast.error(result.error || 'Failed to proceed to payment')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Select Your Membership Plan
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Choose the plan that best fits your fitness goals. You can upgrade or cancel anytime.
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <MembershipSelector memberId={memberId} onSelectPlan={handleSelectPlan} loading={loading} />

      {selectedPlan && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">Selected Plan</Typography>
                <Typography variant="body1">{selectedPlan.name}</Typography>
                <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
                  ₹{(selectedPlan.price + selectedPlan.setupFee).toLocaleString('en-IN')}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={handleProceed}
                disabled={loading}
                sx={{ minWidth: 200 }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
