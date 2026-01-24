import { useState } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createMember } from '@/app/actions/members'

import type { Member } from '@/types/apps/memberTypes'

import CustomTextField from '@core/components/mui/TextField'

const memberFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be 50 characters or less'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be 50 characters or less'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().max(200, 'Address must be 200 characters or less').optional(),
  emergencyContact: z.string().max(100, 'Emergency contact name must be 100 characters or less').optional(),
  emergencyPhone: z.string().regex(/^[\d\s\-\+\(\)]*$/, 'Invalid phone number format').optional().or(z.literal('')),
  bloodGroup: z.string().optional(),
  medicalNotes: z.string().max(500, 'Medical notes must be 500 characters or less').optional()
})

type MemberFormData = z.infer<typeof memberFormSchema>

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
    resolver: zodResolver(memberFormSchema),
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
          <Controller
            name='lastName'
            control={control}
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
          <Controller
            name='email'
            control={control}
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
          <Controller
            name='phone'
            control={control}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Phone'
                placeholder='+1 234 567 8900'
                error={!!errors.phone}
                helperText={errors.phone?.message}
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
