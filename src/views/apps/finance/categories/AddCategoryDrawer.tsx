'use client'

import { useState } from 'react'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'

type Category = {
  id: string
  name: string
  categoryType: 'INCOME' | 'EXPENSE'
  parentId: string | null
}

type AddCategoryDrawerProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  categories: Category[]
}

const commonColors = [
  { label: 'Primary', value: '#7367F0' },
  { label: 'Success', value: '#28C76F' },
  { label: 'Error', value: '#EA5455' },
  { label: 'Warning', value: '#FF9F43' },
  { label: 'Info', value: '#00CFE8' },
  { label: 'Secondary', value: '#82868B' }
]

const commonIcons = [
  'tabler-cash',
  'tabler-credit-card',
  'tabler-wallet',
  'tabler-receipt',
  'tabler-shopping-cart',
  'tabler-building-store',
  'tabler-briefcase',
  'tabler-trending-up',
  'tabler-chart-pie',
  'tabler-coin'
]

const AddCategoryDrawer = ({ open, onClose, onSuccess, categories }: AddCategoryDrawerProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryType: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    parentId: '',
    color: '#7367F0',
    icon: 'tabler-cash'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/finance/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          categoryType: formData.categoryType,
          parentId: formData.parentId || undefined,
          color: formData.color,
          icon: formData.icon
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create category')
      }
      
      toast.success('Category created successfully')
      handleReset()
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create category')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      categoryType: 'EXPENSE',
      parentId: '',
      color: '#7367F0',
      icon: 'tabler-cash'
    })
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const availableParents = categories.filter(
    cat => cat.categoryType === formData.categoryType && !cat.parentId && cat.id !== formData.parentId
  )

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between p-6'>
        <Typography variant='h5'>Add Category</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='tabler-x' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-6'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
          <CustomTextField
            label='Category Name'
            fullWidth
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder='e.g., Rent, Salaries, Equipment'
          />
          
          <CustomTextField
            label='Description'
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder='Optional description'
          />

          <CustomTextField
            select
            label='Type'
            fullWidth
            required
            value={formData.categoryType}
            onChange={e => setFormData({ ...formData, categoryType: e.target.value as 'INCOME' | 'EXPENSE', parentId: '' })}
          >
            <MenuItem value='INCOME'>Income</MenuItem>
            <MenuItem value='EXPENSE'>Expense</MenuItem>
          </CustomTextField>

          <CustomTextField
            select
            label='Parent Category'
            fullWidth
            value={formData.parentId}
            onChange={e => setFormData({ ...formData, parentId: e.target.value })}
            helperText='Optional: Create a subcategory'
          >
            <MenuItem value=''>None (Top Level)</MenuItem>
            {availableParents.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </CustomTextField>

          <CustomTextField
            select
            label='Color'
            fullWidth
            value={formData.color}
            onChange={e => setFormData({ ...formData, color: e.target.value })}
          >
            {commonColors.map(color => (
              <MenuItem key={color.value} value={color.value}>
                <div className='flex items-center gap-2'>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      backgroundColor: color.value
                    }}
                  />
                  {color.label}
                </div>
              </MenuItem>
            ))}
          </CustomTextField>

          <CustomTextField
            select
            label='Icon'
            fullWidth
            value={formData.icon}
            onChange={e => setFormData({ ...formData, icon: e.target.value })}
          >
            {commonIcons.map(icon => (
              <MenuItem key={icon} value={icon}>
                <div className='flex items-center gap-2'>
                  <i className={icon} />
                  {icon.replace('tabler-', '')}
                </div>
              </MenuItem>
            ))}
          </CustomTextField>

          <div className='flex gap-4'>
            <Button fullWidth variant='contained' type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create Category'}
            </Button>
            <Button fullWidth variant='tonal' color='error' type='reset' onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddCategoryDrawer
