'use client'

import { useState, useMemo } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import { rankItem } from '@tanstack/match-sorter-utils'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { ThemeColor } from '@core/types'
import type { InventoryItem, StockStatus } from '@/types/apps/inventoryTypes'
import { mockInventory } from '@/types/apps/inventoryTypes'
import OptionMenu from '@core/components/option-menu'
import tableStyles from '@core/styles/table.module.css'

const statusObj: { [key in StockStatus]: ThemeColor } = {
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'error'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<InventoryItem>()

const InventoryTable = ({ inventoryData }: { inventoryData?: InventoryItem[] }) => {
  const [data] = useState(inventoryData || mockInventory)

  const columns = useMemo<ColumnDef<InventoryItem, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Product',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>{row.original.name}</Typography>
            <Typography variant='body2' className='text-textSecondary'>
              SKU: {row.original.sku}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: ({ row }) => <Chip label={row.original.category} size='small' color='primary' variant='tonal' />
      }),
      columnHelper.accessor('currentStock', {
        header: 'Stock Level',
        cell: ({ row }) => {
          const percentage = (row.original.currentStock / row.original.maxStock) * 100
          return (
            <div>
              <div className='flex items-center gap-2 mbe-1'>
                <LinearProgress
                  variant='determinate'
                  value={percentage}
                  className='is-20'
                  color={percentage === 0 ? 'error' : percentage < 30 ? 'warning' : 'success'}
                />
                <Typography variant='body2'>
                  {row.original.currentStock}/{row.original.maxStock}
                </Typography>
              </div>
            </div>
          )
        }
      }),
      columnHelper.accessor('supplier', {
        header: 'Supplier',
        cell: ({ row }) => <Typography variant='body2'>{row.original.supplier}</Typography>
      }),
      columnHelper.accessor('lastRestocked', {
        header: 'Last Restocked',
        cell: ({ row }) =>
          row.original.lastRestocked ? (
            <Typography variant='body2'>{new Date(row.original.lastRestocked).toLocaleDateString()}</Typography>
          ) : (
            <Typography className='text-textSecondary'>-</Typography>
          )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip label={row.original.status.replace('_', ' ')} variant='tonal' color={statusObj[row.original.status]} size='small' />
        )
      }),
      columnHelper.accessor('id', {
        header: 'Action',
        cell: () => (
          <OptionMenu
            iconClassName='text-textSecondary'
            options={[
              { text: 'Restock', icon: 'tabler-package' },
              { text: 'Adjust Stock', icon: 'tabler-edit' },
              { text: 'View History', icon: 'tabler-history' },
              { divider: true },
              { text: 'Delete', icon: 'tabler-trash', menuItemProps: { className: 'text-error' } }
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
        title='Inventory Management'
        action={
          <div className='flex gap-2'>
            <Button variant='outlined' startIcon={<i className='tabler-file-export' />}>
              Export
            </Button>
            <Button variant='contained' startIcon={<i className='tabler-plus' />}>
              Add Item
            </Button>
          </div>
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

export default InventoryTable
