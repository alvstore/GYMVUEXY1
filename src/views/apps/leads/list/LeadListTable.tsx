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
import type { Lead, LeadStatus, LeadSource } from '@/types/apps/leadTypes'
import { mockLeads } from '@/types/apps/leadTypes'
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import tableStyles from '@core/styles/table.module.css'

const statusObj: { [key in LeadStatus]: ThemeColor } = {
  NEW: 'info',
  CONTACTED: 'primary',
  DEMO_SCHEDULED: 'warning',
  NEGOTIATION: 'secondary',
  WON: 'success',
  LOST: 'error'
}

const sourceColors: { [key in LeadSource]: ThemeColor } = {
  WEBSITE: 'primary',
  WALK_IN: 'success',
  REFERRAL: 'warning',
  SOCIAL_MEDIA: 'info',
  ADVERTISEMENT: 'secondary',
  OTHER: 'error'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<Lead>()

const LeadListTable = ({ leadData }: { leadData?: Lead[] }) => {
  const [data] = useState(leadData || mockLeads)

  const columns = useMemo<ColumnDef<Lead, any>[]>(
    () => [
      columnHelper.accessor('firstName', {
        header: 'Lead',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>
              {row.original.firstName} {row.original.lastName}
            </Typography>
            <Typography variant='body2' className='text-textSecondary'>
              {row.original.email}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: ({ row }) => <Typography variant='body2'>{row.original.phone}</Typography>
      }),
      columnHelper.accessor('source', {
        header: 'Source',
        cell: ({ row }) => (
          <Chip
            label={row.original.source.replace('_', ' ')}
            color={sourceColors[row.original.source]}
            size='small'
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('assignedTo', {
        header: 'Assigned To',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            {row.original.assignedToAvatar ? (
              <CustomAvatar src={row.original.assignedToAvatar} size={28} />
            ) : (
              <CustomAvatar skin='light' size={28}>
                {getInitials(row.original.assignedTo)}
              </CustomAvatar>
            )}
            <Typography variant='body2'>{row.original.assignedTo}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('interestedIn', {
        header: 'Interested In',
        cell: ({ row }) => <Typography variant='body2'>{row.original.interestedIn}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={row.original.status.replace('_', ' ')}
            variant='tonal'
            color={statusObj[row.original.status]}
            size='small'
          />
        )
      }),
      columnHelper.accessor('followUpDate', {
        header: 'Follow Up',
        cell: ({ row }) =>
          row.original.followUpDate ? (
            <Typography variant='body2'>
              {new Date(row.original.followUpDate).toLocaleDateString()}
            </Typography>
          ) : (
            <Typography className='text-textSecondary'>-</Typography>
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
              { text: 'Convert to Member', icon: 'tabler-user-check', menuItemProps: { className: 'text-success' } },
              { divider: true },
              { text: 'Mark as Lost', icon: 'tabler-x', menuItemProps: { className: 'text-error' } }
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
        title='Leads Pipeline'
        action={
          <div className='flex gap-2'>
            <Button variant='outlined' startIcon={<i className='tabler-layout-kanban' />}>
              Kanban View
            </Button>
            <Button variant='contained' startIcon={<i className='tabler-plus' />}>
              Add Lead
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

export default LeadListTable
