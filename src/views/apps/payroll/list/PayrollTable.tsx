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
import type { PayrollRecord, PayrollStatus } from '@/types/apps/payrollTypes'
import { mockPayroll } from '@/types/apps/payrollTypes'
import OptionMenu from '@core/components/option-menu'
import tableStyles from '@core/styles/table.module.css'

const statusObj: { [key in PayrollStatus]: ThemeColor } = {
  PENDING: 'secondary',
  PROCESSING: 'warning',
  PAID: 'success',
  FAILED: 'error'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<PayrollRecord>()

const PayrollTable = ({ payrollData }: { payrollData?: PayrollRecord[] }) => {
  const [data] = useState(payrollData || mockPayroll)

  const columns = useMemo<ColumnDef<PayrollRecord, any>[]>(
    () => [
      columnHelper.accessor('employeeName', {
        header: 'Employee',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>{row.original.employeeName}</Typography>
            <Typography variant='body2' className='text-textSecondary'>
              {row.original.employeeId} • {row.original.role}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('month', {
        header: 'Period',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {row.original.month} {row.original.year}
          </Typography>
        )
      }),
      columnHelper.accessor('baseSalary', {
        header: 'Base Salary',
        cell: ({ row }) => <Typography>${row.original.baseSalary.toLocaleString()}</Typography>
      }),
      columnHelper.accessor('bonus', {
        header: 'Bonus',
        cell: ({ row }) => (
          <Typography className='text-success'>
            +${row.original.bonus.toLocaleString()}
          </Typography>
        )
      }),
      columnHelper.accessor('deductions', {
        header: 'Deductions',
        cell: ({ row }) => (
          <Typography className='text-error'>
            -${row.original.deductions.toLocaleString()}
          </Typography>
        )
      }),
      columnHelper.accessor('netSalary', {
        header: 'Net Salary',
        cell: ({ row }) => (
          <Typography className='font-bold'>
            ${row.original.netSalary.toLocaleString()}
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
              { text: 'View Payslip', icon: 'tabler-file-invoice' },
              { text: 'Download PDF', icon: 'tabler-download' },
              { text: 'Process Payment', icon: 'tabler-credit-card' }
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
        title='Payroll Management'
        action={
          <Button variant='contained' startIcon={<i className='tabler-calculator' />}>
            Process Payroll
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

export default PayrollTable
