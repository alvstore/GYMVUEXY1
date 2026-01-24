'use client'

import { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Skeleton from '@mui/material/Skeleton'

import type { ThemeColor } from '@core/types'
import CustomAvatar from '@core/components/mui/Avatar'
import { getEcommerceStatistics } from '@/app/actions/dashboards/ecommerce'

type StatItem = {
  icon: string
  stats: string
  title: string
  color: ThemeColor
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

const formatCurrency = (num: number): string => {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`
  return `$${num.toFixed(0)}`
}

const StatisticsCard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatItem[]>([
    { stats: '0', title: 'Sales', color: 'primary', icon: 'tabler-chart-pie-2' },
    { stats: '0', title: 'Members', color: 'info', icon: 'tabler-users' },
    { stats: '0', title: 'Products', color: 'error', icon: 'tabler-shopping-cart' },
    { stats: '$0', title: 'Revenue', color: 'success', icon: 'tabler-currency-dollar' }
  ])
  const [lastUpdated, setLastUpdated] = useState<string>('Loading...')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getEcommerceStatistics()
      setStats([
        { stats: formatNumber(data.totalSales), title: 'Sales', color: 'primary', icon: 'tabler-chart-pie-2' },
        { stats: formatNumber(data.totalCustomers), title: 'Members', color: 'info', icon: 'tabler-users' },
        { stats: formatNumber(data.totalProducts), title: 'Products', color: 'error', icon: 'tabler-shopping-cart' },
        { stats: formatCurrency(data.totalRevenue), title: 'Revenue', color: 'success', icon: 'tabler-currency-dollar' }
      ])
      setLastUpdated(`Last ${data.period}`)
    } catch (err) {
      console.error('Failed to load statistics:', err)
      setLastUpdated('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Statistics'
        action={
          <Typography variant='subtitle2' color='text.disabled'>
            {lastUpdated}
          </Typography>
        }
      />
      <CardContent className='flex justify-between flex-wrap gap-4 md:pbs-10 max-md:pbe-6 max-[1060px]:pbe-[74px] max-[1200px]:pbe-[52px] max-[1320px]:pbe-[74px] max-[1501px]:pbe-[52px]'>
        <Grid container spacing={4} sx={{ inlineSize: '100%' }}>
          {stats.map((item, index) => (
            <Grid key={index} size={{ xs: 6, sm: 3 }} className='flex items-center gap-4'>
              <CustomAvatar color={item.color} variant='rounded' size={40} skin='light'>
                <i className={item.icon}></i>
              </CustomAvatar>
              <div className='flex flex-col'>
                {loading ? (
                  <>
                    <Skeleton variant="text" width={60} height={28} />
                    <Skeleton variant="text" width={50} height={20} />
                  </>
                ) : (
                  <>
                    <Typography variant='h5'>{item.stats}</Typography>
                    <Typography variant='body2'>{item.title}</Typography>
                  </>
                )}
              </div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default StatisticsCard
