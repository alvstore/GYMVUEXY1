'use client'

import { useState, useEffect } from 'react'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import CustomTextField from '@/@core/components/mui/TextField'
import { enrollMember } from '@/app/actions/onboarding'

interface StaffEnrollmentFormProps {
  open: boolean
  onClose: () => void
  plans: any[]
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  emergencyContactName?: string
  emergencyContactPhone?: string
  planId: string
  startDate: string
  durationDays: number
  couponCode?: string
}

const StaffEnrollmentForm = ({ open, onClose, plans }: StaffEnrollmentFormProps) => {
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      durationDays: 30
    }
  })

  const selectedPlanId = watch('planId')
  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  useEffect(() => {
    if (selectedPlan) {
      reset({ durationDays: selectedPlan.duration || 30 }, { keepValues: true })
    }
  }, [selectedPlan, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const result = await enrollMember(data)
      
      if (result.success) {
        toast.success(`Member ${data.firstName} ${data.lastName} enrolled successfully!`)
        reset()
        onClose()
      } else {
        toast.error(result.error || 'Failed to enroll member')
      }
    } catch (error) {
      toast.error('An error occurred during enrollment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between p-6'>
        <Typography variant='h5'>Enroll New Member</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='tabler-x' />
        </IconButton>
      </div>
      <Divider />
      
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6 p-6'>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant='h6' className='mb-2'>Personal Information</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name='firstName'
              control={control}
              rules={{ required: 'First name is required' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='First Name'
                  placeholder='John'
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='lastName'
              control={control}
              rules={{ required: 'Last name is required' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Last Name'
                  placeholder='Doe'
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name='email'
              control={control}
              rules={{
                required: 'Email is required',
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
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name='phone'
              control={control}
              rules={{ required: 'Phone is required' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Phone'
                  placeholder='+1234567890'
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='dateOfBirth'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  type='date'
                  label='Date of Birth'
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='gender'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  select
                  label='Gender'
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value=''>Select Gender</MenuItem>
                  <MenuItem value='MALE'>Male</MenuItem>
                  <MenuItem value='FEMALE'>Female</MenuItem>
                  <MenuItem value='OTHER'>Other</MenuItem>
                </CustomTextField>
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography variant='h6' className='mb-2'>Membership Details</Typography>
          </Grid>

          <Grid item xs={12}>
            <Controller
              name='planId'
              control={control}
              rules={{ required: 'Plan selection is required' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  select
                  label='Membership Plan'
                  error={!!errors.planId}
                  helperText={errors.planId?.message}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value=''>Select a Plan</MenuItem>
                  {plans?.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price} ({plan.duration} days)
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='startDate'
              control={control}
              rules={{ required: 'Start date is required' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  type='date'
                  label='Start Date'
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.startDate}
                  helperText={errors.startDate?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='durationDays'
              control={control}
              rules={{ required: 'Duration is required', min: 1 }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  type='number'
                  label='Duration (Days)'
                  error={!!errors.durationDays}
                  helperText={errors.durationDays?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name='couponCode'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Coupon Code (Optional)'
                  placeholder='DISCOUNT2024'
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <div className='flex gap-4'>
              <Button
                fullWidth
                variant='contained'
                type='submit'
                disabled={loading}
              >
                {loading ? 'Enrolling...' : 'Enroll Member'}
              </Button>
              <Button
                fullWidth
                variant='outlined'
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </Grid>
        </Grid>
      </form>
    </Drawer>
  )
}

export default StaffEnrollmentForm
