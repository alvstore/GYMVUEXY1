'use client'

import { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useSession } from 'next-auth/react'

interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: string
  items: any[]
}

interface MemberBillingHistoryProps {
  invoices?: Invoice[]
}

const MemberBillingHistory = ({ invoices: initialInvoices }: MemberBillingHistoryProps) => {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices || [])

  const columns: GridColDef[] = [
    {
      field: 'invoiceNumber',
      headerName: 'Invoice #',
      width: 150
    },
    {
      field: 'issueDate',
      headerName: 'Issue Date',
      width: 130,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: 130,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'totalAmount',
      headerName: 'Total',
      width: 120,
      renderCell: (params) => `$${Number(params.value).toFixed(2)}`
    },
    {
      field: 'paidAmount',
      headerName: 'Paid',
      width: 120,
      renderCell: (params) => `$${Number(params.value).toFixed(2)}`
    },
    {
      field: 'balanceAmount',
      headerName: 'Balance',
      width: 120,
      renderCell: (params) => `$${Number(params.value).toFixed(2)}`
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size='small'
          color={params.value === 'PAID' ? 'success' : params.value === 'PENDING' ? 'warning' : 'default'}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <div className='flex gap-2'>
          <Button variant='outlined' size='small'>
            View
          </Button>
          {params.row.balanceAmount > 0 && (
            <Button variant='contained' size='small' color='primary'>
              Pay
            </Button>
          )}
        </div>
      )
    }
  ]

  // Calculate totals
  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0)
  const totalBalance = invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0)

  return (
    <Card>
      <CardHeader 
        title='Billing History'
        subheader={`Viewing ${invoices.length} invoices`}
      />
      
      <CardContent>
        <Box className='mb-6 grid grid-cols-3 gap-4'>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='caption' color='textSecondary'>Total Billed</Typography>
              <Typography variant='h6'>${totalAmount.toFixed(2)}</Typography>
            </CardContent>
          </Card>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='caption' color='textSecondary'>Total Paid</Typography>
              <Typography variant='h6' color='success.main'>${totalPaid.toFixed(2)}</Typography>
            </CardContent>
          </Card>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='caption' color='textSecondary'>Outstanding Balance</Typography>
              <Typography variant='h6' color='error.main'>${totalBalance.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Box>

        <DataGrid
          rows={invoices}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } }
          }}
          disableRowSelectionOnClick
          className='min-h-[400px]'
        />
      </CardContent>
    </Card>
  )
}

export default MemberBillingHistory
