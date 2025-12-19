'use client'

import { useState, useEffect } from 'react'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'

type Category = {
  id: string
  name: string
  description: string | null
  categoryType: 'INCOME' | 'EXPENSE'
  parentId: string | null
  color: string | null
  icon: string | null
  isActive: boolean
}

type EditCategoryDrawerProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  category: Category
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

const EditCategoryDrawer = ({ open, onClose, onSuccess, category, categories }: EditCategoryDrawerProps) => {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description || '',
    parentId: category.parentId || '',
    color: category.color || '#7367F0',
    icon: category.icon || 'tabler-cash',
    isActive: category.isActive
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || '',
      color: category.color || '#7367F0',
      icon: category.icon || 'tabler-cash',
      isActive: category.isActive
    })
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/finance/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          parentId: formData.parentId || undefined,
          color: formData.color,
          icon: formData.icon,
          isActive: formData.isActive
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update category')
      }
      
      toast.success('Category updated successfully')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update category')
    } finally {
      setLoading(false)
    }
  }

  const availableParents = categories.filter(
    cat =>
      cat.categoryType === category.categoryType &&
      !cat.parentId &&
      cat.id !== category.id &&
      cat.id !== formData.parentId
  )

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
        <Typography variant='h5'>Edit Category</Typography>
        <IconButton size='small' onClick={onClose}>
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
          />
          
          <CustomTextField
            label='Description'
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />

          <CustomTextField
            select
            label='Parent Category'
            fullWidth
            value={formData.parentId}
            onChange={e => setFormData({ ...formData, parentId: e.target.value })}
            helperText='Optional: Make this a subcategory'
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

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              />
            }
            label='Active'
          />

          <div className='flex gap-4'>
            <Button fullWidth variant='contained' type='submit' disabled={loading}>
              {loading ? 'Updating...' : 'Update Category'}
            </Button>
            <Button fullWidth variant='tonal' color='secondary' onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default EditCategoryDrawer
