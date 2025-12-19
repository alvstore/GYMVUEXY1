// React Imports
import { useState } from 'react'
import type { FormEvent } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Server Actions
import { createMember } from '@/app/actions/members'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  onFormSubmit: (formData: FormDataType) => void
  onMemberCreated?: (memberId: string, memberName: string) => void
}

export type FormDataType = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  gender?: string
}

// Vars
export const initialFormData: FormDataType = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  gender: 'MALE'
}

const genders = ['MALE', 'FEMALE', 'OTHER']

const AddCustomerDrawer = ({ open, setOpen, onFormSubmit, onMemberCreated }: Props) => {
  // States
  const [data, setData] = useState<FormDataType>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Create member using server action
      const memberData = {
        ...data,
        gender: data.gender as 'MALE' | 'FEMALE' | 'OTHER'
      }
      const member = await createMember(memberData)
      
      if (member && member.id) {
        // Call parent callback to add member to list
        if (onMemberCreated) {
          onMemberCreated(member.id, `${member.firstName} ${member.lastName}`)
        }
        
        // Also call the form submit callback for backward compatibility
        onFormSubmit(data)
        handleReset()
      } else {
        setError('Failed to create member')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating member')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setOpen(false)
    setData(initialFormData)
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
        <Typography variant='h5'>Add New Customer</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6'>
        {error && (
          <Alert severity='error' className='mb-4'>
            {error}
          </Alert>
        )}
        <form onSubmit={e => handleSubmit(e)} className='flex flex-col gap-5'>
          <CustomTextField
            fullWidth
            id='firstName'
            label='First Name'
            required
            value={data.firstName}
            onChange={e => setData({ ...data, firstName: e.target.value })}
          />
          <CustomTextField
            fullWidth
            id='lastName'
            label='Last Name'
            required
            value={data.lastName}
            onChange={e => setData({ ...data, lastName: e.target.value })}
          />
          <CustomTextField
            fullWidth
            id='email'
            label='Email'
            type='email'
            required
            value={data.email}
            onChange={e => setData({ ...data, email: e.target.value })}
          />
          <CustomTextField
            fullWidth
            id='phone'
            label='Phone Number'
            required
            value={data.phone}
            onChange={e => setData({ ...data, phone: e.target.value })}
          />
          <CustomTextField
            rows={3}
            multiline
            fullWidth
            id='address'
            label='Address'
            value={data.address}
            onChange={e => setData({ ...data, address: e.target.value })}
          />
          <CustomTextField
            select
            id='gender'
            label='Gender'
            value={data?.gender || 'MALE'}
            onChange={e => setData({ ...data, gender: e.target.value })}
          >
            {genders.map((item, index) => (
              <MenuItem key={index} value={item}>
                {item}
              </MenuItem>
            ))}
          </CustomTextField>
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Member'}
            </Button>
            <Button variant='tonal' color='error' type='reset' onClick={handleReset} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddCustomerDrawer
