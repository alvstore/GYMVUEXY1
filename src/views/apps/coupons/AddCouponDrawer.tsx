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

interface AddCouponDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

const AddCouponDrawer = ({ open, onClose, onSubmit }: AddCouponDrawerProps) => {
  const [loading, setLoading] = useState(false)
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    defaultValues: {
      code: '',
      type: 'PERCENTAGE',
      value: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      maxUses: undefined,
      description: ''
    }
  })

  const couponType = watch('type')

  const handleFormSubmit = async (data: any) => {
    try {
      setLoading(true)
      await onSubmit(data)
      handleReset()
    } catch (error) {
      console.error('Error creating coupon:', error)
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
        <Typography variant='h5'>Add Coupon</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6'>
        <form onSubmit={handleSubmit(handleFormSubmit)} className='flex flex-col gap-6'>
          <Controller
            name='code'
            control={control}
            rules={{ required: true, minLength: { value: 3, message: 'Code must be at least 3 characters' } }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Coupon Code'
                placeholder='SAVE20'
                {...(errors.code && {
                  error: true,
                  helperText: errors.code.message || 'This field is required.'
                })}
              />
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
                label='Discount Type'
                {...(errors.type && { error: true, helperText: 'This field is required.' })}
              >
                <MenuItem value='PERCENTAGE'>Percentage Off</MenuItem>
                <MenuItem value='FIXED_AMOUNT'>Fixed Amount Off</MenuItem>
                <MenuItem value='FREE_BENEFIT'>Free Benefit</MenuItem>
              </CustomTextField>
            )}
          />
          <Controller
            name='value'
            control={control}
            rules={{ required: true, min: { value: 0, message: 'Value must be positive' } }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label={
                  couponType === 'PERCENTAGE' ? 'Percentage (0-100)' :
                  couponType === 'FIXED_AMOUNT' ? 'Amount' :
                  'Benefit Count'
                }
                type='number'
                placeholder='20'
                {...(errors.value && {
                  error: true,
                  helperText: errors.value.message || 'This field is required.'
                })}
              />
            )}
          />
          <Controller
            name='maxUses'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Max Uses (Optional)'
                type='number'
                placeholder='100'
                helperText='Leave empty for unlimited uses'
              />
            )}
          />
          <Controller
            name='validFrom'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Valid From'
                type='date'
                InputLabelProps={{ shrink: true }}
                {...(errors.validFrom && { error: true, helperText: 'This field is required.' })}
              />
            )}
          />
          <Controller
            name='validUntil'
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Valid Until'
                type='date'
                InputLabelProps={{ shrink: true }}
                {...(errors.validUntil && { error: true, helperText: 'This field is required.' })}
              />
            )}
          />
          <Controller
            name='description'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Description'
                multiline
                rows={3}
                placeholder='Internal notes about this coupon'
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

export default AddCouponDrawer
