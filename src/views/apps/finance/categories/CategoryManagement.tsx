'use client'

import { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import OptionMenu from '@core/components/option-menu'
import AddCategoryDrawer from './AddCategoryDrawer'
import EditCategoryDrawer from './EditCategoryDrawer'
import { toast } from 'react-toastify'
import type { ThemeColor } from '@core/types'

type Category = {
  id: string
  name: string
  description: string | null
  categoryType: 'INCOME' | 'EXPENSE'
  parentId: string | null
  color: string | null
  icon: string | null
  isActive: boolean
  parent?: { name: string } | null
  children?: any[]
  _count: {
    expenses: number
  }
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/finance/categories?includeInactive=true')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setCategories(data as Category[])
    } catch (error) {
      toast.error('Failed to load categories')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (selectedTab === 'ALL') {
      setFilteredCategories(categories)
    } else {
      setFilteredCategories(categories.filter(cat => cat.categoryType === selectedTab))
    }
  }, [categories, selectedTab])

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setEditDrawerOpen(true)
  }

  const handleArchive = async (categoryId: string) => {
    if (!confirm('Are you sure you want to archive this category?')) return

    try {
      const response = await fetch(`/api/finance/categories/${categoryId}/archive`, {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to archive')
      }
      toast.success('Category archived successfully')
      loadCategories()
    } catch (error: any) {
      toast.error(error.message || 'Failed to archive category')
    }
  }

  const handleRestore = async (categoryId: string) => {
    if (!confirm('Are you sure you want to restore this category?')) return

    try {
      const response = await fetch(`/api/finance/categories/${categoryId}/restore`, {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to restore')
      }
      toast.success('Category restored successfully')
      loadCategories()
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore category')
    }
  }

  const getCategoryColor = (type: 'INCOME' | 'EXPENSE'): ThemeColor => {
    return type === 'INCOME' ? 'success' : 'error'
  }

  const parentCategories = filteredCategories.filter(cat => !cat.parentId)

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title='Finance Categories'
              action={
                <Button
                  variant='contained'
                  startIcon={<i className='tabler-plus' />}
                  onClick={() => setAddDrawerOpen(true)}
                >
                  Add Category
                </Button>
              }
            />
            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => setSelectedTab(newValue)}
              aria-label='category type tabs'
              sx={{ borderBottom: 1, borderColor: 'divider', px: 6 }}
            >
              <Tab label='All Categories' value='ALL' />
              <Tab label='Income' value='INCOME' />
              <Tab label='Expense' value='EXPENSE' />
            </Tabs>
            <div className='overflow-x-auto'>
              {loading ? (
                <div className='p-6 text-center'>
                  <Typography>Loading categories...</Typography>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className='p-6 text-center'>
                  <Typography color='textSecondary'>No categories found. Create your first category.</Typography>
                </div>
              ) : (
                <div className='p-6'>
                  {parentCategories.map(parent => (
                    <div key={parent.id} className='mb-6'>
                      <div className='flex items-center justify-between p-4 bg-actionHover rounded mb-2'>
                        <div className='flex items-center gap-4 flex-1'>
                          {parent.icon && <i className={parent.icon} style={{ fontSize: 24, color: parent.color || undefined }} />}
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <Typography variant='h6'>{parent.name}</Typography>
                              <Chip
                                label={parent.categoryType}
                                size='small'
                                color={getCategoryColor(parent.categoryType)}
                                variant='tonal'
                              />
                              {!parent.isActive && <Chip label='Archived' size='small' color='default' variant='outlined' />}
                            </div>
                            {parent.description && (
                              <Typography variant='body2' color='textSecondary'>
                                {parent.description}
                              </Typography>
                            )}
                          </div>
                          <div className='flex items-center gap-4'>
                            <Typography variant='body2' color='textSecondary'>
                              {parent._count.expenses} expense{parent._count.expenses !== 1 ? 's' : ''}
                            </Typography>
                            <OptionMenu
                              iconClassName='text-textSecondary'
                              options={[
                                { text: 'Edit', icon: 'tabler-edit', menuItemProps: { onClick: () => handleEdit(parent) } },
                                { divider: true },
                                {
                                  text: parent.isActive ? 'Archive' : 'Restore',
                                  icon: parent.isActive ? 'tabler-archive' : 'tabler-archive-off',
                                  menuItemProps: {
                                    onClick: () => parent.isActive ? handleArchive(parent.id) : handleRestore(parent.id),
                                    className: parent.isActive ? 'text-error' : 'text-success'
                                  }
                                }
                              ]}
                            />
                          </div>
                        </div>
                      </div>
                      {parent.children && parent.children.length > 0 && (
                        <div className='ml-12'>
                          {parent.children.map(child => (
                            <div key={child.id} className='flex items-center justify-between p-3 border-l-2 border-divider mb-1'>
                              <div className='flex items-center gap-3 flex-1'>
                                {child.icon && <i className={child.icon} style={{ fontSize: 20, color: child.color || undefined }} />}
                                <div className='flex-1'>
                                  <div className='flex items-center gap-2'>
                                    <Typography variant='body1'>{child.name}</Typography>
                                    {!child.isActive && <Chip label='Archived' size='small' color='default' variant='outlined' />}
                                  </div>
                                  {child.description && (
                                    <Typography variant='body2' color='textSecondary'>
                                      {child.description}
                                    </Typography>
                                  )}
                                </div>
                                <div className='flex items-center gap-4'>
                                  <Typography variant='body2' color='textSecondary'>
                                    {child._count.expenses} expense{child._count.expenses !== 1 ? 's' : ''}
                                  </Typography>
                                  <OptionMenu
                                    iconClassName='text-textSecondary'
                                    options={[
                                      { text: 'Edit', icon: 'tabler-edit', menuItemProps: { onClick: () => handleEdit(child) } },
                                      { divider: true },
                                      {
                                        text: child.isActive ? 'Archive' : 'Restore',
                                        icon: child.isActive ? 'tabler-archive' : 'tabler-archive-off',
                                        menuItemProps: {
                                          onClick: () => child.isActive ? handleArchive(child.id) : handleRestore(child.id),
                                          className: child.isActive ? 'text-error' : 'text-success'
                                        }
                                      }
                                    ]}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Grid>
      </Grid>

      <AddCategoryDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={() => {
          setAddDrawerOpen(false)
          loadCategories()
        }}
        categories={categories}
      />

      {selectedCategory && (
        <EditCategoryDrawer
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false)
            setSelectedCategory(null)
          }}
          onSuccess={() => {
            setEditDrawerOpen(false)
            setSelectedCategory(null)
            loadCategories()
          }}
          category={selectedCategory}
          categories={categories}
        />
      )}
    </>
  )
}

export default CategoryManagement
