// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Components Imports
import OptionMenu from '@core/components/option-menu'

type DataType = {
  title: string
  imgSrc: string
  subtitle: string
  trendNumber: number
  trend?: 'positive' | 'negative'
}

// Vars
const data: DataType[] = [
  {
    title: '$12,450',
    subtitle: 'Membership Sales',
    trendNumber: 18.5,
    imgSrc: '/images/cards/membership.png'
  },
  {
    title: '$8,320',
    subtitle: 'Personal Training',
    trendNumber: 22.1,
    imgSrc: '/images/cards/training.png'
  },
  {
    title: '$6,750',
    subtitle: 'POS Sales',
    trendNumber: 12.3,
    trend: 'negative',
    imgSrc: '/images/cards/pos.png'
  },
  {
    title: '$4,280',
    subtitle: 'Class Packages',
    trendNumber: 15.4,
    imgSrc: '/images/cards/classes.png'
  },
  {
    title: '$2,150',
    subtitle: 'Equipment Sales',
    trendNumber: 8.7,
    imgSrc: '/images/cards/equipment.png'
  },
  {
    title: '$1,890',
    subtitle: 'Locker Rentals',
    trendNumber: 6.8,
    trend: 'negative',
    imgSrc: '/images/cards/lockers.png'
  }
]

const SalesByCountries = () => {
  return (
    <Card>
      <CardHeader
        title='Service Analytics'
        subheader='Monthly Performance Overview'
        action={<OptionMenu options={['Last Week', 'Last Month', 'Last Year']} />}
      />
      <CardContent className='flex flex-col gap-[1.0875rem]'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <img src={item.imgSrc} alt={item.subtitle} width={34} />
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{item.subtitle}</Typography>
              </div>
              <div className='flex items-center gap-1'>
                <i
                  className={classnames(
                    item.trend === 'negative' ? 'tabler-chevron-down text-error' : 'tabler-chevron-up text-success',
                    'text-xl'
                  )}
                />
                <Typography
                  variant='h6'
                  color={`${item.trend === 'negative' ? 'error' : 'success'}.main`}
                >{`${item.trendNumber}%`}</Typography>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default SalesByCountries
