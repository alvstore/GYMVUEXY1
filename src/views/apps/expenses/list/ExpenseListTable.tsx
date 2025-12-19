'use client'

import { useState, useMemo } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { rankItem } from '@tanstack/match-sorter-utils'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { ThemeColor } from '@core/types'
import type { Expense, ExpenseStatus } from '@/types/apps/expenseTypes'
import { mockExpenses } from '@/types/apps/expenseTypes'
import OptionMenu from '@core/components/option-menu'
import tableStyles from '@core/styles/table.module.css'

const statusObj: { [key in ExpenseStatus]: ThemeColor } = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<Expense>()

const ExpenseListTable = ({ expenseData }: { expenseData?: Expense[] }) => {
  const [data] = useState(expenseData || mockExpenses)

  const columns = useMemo<ColumnDef<Expense, any>[]>(
    () => [
      columnHelper.accessor('date', {
        header: 'Date',
        cell: ({ row }) => <Typography variant='body2'>{new Date(row.original.date).toLocaleDateString()}</Typography>
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: ({ row }) => <Chip label={row.original.category} size='small' color='primary' variant='tonal' />
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>{row.original.description}</Typography>
            <Typography variant='body2' className='text-textSecondary'>{row.original.branchName}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: ({ row }) => <Typography className='font-medium'>${row.original.amount.toLocaleString()}</Typography>
      }),
      columnHelper.accessor('submittedBy', {
        header: 'Submitted By',
        cell: ({ row }) => <Typography variant='body2'>{row.original.submittedBy}</Typography>
      }),
      columnHelper.accessor('approvedBy', {
        header: 'Approved By',
        cell: ({ row }) => (
          <Typography variant='body2' className='text-textSecondary'>
            {row.original.approvedBy || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => <Chip label={row.original.status} variant='tonal' color={statusObj[row.original.status]} size='small' />
      }),
      columnHelper.accessor('id', {
        header: 'Action',
        cell: () => (
          <OptionMenu
            iconClassName='text-textSecondary'
            options={[
              { text: 'View Receipt', icon: 'tabler-eye' },
              { text: 'Edit', icon: 'tabler-edit' },
              { text: 'Approve', icon: 'tabler-check', menuItemProps: { className: 'text-success' } },
              { divider: true },
              { text: 'Reject', icon: 'tabler-x', menuItemProps: { className: 'text-error' } }
            ]}
          />
        ),
        enableSorting: false
      })
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: { fuzzy: fuzzyFilter }
  })

  return (
    <Card>
      <CardHeader
        title='Expense Management'
        action={
          <Button variant='contained' startIcon={<i className='tabler-plus' />}>
            Add Expense
          </Button>
        }
      />
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default ExpenseListTable
