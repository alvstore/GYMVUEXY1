'use client'

import { useState, useMemo } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TablePagination from '@mui/material/TablePagination'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { ThemeColor } from '@core/types'
import type { StaffMember, StaffStatus } from '@/types/apps/teamTypes'
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import tableStyles from '@core/styles/table.module.css'

const statusObj: { [key in StaffStatus]: ThemeColor } = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  ON_LEAVE: 'warning',
  TERMINATED: 'error'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<StaffMember>()

const TeamListTable = ({ staffData }: { staffData?: StaffMember[] }) => {
  const [data] = useState(staffData || [])

  const columns = useMemo<ColumnDef<StaffMember, any>[]>(
    () => [
      columnHelper.accessor('firstName', {
        header: 'Staff Member',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            {row.original.avatar ? (
              <CustomAvatar src={row.original.avatar} size={34} />
            ) : (
              <CustomAvatar skin='light' size={34}>
                {getInitials(`${row.original.firstName} ${row.original.lastName}`)}
              </CustomAvatar>
            )}
            <div>
              <Typography className='font-medium'>{row.original.firstName} {row.original.lastName}</Typography>
              <Typography variant='body2' className='text-textSecondary'>{row.original.employeeId}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: ({ row }) => <Chip label={row.original.role} size='small' color='primary' variant='tonal' />
      }),
      columnHelper.accessor('department', {
        header: 'Department',
        cell: ({ row }) => <Typography>{row.original.department || 'N/A'}</Typography>
      }),
      columnHelper.accessor('salary', {
        header: 'Salary',
        cell: ({ row }) => <Typography>₹{row.original.salary.toLocaleString()}</Typography>
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
              { text: 'View Details', icon: 'tabler-eye' },
              { text: 'Edit', icon: 'tabler-edit' },
              { text: 'Manage Shifts', icon: 'tabler-calendar' },
              { divider: true },
              { text: 'Mark Leave', icon: 'tabler-calendar-off', menuItemProps: { className: 'text-warning' } }
            ]}
          />
        )
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
        title='Team Members'
        action={
          <Button variant='contained' startIcon={<i className='tabler-plus' />}>
            Add Staff
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
      <TablePagination
        component={() => <TablePaginationComponent table={table} />}
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => table.setPageIndex(page)}
      />
    </Card>
  )
}

export default TeamListTable
