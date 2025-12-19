'use client'

import { useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams
} from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import AddStaffDrawer from './AddStaffDrawer'
import { createStaff } from '@/app/actions/people/staff'

interface StaffMember {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  role: string
  department?: string
  salary?: number
  status: string
  branch?: { id: string; name: string }
}

const StaffListTable = ({ staffData }: { staffData?: StaffMember[] }) => {
  const [addStaffOpen, setAddStaffOpen] = useState(false)

  const handleCreateStaff = async (data: any) => {
    try {
      await createStaff(data)
      toast.success('Staff member created successfully!')
      setAddStaffOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create staff member')
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Employee',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <div className='flex items-center gap-3'>
          <Avatar>{params.row.firstName[0]}{params.row.lastName[0]}</Avatar>
          <div>
            <Typography variant='body2' className='font-medium'>
              {params.row.firstName} {params.row.lastName}
            </Typography>
            <Typography variant='caption' color='textSecondary'>
              {params.row.employeeId}
            </Typography>
          </div>
        </div>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.row.role} size='small' variant='tonal' color='primary' />
      ),
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.row.status}
          size='small'
          variant='tonal'
          color={params.row.status === 'ACTIVE' ? 'success' : 'error'}
        />
      ),
    },
  ]

  return (
    <>
      <Card>
        <CardHeader
          title='Staff Directory'
          action={
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setAddStaffOpen(true)}
            >
              Add Staff
            </Button>
          }
        />
        <DataGrid
          rows={staffData || []}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          className='min-h-[400px]'
        />
      </Card>

      <AddStaffDrawer
        open={addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        onSubmit={handleCreateStaff}
      />
    </>
  )
}

export default StaffListTable
