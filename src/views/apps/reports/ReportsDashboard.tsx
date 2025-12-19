'use client'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

const ReportsDashboard = () => {
  const reportCategories = [
    {
      title: 'Membership Reports',
      icon: 'tabler-users',
      color: 'primary',
      reports: ['Active Members', 'New Signups', 'Renewals', 'Churn Rate', 'Member Demographics']
    },
    {
      title: 'Revenue Reports',
      icon: 'tabler-currency-dollar',
      color: 'success',
      reports: ['Monthly Revenue', 'Revenue by Service', 'Outstanding Payments', 'Revenue Forecast', 'Profit & Loss']
    },
    {
      title: 'Attendance Reports',
      icon: 'tabler-calendar-stats',
      color: 'info',
      reports: ['Daily Attendance', 'Peak Hours', 'Member Visit Frequency', 'Class Attendance', 'No-Shows']
    },
    {
      title: 'Trainer Reports',
      icon: 'tabler-barbell',
      color: 'warning',
      reports: ['Trainer Utilization', 'Client Load', 'Session Revenue', 'Performance Metrics', 'Certification Status']
    },
    {
      title: 'Financial Reports',
      icon: 'tabler-report-money',
      color: 'error',
      reports: ['Expense Summary', 'Cash Flow', 'Budget vs Actual', 'Tax Reports', 'Payroll Summary']
    },
    {
      title: 'Inventory Reports',
      icon: 'tabler-package',
      color: 'secondary',
      reports: ['Stock Levels', 'Low Stock Alerts', 'Purchase Orders', 'Sales by Product', 'Supplier Performance']
    }
  ]

  return (
    <Grid container spacing={6}>
      {reportCategories.map((category, index) => (
        <Grid size={{ xs: 12, md: 6 }} key={index}>
          <Card>
            <CardHeader
              title={
                <div className='flex items-center gap-3'>
                  <div className={`flex items-center justify-center w-10 h-10 rounded bg-${category.color}-lightest`}>
                    <i className={`${category.icon} text-2xl text-${category.color}`} />
                  </div>
                  <Typography variant='h5'>{category.title}</Typography>
                </div>
              }
            />
            <CardContent>
              <div className='flex flex-col gap-3'>
                {category.reports.map((report, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between p-3 rounded cursor-pointer hover:bg-actionHover'
                  >
                    <Typography variant='body2'>{report}</Typography>
                    <Button size='small' variant='outlined' startIcon={<i className='tabler-download' />}>
                      Generate
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Custom Report Builder' />
          <CardContent>
            <div className='flex items-center justify-center p-8'>
              <div className='text-center'>
                <i className='tabler-chart-bar text-6xl text-textSecondary mbe-4' />
                <Typography variant='h6' className='mbe-2'>
                  Build Custom Reports
                </Typography>
                <Typography variant='body2' className='text-textSecondary mbe-4'>
                  Create custom reports with specific metrics and date ranges
                </Typography>
                <Button variant='contained' startIcon={<i className='tabler-plus' />}>
                  Create Custom Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ReportsDashboard
