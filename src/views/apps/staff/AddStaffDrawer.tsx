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

interface AddStaffDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

const AddStaffDrawer = ({ open, onClose, onSubmit }: AddStaffDrawerProps) => {
  const [loading, setLoading] = useState(false)
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'RECEPTIONIST',
      department: 'FRONT_DESK',
      salary: 0,
      employmentType: 'FULL_TIME'
    }
  })

  const handleFormSubmit = async (data: any) => {
    try {
      setLoading(true)
      await onSubmit(data)
      handleReset()
    } catch (error) {
      console.error('Error adding staff:', error)
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
        <Typography variant='h5'>Add Staff Member</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6'>
        <form onSubmit={handleSubmit(handleFormSubmit)} className='flex flex-col gap-6'>
          <Controller
            name='firstName'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='First Name'
                placeholder='John'
                {...(errors.firstName && { error: true, helperText: 'This field is required.' })}
              />
            )}
          />
          <Controller
            name='lastName'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Last Name'
                placeholder='Doe'
                {...(errors.lastName && { error: true, helperText: 'This field is required.' })}
              />
            )}
          />
          <Controller
            name='email'
            control={control}
            rules={{
              required: true,
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                type='email'
                label='Email'
                placeholder='john.doe@example.com'
                {...(errors.email && {
                  error: true,
                  helperText: errors.email.message || 'This field is required.'
                })}
              />
            )}
          />
          <Controller
            name='phone'
            control={control}
            rules={{ required: true, minLength: { value: 10, message: 'Phone must be at least 10 digits' } }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Phone'
                placeholder='+1 234 567 8900'
                {...(errors.phone && {
                  error: true,
                  helperText: errors.phone.message || 'This field is required.'
                })}
              />
            )}
          />
          <Controller
            name='role'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                select
                label='Role'
                {...(errors.role && { error: true, helperText: 'This field is required.' })}
              >
                <MenuItem value='RECEPTIONIST'>Receptionist</MenuItem>
                <MenuItem value='TRAINER'>Trainer</MenuItem>
                <MenuItem value='MANAGER'>Manager</MenuItem>
                <MenuItem value='CLEANER'>Cleaner</MenuItem>
                <MenuItem value='MAINTENANCE'>Maintenance</MenuItem>
              </CustomTextField>
            )}
          />
          <Controller
            name='department'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                select
                label='Department'
                {...(errors.department && { error: true, helperText: 'This field is required.' })}
              >
                <MenuItem value='FRONT_DESK'>Front Desk</MenuItem>
                <MenuItem value='FITNESS'>Fitness</MenuItem>
                <MenuItem value='MANAGEMENT'>Management</MenuItem>
                <MenuItem value='OPERATIONS'>Operations</MenuItem>
              </CustomTextField>
            )}
          />
          <Controller
            name='salary'
            control={control}
            rules={{ required: true, min: { value: 0, message: 'Salary must be positive' } }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Monthly Salary'
                type='number'
                placeholder='50000'
                {...(errors.salary && {
                  error: true,
                  helperText: errors.salary.message || 'This field is required.'
                })}
              />
            )}
          />
          <Controller
            name='employmentType'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                select
                label='Employment Type'
                {...(errors.employmentType && { error: true, helperText: 'This field is required.' })}
              >
                <MenuItem value='FULL_TIME'>Full Time</MenuItem>
                <MenuItem value='PART_TIME'>Part Time</MenuItem>
                <MenuItem value='CONTRACT'>Contract</MenuItem>
              </CustomTextField>
            )}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Adding...' : 'Submit'}
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

export default AddStaffDrawer
