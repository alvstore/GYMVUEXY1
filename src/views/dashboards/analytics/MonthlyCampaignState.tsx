// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

import type { ThemeColor } from '@core/types'

// Components Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

type DataType = {
  icon: string
  title: string
  amount: string
  avatarColor: ThemeColor
  trendNumber: string
  trend?: 'positive' | 'negative'
}

// Vars
const data: DataType[] = [
  {
    title: 'Membership Revenue',
    amount: '$12,450',
    trendNumber: '+18.5%',
    avatarColor: 'success',
    icon: 'tabler-crown'
  },
  {
    title: 'Personal Training',
    amount: '$8,320',
    trendNumber: '+22.1%',
    avatarColor: 'primary',
    icon: 'tabler-dumbbell'
  },
  {
    title: 'Staff Salaries',
    amount: '$15,600',
    trendNumber: '-8.2%',
    trend: 'negative',
    avatarColor: 'error',
    icon: 'tabler-users'
  },
  {
    title: 'Equipment Sales',
    amount: '$4,280',
    trendNumber: '+15.4%',
    avatarColor: 'info',
    icon: 'tabler-settings'
  },
  {
    title: 'Rent & Utilities',
    amount: '$3,200',
    trendNumber: '-2.1%',
    trend: 'negative',
    avatarColor: 'warning',
    icon: 'tabler-building'
  },
  {
    title: 'Marketing',
    amount: '$1,890',
    trendNumber: '+6.8%',
    avatarColor: 'secondary',
    icon: 'tabler-speakerphone'
  }
]

const MonthlyCampaignState = () => {
  return (
    <Card>
      <CardHeader
        title='Gym Financial Overview'
        subheader='Monthly Income & Expenses'
        action={<OptionMenu options={['Last Month', 'Last 6 Months', 'Last Year']} />}
      />
      <CardContent className='flex flex-col gap-6 md:gap-[1.6875rem]'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <CustomAvatar skin='light' variant='rounded' color={item.avatarColor} size={34}>
              <i className={classnames(item.icon, 'text-[22px]')} />
            </CustomAvatar>
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <Typography className='font-medium' color='text.primary'>
                {item.title}
              </Typography>
              <div className='flex items-center gap-4'>
                <Typography>{item.amount}</Typography>
                <Typography
                  className='flex justify-end is-11'
                  color={`${item.trend === 'negative' ? 'error' : 'success'}.main`}
                >
                  {item.trendNumber}
                </Typography>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default MonthlyCampaignState
