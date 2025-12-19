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
import type { DietPlan, DietPlanStatus } from '@/types/apps/dietPlanTypes'
import { mockDietPlans } from '@/types/apps/dietPlanTypes'
import OptionMenu from '@core/components/option-menu'
import tableStyles from '@core/styles/table.module.css'

const statusObj: { [key in DietPlanStatus]: ThemeColor } = {
  ACTIVE: 'success',
  DRAFT: 'warning',
  ARCHIVED: 'secondary'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<DietPlan>()

const DietPlanList = ({ dietPlanData }: { dietPlanData?: DietPlan[] }) => {
  const [data] = useState(dietPlanData || mockDietPlans)

  const columns = useMemo<ColumnDef<DietPlan, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Plan Name',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>{row.original.name}</Typography>
            <Typography variant='body2' className='text-textSecondary'>{row.original.description}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('goal', {
        header: 'Goal',
        cell: ({ row }) => <Chip label={row.original.goal.replace('_', ' ')} size='small' color='info' variant='tonal' />
      }),
      columnHelper.accessor('caloriesPerDay', {
        header: 'Daily Calories',
        cell: ({ row }) => <Typography>{row.original.caloriesPerDay} kcal</Typography>
      }),
      columnHelper.accessor('duration', {
        header: 'Duration',
        cell: ({ row }) => <Typography>{row.original.duration} days</Typography>
      }),
      columnHelper.accessor('createdBy', {
        header: 'Created By',
        cell: ({ row }) => <Typography variant='body2'>{row.original.createdBy}</Typography>
      }),
      columnHelper.accessor('assignedMembers', {
        header: 'Members',
        cell: ({ row }) => <Chip label={row.original.assignedMembers} color='primary' size='small' />
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
              { text: 'Assign to Member', icon: 'tabler-user-plus' },
              { divider: true },
              { text: 'Archive', icon: 'tabler-archive' }
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
        title='Diet Plans'
        action={
          <Button variant='contained' startIcon={<i className='tabler-plus' />}>
            Create Plan
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

export default DietPlanList
