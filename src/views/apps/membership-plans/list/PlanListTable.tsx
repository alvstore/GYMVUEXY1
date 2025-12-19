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
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { ThemeColor } from '@core/types'
import type { MembershipPlan, PlanStatus } from '@/types/apps/membershipPlanTypes'
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'
import tableStyles from '@core/styles/table.module.css'

const planStatusObj: { [key in PlanStatus]: ThemeColor } = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  ARCHIVED: 'error'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<MembershipPlan>()

const PlanListTable = ({ planData }: { planData?: MembershipPlan[] }) => {
  const [data] = useState(planData || [])

  const columns = useMemo<ColumnDef<MembershipPlan, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Plan Name',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium' color='text.primary'>
              {row.original.name}
            </Typography>
            <Typography variant='body2' className='text-textSecondary'>
              {row.original.description || 'No description'}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('durationType', {
        header: 'Duration',
        cell: ({ row }) => (
          <Typography>
            {row.original.duration} {row.original.durationType}
          </Typography>
        )
      }),
      columnHelper.accessor('price', {
        header: 'Price',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>₹{row.original.price.toLocaleString()}</Typography>
            {row.original.setupFee > 0 && (
              <Typography variant='caption' className='text-textSecondary'>
                Setup: ₹{row.original.setupFee}
              </Typography>
            )}
          </div>
        )
      }),
      columnHelper.accessor('activeSubscriptions', {
        header: 'Active Subscriptions',
        cell: ({ row }) => <Chip label={row.original.activeSubscriptions} color='primary' size='small' />
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip label={row.original.status} variant='tonal' color={planStatusObj[row.original.status]} size='small' />
        )
      }),
      columnHelper.accessor('id', {
        header: 'Action',
        cell: () => (
          <OptionMenu
            iconClassName='text-textSecondary'
            options={[
              { text: 'Edit', icon: 'tabler-edit' },
              { text: 'View Subscribers', icon: 'tabler-users' },
              { divider: true },
              { text: 'Archive', icon: 'tabler-archive', menuItemProps: { className: 'text-error' } }
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
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: { fuzzy: fuzzyFilter }
  })

  return (
    <Card>
      <CardHeader
        title='Membership Plans'
        action={
          <Button variant='contained' startIcon={<i className='tabler-plus' />}>
            Add Plan
          </Button>
        }
      />
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    <div
                      className={classnames({ 'cursor-pointer': header.column.getCanSort() })}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </th>
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

export default PlanListTable
