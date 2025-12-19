'use client'

// MUI Imports
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import MuiLinearProgress from '@mui/material/LinearProgress'
import { styled } from '@mui/material/styles'

// Custom Components Imports
import CustomAvatar from '@core/components/mui/Avatar'

const LinearProgress = styled(MuiLinearProgress)(() => ({
  '&.MuiLinearProgress-colorInfo': { backgroundColor: 'var(--mui-palette-primary-main)' },
  '& .MuiLinearProgress-bar': {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0
  }
}))

const SalesOverview = () => {
  return (
    <Card>
      <CardContent>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <Typography>Gym Overview</Typography>
            <Typography variant='h4'>1,248</Typography>
          </div>
          <Typography color='success.main' className='font-medium'>
            +12.5%
          </Typography>
        </div>
        <div className='flex items-center justify-between mlb-[1.4375rem]'>
          <div className='flex flex-col plb-2.25'>
            <div className='flex items-center mbe-2.5 gap-x-[6px]'>
              <Typography color='text.secondary' className='m'>
                Active
              </Typography>
              <CustomAvatar skin='light' color='success' variant='rounded' size={24}>
                <i className='tabler-user-check text-lg' />
              </CustomAvatar>
            </div>
            <Typography variant='h5' className='mbe-1'>
              1,042
            </Typography>
            <Typography variant='body2' color='text.disabled' className='text-end'>
              Members
            </Typography>
          </div>
        </div>
        <LinearProgress value={78} variant='determinate' className='mbs-6 mbe-4' />
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center'>
            <div className='is-[46px] bs-[4px] bg-actionHover rounded-full mbe-1 mie-2'>
              <div className='bg-info rounded-bs-[4px] is-2/3 bs-[4px]' />
            </div>
            <div className='flex flex-col'>
              <Typography className='font-medium'>824</Typography>
              <Typography variant='body2' color='text.disabled'>
                Monthly Visits
              </Typography>
            </div>
          </div>
          <div className='flex items-center'>
            <div className='is-[46px] bs-[4px] bg-actionHover rounded-full mbe-1 mie-2'>
              <div className='bg-primary rounded-bs-[4px] is-1/4 bs-[4px]' />
            </div>
            <div className='flex flex-col'>
              <Typography className='font-medium'>42</Typography>
              <Typography variant='body2' color='text.disabled'>
                Inactive Members
              </Typography>
            </div>
          </div>
        </div>
        <LinearProgress value={65} color='info' variant='determinate' className='bs-2.5' />
      </CardContent>
    </Card>
  )
}

export default SalesOverview
