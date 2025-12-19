'use client'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

const FinanceDashboard = () => {
  const stats = [
    { title: 'Total Revenue', value: '₹12,50,000', change: '+12%', color: 'success' as const, icon: 'tabler-currency-rupee' },
    { title: 'Total Expenses', value: '₹4,80,000', change: '+5%', color: 'error' as const, icon: 'tabler-receipt' },
    { title: 'Net Profit', value: '₹7,70,000', change: '+18%', color: 'primary' as const, icon: 'tabler-trending-up' },
    { title: 'Outstanding', value: '₹1,25,000', change: '-8%', color: 'warning' as const, icon: 'tabler-alert-circle' }
  ]

  const recentTransactions = [
    { id: 1, type: 'Membership Fee', member: 'John Doe', amount: 5000, date: '2024-11-19', status: 'Completed' },
    { id: 2, type: 'Product Sale', member: 'Sarah Smith', amount: 1500, date: '2024-11-19', status: 'Completed' },
    { id: 3, type: 'Personal Training', member: 'Mike Johnson', amount: 3000, date: '2024-11-18', status: 'Pending' }
  ]

  return (
    <div>
      <Grid container spacing={6} className='mbe-6'>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <div className='flex justify-between items-start'>
                  <div>
                    <Typography variant='h4' className='mbe-2'>
                      {stat.value}
                    </Typography>
                    <Typography className='text-textSecondary mbe-1'>{stat.title}</Typography>
                    <Chip label={stat.change} size='small' color={stat.color} />
                  </div>
                  <div className='flex'>
                    <i className={`${stat.icon} text-4xl text-textSecondary`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader title='Recent Transactions' />
            <CardContent>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-be'>
                      <th className='text-start pli-0 plb-3'>Type</th>
                      <th className='text-start plb-3'>Member</th>
                      <th className='text-start plb-3'>Amount</th>
                      <th className='text-start plb-3'>Date</th>
                      <th className='text-start plb-3 pie-0'>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map(transaction => (
                      <tr key={transaction.id} className='border-be'>
                        <td className='pli-0 plb-3'>
                          <Typography className='font-medium'>{transaction.type}</Typography>
                        </td>
                        <td className='plb-3'>{transaction.member}</td>
                        <td className='plb-3'>₹{transaction.amount.toLocaleString()}</td>
                        <td className='plb-3'>{new Date(transaction.date).toLocaleDateString()}</td>
                        <td className='plb-3 pie-0'>
                          <Chip
                            label={transaction.status}
                            size='small'
                            color={transaction.status === 'Completed' ? 'success' : 'warning'}
                            variant='tonal'
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title='Quick Actions' />
            <CardContent className='flex flex-col gap-4'>
              <div className='flex items-center gap-3 cursor-pointer hover:bg-actionHover pli-4 plb-3 rounded'>
                <i className='tabler-receipt text-2xl text-primary' />
                <div className='flex-1'>
                  <Typography className='font-medium'>Record Expense</Typography>
                  <Typography variant='body2' className='text-textSecondary'>
                    Add new expense
                  </Typography>
                </div>
              </div>
              <div className='flex items-center gap-3 cursor-pointer hover:bg-actionHover pli-4 plb-3 rounded'>
                <i className='tabler-file-invoice text-2xl text-success' />
                <div className='flex-1'>
                  <Typography className='font-medium'>Generate Report</Typography>
                  <Typography variant='body2' className='text-textSecondary'>
                    Financial reports
                  </Typography>
                </div>
              </div>
              <div className='flex items-center gap-3 cursor-pointer hover:bg-actionHover pli-4 plb-3 rounded'>
                <i className='tabler-users text-2xl text-warning' />
                <div className='flex-1'>
                  <Typography className='font-medium'>Pending Payments</Typography>
                  <Typography variant='body2' className='text-textSecondary'>
                    View outstanding
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}

export default FinanceDashboard
