'use client'

import { useState, useMemo } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { ThemeColor } from '@core/types'
import type { Branch, BranchStatus } from '@/types/apps/branchTypes'
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import tableStyles from '@core/styles/table.module.css'

const statusObj: { [key in BranchStatus]: ThemeColor } = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  MAINTENANCE: 'warning'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<Branch>()

const BranchListTable = ({ branchData }: { branchData?: Branch[] }) => {
  const [data] = useState(branchData || [])

  const columns = useMemo<ColumnDef<Branch, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Branch',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>{row.original.name}</Typography>
            <Typography variant='body2' className='text-textSecondary'>
              {row.original.code}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('city', {
        header: 'Location',
        cell: ({ row }) => (
          <div>
            <Typography>{row.original.city || 'N/A'}</Typography>
            <Typography variant='body2' className='text-textSecondary'>
              {row.original.state || ''}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('phone', {
        header: 'Contact',
        cell: ({ row }) => (
          <div>
            <Typography>{row.original.phone || 'N/A'}</Typography>
            <Typography variant='body2' className='text-textSecondary'>
              {row.original.email || ''}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={row.original.isActive ? 'Active' : 'Inactive'}
            variant='tonal'
            color={row.original.isActive ? 'success' : 'secondary'}
            size='small'
          />
        )
      }),
      columnHelper.accessor('id', {
        header: 'Action',
        cell: () => (
          <OptionMenu
            iconClassName='text-textSecondary'
            options={[
              { text: 'View Details', icon: 'tabler-eye' },
              { text: 'Edit', icon: 'tabler-edit' },
              { text: 'View Stats', icon: 'tabler-chart-bar' },
              { divider: true },
              { text: 'Settings', icon: 'tabler-settings' }
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
        title='Branch Management'
        action={
          <Button variant='contained' startIcon={<i className='tabler-plus' />}>
            Add Branch
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
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
    </Card>
  )
}

export default BranchListTable
