'use client'

import { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import classnames from 'classnames'

import type { ThemeColor } from '@core/types'
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import { getRecentTransactions } from '@/app/actions/dashboards/ecommerce'

type TransactionData = {
  id: string
  amount: number
  type: string
  paymentMethod: string
  memberName: string
  branch: string
  createdAt: Date
}

const getPaymentMethodIcon = (method: string): { icon: string; color: ThemeColor } => {
  const methodLower = method?.toLowerCase() || ''
  if (methodLower.includes('cash')) return { icon: 'tabler-cash', color: 'success' }
  if (methodLower.includes('card') || methodLower.includes('credit')) return { icon: 'tabler-credit-card', color: 'primary' }
  if (methodLower.includes('upi') || methodLower.includes('wallet')) return { icon: 'tabler-wallet', color: 'warning' }
  if (methodLower.includes('bank')) return { icon: 'tabler-building-bank', color: 'info' }
  return { icon: 'tabler-currency-dollar', color: 'secondary' }
}

const Transactions = () => {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<TransactionData[]>([])

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const data = await getRecentTransactions(7)
      setTransactions(data)
    } catch (err) {
      console.error('Failed to load transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <Card className='flex flex-col'>
      <CardHeader
        title='Transactions'
        subheader={`Total ${transactions.length} transactions | $${totalAmount.toFixed(0)}`}
        action={<OptionMenu options={['Refresh', 'View All']} onOptionClick={(opt) => opt === 'Refresh' && loadTransactions()} />}
      />
      <CardContent className='flex grow gap-y-[18px] lg:gap-y-5 flex-col justify-between max-sm:gap-5'>
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Box key={index} className='flex items-center gap-4'>
              <Skeleton variant="circular" width={34} height={34} />
              <Box className='flex-1'>
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="text" width="30%" />
              </Box>
              <Skeleton variant="text" width={60} />
            </Box>
          ))
        ) : transactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No transactions found
          </Typography>
        ) : (
          transactions.map((item, index) => {
            const { icon, color } = getPaymentMethodIcon(item.paymentMethod)
            return (
              <div key={item.id || index} className='flex items-center gap-4'>
                <CustomAvatar skin='light' variant='rounded' color={color} size={34}>
                  <i className={classnames(icon, 'text-[22px]')} />
                </CustomAvatar>
                <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
                  <div className='flex flex-col'>
                    <Typography className='font-medium' color='text.primary'>
                      {item.paymentMethod || 'Unknown'}
                    </Typography>
                    <Typography variant='body2'>{item.memberName}</Typography>
                  </div>
                  <Typography color='success.main'>
                    +${item.amount.toFixed(0)}
                  </Typography>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

export default Transactions
