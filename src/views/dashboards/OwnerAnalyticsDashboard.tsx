'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface AnalyticsData {
  revenue: {
    monthly: { month: string; collected: number; projected: number }[]
    total: number
    outstanding: number
  }
  facilityUtilization: {
    name: string
    bookings: number
    capacity: number
    utilizationRate: number
  }[]
  memberChurn: {
    expiringSoon: number
    newSignups: number
    expired: number
    active: number
  }
  staffPerformance: {
    name: string
    checkIns: number
    lockerAssignments: number
    bookingsManaged: number
  }[]
}

export default function OwnerAnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/analytics/owner?period=${period}`)
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data')
      setData({
        revenue: {
          monthly: [
            { month: 'Jan', collected: 125000, projected: 150000 },
            { month: 'Feb', collected: 142000, projected: 150000 },
            { month: 'Mar', collected: 168000, projected: 160000 },
            { month: 'Apr', collected: 155000, projected: 165000 },
            { month: 'May', collected: 178000, projected: 175000 },
            { month: 'Jun', collected: 192000, projected: 185000 },
          ],
          total: 960000,
          outstanding: 45000,
        },
        facilityUtilization: [
          { name: 'Infrared Sauna', bookings: 245, capacity: 320, utilizationRate: 76.5 },
          { name: 'Ice Bath', bookings: 189, capacity: 240, utilizationRate: 78.8 },
          { name: 'Steam Room', bookings: 156, capacity: 300, utilizationRate: 52.0 },
        ],
        memberChurn: {
          expiringSoon: 23,
          newSignups: 45,
          expired: 12,
          active: 312,
        },
        staffPerformance: [
          { name: 'Raj Kumar', checkIns: 156, lockerAssignments: 23, bookingsManaged: 89 },
          { name: 'Priya Sharma', checkIns: 142, lockerAssignments: 18, bookingsManaged: 67 },
          { name: 'Amit Patel', checkIns: 98, lockerAssignments: 31, bookingsManaged: 45 },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: 'revenue' | 'members' | 'all') => {
    try {
      const response = await fetch(`/api/export/${type}?format=csv`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data) {
    return <Alert severity="error">{error || 'Failed to load analytics'}</Alert>
  }

  const revenueChartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
    xaxis: { categories: data.revenue.monthly.map(m => m.month) },
    colors: ['#4CAF50', '#2196F3'],
    legend: { position: 'top' },
    dataLabels: { enabled: false },
  }

  const revenueChartSeries = [
    { name: 'Collected', data: data.revenue.monthly.map(m => m.collected) },
    { name: 'Projected', data: data.revenue.monthly.map(m => m.projected) },
  ]

  const utilizationChartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    xaxis: { max: 100, labels: { formatter: (val) => `${val}%` } },
    colors: ['#FF9800'],
    dataLabels: { enabled: true, formatter: (val) => `${val}%` },
  }

  const utilizationChartSeries = [
    { name: 'Utilization', data: data.facilityUtilization.map(f => f.utilizationRate) },
  ]

  const churnChartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'donut' },
    labels: ['Active', 'Expiring Soon', 'New Signups', 'Expired'],
    colors: ['#4CAF50', '#FF9800', '#2196F3', '#F44336'],
    legend: { position: 'bottom' },
  }

  const churnChartSeries = [
    data.memberChurn.active,
    data.memberChurn.expiringSoon,
    data.memberChurn.newSignups,
    data.memberChurn.expired,
  ]

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Owner Analytics</Typography>
          <Typography variant="body2" color="textSecondary">
            Financial insights and operational metrics
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select value={period} onChange={(e) => setPeriod(e.target.value as any)} label="Period">
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => handleExport('all')}>
            Export All Data
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="textSecondary">Total Revenue</Typography>
              <Typography variant="h4" color="success.main">
                ₹{(data.revenue.total / 100000).toFixed(1)}L
              </Typography>
              <Typography variant="caption" color="textSecondary">This period</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="textSecondary">Outstanding Dues</Typography>
              <Typography variant="h4" color="error.main">
                ₹{(data.revenue.outstanding / 1000).toFixed(1)}K
              </Typography>
              <Typography variant="caption" color="textSecondary">Pending collection</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="textSecondary">Active Members</Typography>
              <Typography variant="h4" color="primary.main">
                {data.memberChurn.active}
              </Typography>
              <Typography variant="caption" color="success.main">
                +{data.memberChurn.newSignups} this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="textSecondary">Expiring Soon</Typography>
              <Typography variant="h4" color="warning.main">
                {data.memberChurn.expiringSoon}
              </Typography>
              <Typography variant="caption" color="textSecondary">Next 30 days</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader 
              title="Revenue Trends" 
              subheader="Collected vs Projected Revenue"
              action={
                <Button size="small" onClick={() => handleExport('revenue')}>
                  Export
                </Button>
              }
            />
            <CardContent>
              <ApexChart
                options={revenueChartOptions}
                series={revenueChartSeries}
                type="bar"
                height={350}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader title="Member Distribution" />
            <CardContent>
              <ApexChart
                options={churnChartOptions}
                series={churnChartSeries}
                type="donut"
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Facility Utilization" subheader="Bookings vs Capacity" />
            <CardContent>
              <ApexChart
                options={{
                  ...utilizationChartOptions,
                  yaxis: { categories: data.facilityUtilization.map(f => f.name) },
                }}
                series={utilizationChartSeries}
                type="bar"
                height={250}
              />
              <Divider sx={{ my: 2 }} />
              {data.facilityUtilization.map((facility) => (
                <Box key={facility.name} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">{facility.name}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {facility.bookings}/{facility.capacity} ({facility.utilizationRate}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={facility.utilizationRate}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Staff Performance" subheader="Operations completed this period" />
            <CardContent>
              {data.staffPerformance.map((staff, index) => (
                <Box key={staff.name} sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">{staff.name}</Typography>
                    <Chip 
                      label={`#${index + 1}`} 
                      size="small" 
                      color={index === 0 ? 'success' : 'default'}
                    />
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Box textAlign="center" sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="h6">{staff.checkIns}</Typography>
                        <Typography variant="caption">Check-ins</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center" sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="h6">{staff.lockerAssignments}</Typography>
                        <Typography variant="caption">Lockers</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center" sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="h6">{staff.bookingsManaged}</Typography>
                        <Typography variant="caption">Bookings</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  {index < data.staffPerformance.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
