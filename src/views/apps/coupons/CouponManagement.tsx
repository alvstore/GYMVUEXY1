'use client'

import { useState } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import AddCouponDrawer from './AddCouponDrawer'
import { createCoupon } from '@/app/actions/memberships/coupons'

const CouponManagement = ({ coupons }: { coupons: any[] }) => {
  const [showCreate, setShowCreate] = useState(false)

  const handleCreateCoupon = async (data: any) => {
    try {
      await createCoupon(data)
      toast.success('Coupon created successfully!')
      setShowCreate(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create coupon')
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Code',
      width: 150,
      renderCell: (params) => (
        <Chip label={params.value} size='small' variant='outlined' />
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'discountType',
      headerName: 'Type',
      width: 150,
    },
    {
      field: 'discountValue',
      headerName: 'Value',
      width: 100,
      renderCell: (params) => {
        const type = params.row.discountType
        if (type === 'PERCENTAGE') return `${params.value}%`
        if (type === 'FLAT_AMOUNT') return `$${params.value}`
        if (type === 'FREE_MONTHS') return `${params.value} months`
        return params.value
      },
    },
    {
      field: 'validFrom',
      headerName: 'Valid From',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'validUntil',
      headerName: 'Valid Until',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'currentUsageCount',
      headerName: 'Used',
      width: 80,
      renderCell: (params) => (
        <Typography variant='caption'>
          {params.value} / {params.row.maxUsageCount || '∞'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size='small'
          color={params.value === 'ACTIVE' ? 'success' : 'default'}
          variant='tonal'
        />
      ),
    },
  ]

  return (
    <>
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Coupon Management'
            action={
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={() => setShowCreate(true)}
              >
                Create Coupon
              </Button>
            }
          />
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <DataGrid
            rows={coupons || []}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            className='min-h-[400px]'
          />
        </Card>
      </Grid>

      {(!coupons || coupons.length === 0) && !showCreate && (
        <Grid item xs={12}>
          <Card>
            <CardContent className='text-center py-12'>
              <i className='tabler-discount text-6xl text-textDisabled mb-4' />
              <Typography variant='h6' color='textSecondary'>
                No coupons created yet
              </Typography>
              <Typography variant='body2' color='textSecondary' className='mb-4'>
                Create promotional coupons to boost sales
              </Typography>
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={() => setShowCreate(true)}
              >
                Create First Coupon
              </Button>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>

    <AddCouponDrawer
      open={showCreate}
      onClose={() => setShowCreate(false)}
      onSubmit={handleCreateCoupon}
    />
    </>
  )
}

export default CouponManagement
