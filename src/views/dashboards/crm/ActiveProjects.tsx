// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'

import type { ThemeColor } from '@core/types'

// Components Imports
import OptionMenu from '@core/components/option-menu'

type DataType = {
  title: string
  imgSrc: string
  progress: number
  subtitle: string
  progressColor: ThemeColor
}

// Vars
const data: DataType[] = [
  {
    title: 'Premium',
    subtitle: '12 months plan',
    progress: 85,
    progressColor: 'primary',
    imgSrc: '/images/logos/premium.png'
  },
  {
    title: 'Standard',
    subtitle: '6 months plan',
    progress: 64,
    progressColor: 'success',
    imgSrc: '/images/logos/standard.png'
  },
  {
    title: 'Basic',
    subtitle: '3 months plan',
    progress: 40,
    progressColor: 'info',
    imgSrc: '/images/logos/basic.png'
  },
  {
    title: 'Student',
    subtitle: '12 months plan',
    progress: 72,
    progressColor: 'warning',
    imgSrc: '/images/logos/student.png'
  },
  {
    title: 'Family',
    subtitle: '6 months plan',
    progress: 55,
    progressColor: 'error',
    imgSrc: '/images/logos/family.png'
  },
  {
    title: 'Senior',
    subtitle: '3 months plan',
    progress: 30,
    progressColor: 'secondary',
    imgSrc: '/images/logos/senior.png'
  }
]

const ActiveMemberships = () => {
  return (
    <Card>
      <CardHeader
        title='Active Memberships'
        subheader='Average 68% utilization'
        action={<OptionMenu options={['Refresh', 'Update', 'Export']} />}
      />
      <CardContent className='flex flex-col gap-4'>
        {data.map((item, index) => (
          <div key={index} className='flex items-center gap-4'>
            <img src={item.imgSrc} alt={item.title} width={32} />
            <div className='flex flex-wrap justify-between items-center gap-x-4 gap-y-1 is-full'>
              <div className='flex flex-col'>
                <Typography className='font-medium' color='text.primary'>
                  {item.title}
                </Typography>
                <Typography variant='body2'>{item.subtitle}</Typography>
              </div>
              <div className='flex justify-between items-center is-32'>
                <LinearProgress
                  value={item.progress}
                  variant='determinate'
                  color={item.progressColor}
                  className='min-bs-2 is-20'
                />
                <Typography color='text.disabled'>{`${item.progress}%`}</Typography>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default ActiveMemberships
