'use client'

import { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import { TrendingUp, TrendingDown, AccountBalance, Receipt, People, AttachMoney } from '@mui/icons-material'
import { getDashboardFinanceSummary } from '@/app/actions/financial'
import { toast } from 'react-toastify'

export default function FinancialDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const summary = await getDashboardFinanceSummary()
      setData(summary)
    } catch (error) {
      console.error('Failed to load financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  const { profit, arr, growth, expenses } = data || {}

  return (
    <Box>
      <Box mb={6}>
        <Typography variant="h4" gutterBottom>Financial Reports</Typography>
        <Typography color="textSecondary">
          Revenue analytics, profit tracking, and business metrics
        </Typography>
      </Box>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: profit?.netProfit > 0 ? 'success.light' : 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {profit?.netProfit > 0 ? (
                    <TrendingUp sx={{ color: 'success.main' }} />
                  ) : (
                    <TrendingDown sx={{ color: 'error.main' }} />
                  )}
                </Box>
                <Box>
                  <Typography color="textSecondary" variant="body2">Net Profit (30 days)</Typography>
                  <Typography variant="h5" color={profit?.netProfit > 0 ? 'success.main' : 'error.main'}>
                    ₹{Math.round(profit?.netProfit || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {Math.round(profit?.profitMargin || 0)}% margin
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccountBalance sx={{ color: 'primary.main' }} />
                </Box>
                <Box>
                  <Typography color="textSecondary" variant="body2">Annual Revenue (ARR)</Typography>
                  <Typography variant="h5">
                    ₹{(Math.round(arr?.arr || 0) / 100000).toFixed(1)}L
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {arr?.activeMembers} active members
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'info.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AttachMoney sx={{ color: 'info.main' }} />
                </Box>
                <Box>
                  <Typography color="textSecondary" variant="body2">Monthly Revenue (MRR)</Typography>
                  <Typography variant="h5">
                    ₹{(Math.round(arr?.mrr || 0) / 1000).toFixed(1)}k
                  </Typography>
                  <Typography variant="caption" color="info.main">
                    Recurring revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'warning.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Receipt sx={{ color: 'warning.main' }} />
                </Box>
                <Box>
                  <Typography color="textSecondary" variant="body2">Total Expenses (30 days)</Typography>
                  <Typography variant="h5">
                    ₹{Math.round(expenses?.total || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {expenses?.count || 0} transactions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title="Revenue Breakdown (30 days)" />
            <CardContent>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Membership Revenue</Typography>
                  <Typography fontWeight="bold">
                    ₹{Math.round(profit?.revenueBreakdown?.memberships || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Product Sales</Typography>
                  <Typography fontWeight="bold">
                    ₹{Math.round(profit?.revenueBreakdown?.orders || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight="bold">Total Revenue</Typography>
                  <Typography fontWeight="bold" color="success.main">
                    ₹{Math.round(profit?.totalRevenue || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title="Member Growth (Last 6 Months)" />
            <CardContent>
              <Box display="flex" flexDirection="column" gap={1}>
                {growth?.map((month: any) => (
                  <Box key={month.month} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">{month.month}</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: Math.max(month.count * 10, 20),
                          height: 8,
                          bgcolor: 'primary.main',
                          borderRadius: 1,
                        }}
                      />
                      <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 30 }}>
                        +{month.count}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title="Expense Categories (30 days)" />
            <CardContent>
              {expenses?.byCategory && Object.keys(expenses.byCategory).length > 0 ? (
                <Grid container spacing={3}>
                  {Object.entries(expenses.byCategory).map(([category, amount]) => (
                    <Grid key={category} size={{ xs: 6, sm: 4, md: 3 }}>
                      <Box
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="body2" color="textSecondary">{category}</Typography>
                        <Typography variant="h6">₹{Math.round(Number(amount)).toLocaleString()}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="textSecondary" textAlign="center">
                  No expense data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
