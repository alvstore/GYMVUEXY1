'use client'

import { useState, useEffect } from 'react'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { useForm, Controller } from 'react-hook-form'

import CustomTextField from '@core/components/mui/TextField'

interface EditMemberDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  member: any | null
}

const EditMemberDrawer = ({ open, onClose, onSubmit, member }: EditMemberDrawerProps) => {
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
      dateOfBirth: '',
      gender: 'MALE',
      emergencyContactName: '',
      emergencyContactPhone: ''
    }
  })

  useEffect(() => {
    if (member && open) {
      reset({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phone: member.phone || '',
        dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
        gender: member.gender || 'MALE',
        emergencyContactName: member.emergencyContactName || '',
        emergencyContactPhone: member.emergencyContactPhone || ''
      })
    }
  }, [member, open, reset])

  const handleFormSubmit = async (data: any) => {
    try {
      setLoading(true)
      await onSubmit(data)
      handleReset()
    } catch (error) {
      console.error('Error updating member:', error)
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
        <Typography variant='h5'>Edit Member</Typography>
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
            name='dateOfBirth'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Date of Birth'
                type='date'
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
          <Controller
            name='gender'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                select
                label='Gender'
              >
                <MenuItem value='MALE'>Male</MenuItem>
                <MenuItem value='FEMALE'>Female</MenuItem>
                <MenuItem value='OTHER'>Other</MenuItem>
              </CustomTextField>
            )}
          />
          <Controller
            name='emergencyContactName'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Emergency Contact Name'
                placeholder='Jane Doe'
              />
            )}
          />
          <Controller
            name='emergencyContactPhone'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Emergency Contact Phone'
                placeholder='+1 234 567 8901'
              />
            )}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
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

export default EditMemberDrawer
