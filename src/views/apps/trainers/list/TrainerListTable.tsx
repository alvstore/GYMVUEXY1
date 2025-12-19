'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { ThemeColor } from '@core/types'
import type { Trainer, TrainerStatus } from '@/types/apps/trainerTypes'
import type { Locale } from '@configs/i18n'
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'
import tableStyles from '@core/styles/table.module.css'

type TrainerWithAction = Trainer & { action?: string }
type TrainerStatusColor = { [key in TrainerStatus]: ThemeColor }

const trainerStatusObj: TrainerStatusColor = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  ON_LEAVE: 'warning'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<TrainerWithAction>()

const TrainerListTable = ({ trainerData }: { trainerData?: Trainer[] }) => {
  const [data, setData] = useState(trainerData || [])
  const [globalFilter, setGlobalFilter] = useState('')
  const { lang: locale } = useParams()

  const columns = useMemo<ColumnDef<TrainerWithAction, any>[]>(
    () => [
      columnHelper.accessor('firstName', {
        header: 'Trainer',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {row.original.avatar ? (
              <CustomAvatar src={row.original.avatar} size={34} />
            ) : (
              <CustomAvatar skin='light' size={34}>
                {getInitials(`${row.original.firstName} ${row.original.lastName}`)}
              </CustomAvatar>
            )}
            <div className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.firstName} {row.original.lastName}
              </Typography>
              <Typography variant='body2' className='text-textSecondary'>
                {row.original.employeeId}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('specializations', {
        header: 'Specializations',
        cell: ({ row }) => (
          <div className='flex gap-1 flex-wrap'>
            {row.original.specializations.slice(0, 2).map((spec, idx) => (
              <Chip key={idx} label={spec} size='small' variant='tonal' color='primary' />
            ))}
            {row.original.specializations.length > 2 && (
              <Chip label={`+${row.original.specializations.length - 2}`} size='small' />
            )}
          </div>
        )
      }),
      columnHelper.accessor('assignedClients', {
        header: 'Utilization',
        cell: ({ row }) => {
          const utilization = (row.original.assignedClients / row.original.maxCapacity) * 100
          return (
            <div className='flex items-center gap-2'>
              <LinearProgress
                variant='determinate'
                value={utilization}
                className='is-20'
                color={utilization > 80 ? 'error' : utilization > 50 ? 'warning' : 'success'}
              />
              <Typography variant='body2'>
                {row.original.assignedClients}/{row.original.maxCapacity}
              </Typography>
            </div>
          )
        }
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip label={row.original.status} variant='tonal' color={trainerStatusObj[row.original.status]} size='small' />
        )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <OptionMenu
            iconClassName='text-textSecondary'
            options={[
              { text: 'View Details', icon: 'tabler-eye' },
              { text: 'Edit', icon: 'tabler-edit' },
              { text: 'Assign Clients', icon: 'tabler-users' },
              { divider: true },
              { text: 'Mark Leave', icon: 'tabler-calendar-off', menuItemProps: { className: 'text-warning' } }
            ]}
          />
        ),
        enableSorting: false
      })
    ],
    [locale]
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Card>
      <CardHeader
        title='Trainers List'
        action={
          <div className='flex gap-4'>
            <CustomTextField
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(String(e.target.value))}
              placeholder='Search Trainers'
            />
            <Button variant='contained' startIcon={<i className='tabler-plus' />}>
              Add Trainer
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
                    {header.isPlaceholder ? null : (
                      <div
                        className={classnames({
                          'flex items-center': header.column.getIsSorted(),
                          'cursor-pointer select-none': header.column.getCanSort()
                        })}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <i className='tabler-chevron-up text-xl' />,
                          desc: <i className='tabler-chevron-down text-xl' />
                        }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                      </div>
                    )}
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

export default TrainerListTable
