import { useState } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import { scheduleClass } from '@/app/actions/classes'

type Props = {
  open: boolean
  handleClose: () => void
  onClassScheduled?: () => void
}

const ClassScheduleDrawer = (props: Props) => {
  const { open, handleClose, onClassScheduled } = props
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      trainerId: '',
      startTime: '',
      endTime: '',
      capacity: '',
      duration: '60',
      type: 'YOGA',
      difficulty: 'BEGINNER'
    }
  })

  const onSubmit = async (formData: any) => {
    try {
      setIsLoading(true)
      
      const result = await scheduleClass({
        name: formData.name,
        classType: formData.type,
        trainerId: formData.trainerId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        capacity: parseInt(formData.capacity),
        duration: parseInt(formData.duration),
        difficulty: formData.difficulty
      })

      if (result.success) {
        toast.success('Class scheduled successfully!')
        handleClose()
        resetForm()
        onClassScheduled?.()
      } else {
        toast.error(result.error || 'Failed to schedule class')
      }
    } catch (error) {
      console.error('Error scheduling class:', error)
      toast.error('An error occurred while scheduling the class')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    handleClose()
    resetForm()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between plb-5 pli-6'>
        <Typography variant='h5'>Schedule New Class</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6'>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
          <Controller
            name='name'
            control={control}
            rules={{ required: 'Class name is required' }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Class Name'
                placeholder='e.g., Morning Yoga, CrossFit'
                {...(errors.name && { error: true, helperText: errors.name.message })}
              />
            )}
          />

          <Controller
            name='trainerId'
            control={control}
            rules={{ required: 'Trainer is required' }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Trainer'
                placeholder='Select trainer'
                select
                {...(errors.trainerId && { error: true, helperText: errors.trainerId.message })}
              >
                <MenuItem value=''>Select Trainer</MenuItem>
                <MenuItem value='trainer_001'>John Doe</MenuItem>
                <MenuItem value='trainer_002'>Jane Smith</MenuItem>
                <MenuItem value='trainer_003'>Mike Johnson</MenuItem>
              </CustomTextField>
            )}
          />

          <Controller
            name='type'
            control={control}
            rules={{ required: 'Class type is required' }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Class Type'
                placeholder='Select type'
                select
                {...(errors.type && { error: true, helperText: errors.type.message })}
              >
                <MenuItem value='YOGA'>Yoga</MenuItem>
                <MenuItem value='PILATES'>Pilates</MenuItem>
                <MenuItem value='ZUMBA'>Zumba</MenuItem>
                <MenuItem value='AEROBICS'>Aerobics</MenuItem>
                <MenuItem value='STRENGTH_TRAINING'>Strength Training</MenuItem>
                <MenuItem value='CARDIO'>Cardio</MenuItem>
                <MenuItem value='HIIT'>HIIT</MenuItem>
                <MenuItem value='CROSSFIT'>CrossFit</MenuItem>
                <MenuItem value='MARTIAL_ARTS'>Martial Arts</MenuItem>
                <MenuItem value='DANCE'>Dance</MenuItem>
                <MenuItem value='MEDITATION'>Meditation</MenuItem>
                <MenuItem value='STRETCHING'>Stretching</MenuItem>
                <MenuItem value='FUNCTIONAL_TRAINING'>Functional Training</MenuItem>
                <MenuItem value='BODYBUILDING'>Bodybuilding</MenuItem>
                <MenuItem value='POWERLIFTING'>Powerlifting</MenuItem>
              </CustomTextField>
            )}
          />

          <Controller
            name='difficulty'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Difficulty Level'
                placeholder='Select difficulty'
                select
                {...(errors.difficulty && { error: true, helperText: 'This field is required.' })}
              >
                <MenuItem value='BEGINNER'>Beginner</MenuItem>
                <MenuItem value='INTERMEDIATE'>Intermediate</MenuItem>
                <MenuItem value='ADVANCED'>Advanced</MenuItem>
              </CustomTextField>
            )}
          />

          <Controller
            name='startTime'
            control={control}
            rules={{ required: 'Start time is required' }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                type='time'
                label='Start Time'
                InputLabelProps={{ shrink: true }}
                {...(errors.startTime && { error: true, helperText: errors.startTime.message })}
              />
            )}
          />

          <Controller
            name='duration'
            control={control}
            rules={{ required: 'Duration is required', min: { value: 15, message: 'Minimum duration is 15 minutes' } }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                type='number'
                label='Duration (minutes)'
                placeholder='e.g., 60'
                {...(errors.duration && { error: true, helperText: errors.duration.message })}
              />
            )}
          />

          <Controller
            name='endTime'
            control={control}
            rules={{ required: 'End time is required' }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                type='time'
                label='End Time'
                InputLabelProps={{ shrink: true }}
                {...(errors.endTime && { error: true, helperText: errors.endTime.message })}
              />
            )}
          />

          <Controller
            name='capacity'
            control={control}
            rules={{ required: 'Capacity is required', min: { value: 1, message: 'Capacity must be at least 1' } }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                type='number'
                label='Capacity'
                placeholder='e.g., 20'
                {...(errors.capacity && { error: true, helperText: errors.capacity.message })}
              />
            )}
          />

          <div className='flex items-center gap-4 mbs-4'>
            <Button fullWidth variant='contained' type='submit' disabled={isLoading}>
              {isLoading ? 'Scheduling...' : 'Schedule Class'}
            </Button>
            <Button fullWidth variant='tonal' color='error' type='reset' onClick={handleReset} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default ClassScheduleDrawer
