'use client'

import { useState } from 'react'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { useForm, Controller } from 'react-hook-form'

import CustomTextField from '@core/components/mui/TextField'

interface AddGoalDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  members?: Array<{ id: string; firstName: string; lastName: string }>
  trainers?: Array<{ id: string; firstName: string; lastName: string }>
}

const AddGoalDrawer = ({ open, onClose, onSubmit, members = [], trainers = [] }: AddGoalDrawerProps) => {
  const [loading, setLoading] = useState(false)
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      memberId: '',
      type: 'WEIGHT_LOSS',
      targetValue: 0,
      currentValue: 0,
      targetDate: '',
      assignedTrainerId: '',
      notes: ''
    }
  })

  const handleFormSubmit = async (data: any) => {
    try {
      setLoading(true)
      await onSubmit(data)
      handleReset()
    } catch (error) {
      console.error('Error creating goal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    reset()
    onClose()
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
        <Typography variant='h5'>Add Fitness Goal</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6'>
        <form onSubmit={handleSubmit(handleFormSubmit)} className='flex flex-col gap-6'>
          <Controller
            name='memberId'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                select
                label='Member'
                {...(errors.memberId && { error: true, helperText: 'This field is required.' })}
              >
                {members.length === 0 && <MenuItem value=''>No members available</MenuItem>}
                {members.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </MenuItem>
                ))}
              </CustomTextField>
            )}
          />
          <Controller
            name='type'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                select
                label='Goal Type'
                {...(errors.type && { error: true, helperText: 'This field is required.' })}
              >
                <MenuItem value='WEIGHT_LOSS'>Weight Loss</MenuItem>
                <MenuItem value='MUSCLE_GAIN'>Muscle Gain</MenuItem>
                <MenuItem value='ENDURANCE'>Endurance</MenuItem>
                <MenuItem value='FLEXIBILITY'>Flexibility</MenuItem>
                <MenuItem value='GENERAL_FITNESS'>General Fitness</MenuItem>
              </CustomTextField>
            )}
          />
          <Controller
            name='currentValue'
            control={control}
            rules={{ required: true, min: { value: 0, message: 'Current value must be positive' } }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Current Value'
                type='number'
                placeholder='75'
                helperText='kg/reps/mins'
                {...(errors.currentValue && {
                  error: true,
                  helperText: errors.currentValue.message || 'This field is required.'
                })}
              />
            )}
          />
          <Controller
            name='targetValue'
            control={control}
            rules={{ required: true, min: { value: 0, message: 'Target value must be positive' } }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Target Value'
                type='number'
                placeholder='70'
                helperText='kg/reps/mins'
                {...(errors.targetValue && {
                  error: true,
                  helperText: errors.targetValue.message || 'This field is required.'
                })}
              />
            )}
          />
          <Controller
            name='targetDate'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Target Date'
                type='date'
                InputLabelProps={{ shrink: true }}
                {...(errors.targetDate && { error: true, helperText: 'This field is required.' })}
              />
            )}
          />
          <Controller
            name='assignedTrainerId'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                select
                label='Assigned Trainer (Optional)'
              >
                <MenuItem value=''>None</MenuItem>
                {trainers.map((trainer) => (
                  <MenuItem key={trainer.id} value={trainer.id}>
                    {trainer.firstName} {trainer.lastName}
                  </MenuItem>
                ))}
              </CustomTextField>
            )}
          />
          <Controller
            name='notes'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Notes'
                multiline
                rows={3}
                placeholder='Additional notes or specific instructions'
              />
            )}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Submit'}
            </Button>
            <Button variant='tonal' color='error' type='reset' onClick={handleReset}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddGoalDrawer
