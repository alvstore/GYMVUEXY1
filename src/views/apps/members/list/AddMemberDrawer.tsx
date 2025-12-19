import { useState } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

import { useForm, Controller } from 'react-hook-form'
import { createMember } from '@/app/actions/members'

import type { Member, MemberFormData } from '@/types/apps/memberTypes'

import CustomTextField from '@core/components/mui/TextField'

type Props = {
  open: boolean
  handleClose: () => void
  setData: (data: Member[]) => void
}

const AddMemberDrawer = (props: Props) => {
  const { open, handleClose, setData } = props

  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors }
  } = useForm<MemberFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      emergencyContact: '',
      emergencyPhone: '',
      bloodGroup: '',
      medicalNotes: ''
    }
  })

  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (formData: MemberFormData) => {
    try {
      setIsLoading(true)
      
      const result = await createMember({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        gender: formData.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone
      })

      if (result) {
        console.log('Member created successfully:', result)
        handleClose()
        resetForm()
        // Optionally add member to the list
        if (setData && result) {
          setData([result as any])
        }
      }
    } catch (error) {
      console.error('Error adding member:', error)
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
        <Typography variant='h5'>Add New Member</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6'>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
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
            rules={{ required: true }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Phone'
                placeholder='+1 234 567 8900'
                {...(errors.phone && { error: true, helperText: 'This field is required.' })}
              />
            )}
          />

          <Divider className='mbs-4' />
          <Typography variant='h6'>Emergency Contact</Typography>

          <Controller
            name='emergencyContact'
            control={control}
            render={({ field }) => (
              <CustomTextField {...field} fullWidth label='Emergency Contact Name' placeholder='Jane Doe' />
            )}
          />
          <Controller
            name='emergencyPhone'
            control={control}
            render={({ field }) => (
              <CustomTextField {...field} fullWidth label='Emergency Phone' placeholder='+1 234 567 8901' />
            )}
          />

          <Divider className='mbs-4' />
          <Typography variant='h6'>Medical Information</Typography>

          <Controller
            name='bloodGroup'
            control={control}
            render={({ field }) => (
              <CustomTextField select fullWidth label='Blood Group' {...field}>
                <MenuItem value='A+'>A+</MenuItem>
                <MenuItem value='A-'>A-</MenuItem>
                <MenuItem value='B+'>B+</MenuItem>
                <MenuItem value='B-'>B-</MenuItem>
                <MenuItem value='AB+'>AB+</MenuItem>
                <MenuItem value='AB-'>AB-</MenuItem>
                <MenuItem value='O+'>O+</MenuItem>
                <MenuItem value='O-'>O-</MenuItem>
              </CustomTextField>
            )}
          />
          <Controller
            name='medicalNotes'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                multiline
                rows={3}
                label='Medical Notes'
                placeholder='Any allergies, conditions, or medical notes...'
              />
            )}
          />

          <div className='flex items-center gap-4 mbs-4'>
            <Button fullWidth variant='contained' type='submit' disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Add Member'}
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

export default AddMemberDrawer
