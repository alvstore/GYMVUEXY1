'use client'

import { useState, useMemo } from 'react'
import ClassScheduleDrawer from './ClassScheduleDrawer'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import TablePagination from '@mui/material/TablePagination'
import { rankItem } from '@tanstack/match-sorter-utils'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { ThemeColor } from '@core/types'
import type { GymClass, ClassStatus } from '@/types/apps/classTypes'
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'
import tableStyles from '@core/styles/table.module.css'

const statusObj: { [key in ClassStatus]: ThemeColor } = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<GymClass>()

const ClassListTable = ({ classData, onRefresh }: { classData?: GymClass[], onRefresh?: () => void }) => {
  const [data] = useState(classData || [])
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false)

  const handleClassScheduled = () => {
    setScheduleDrawerOpen(false)
    onRefresh?.()
  }

  const columns = useMemo<ColumnDef<GymClass, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Class Name',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>{row.original.name}</Typography>
            <Typography variant='body2' className='text-textSecondary'>{row.original.type}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('trainerName', {
        header: 'Trainer',
        cell: ({ row }) => <Typography>{row.original.trainerName}</Typography>
      }),
      columnHelper.accessor('schedule', {
        header: 'Schedule',
        cell: ({ row }) => (
          <Typography variant='body2'>{new Date(row.original.schedule).toLocaleString()}</Typography>
        )
      }),
      columnHelper.accessor('capacity', {
        header: 'Capacity',
        cell: ({ row }) => {
          const percentage = (row.original.enrolled / row.original.capacity) * 100
          return (
            <div>
              <div className='flex items-center gap-2 mbe-1'>
                <LinearProgress
                  variant='determinate'
                  value={percentage}
                  className='is-20'
                  color={percentage >= 100 ? 'error' : percentage > 75 ? 'warning' : 'success'}
                />
                <Typography variant='body2'>
                  {row.original.enrolled}/{row.original.capacity}
                </Typography>
              </div>
              {row.original.waitlist > 0 && (
                <Typography variant='caption' className='text-textSecondary'>
                  Waitlist: {row.original.waitlist}
                </Typography>
              )}
            </div>
          )
        }
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
              { text: 'View Attendees', icon: 'tabler-users' },
              { text: 'Mark Attendance', icon: 'tabler-check' },
              { text: 'Edit', icon: 'tabler-edit' },
              { divider: true },
              { text: 'Cancel Class', icon: 'tabler-x', menuItemProps: { className: 'text-error' } }
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
        title='Classes Schedule'
        action={
          <Button 
            variant='contained' 
            startIcon={<i className='tabler-plus' />}
            onClick={() => setScheduleDrawerOpen(true)}
          >
            Schedule Class
          </Button>
        }
      />
      <ClassScheduleDrawer 
        open={scheduleDrawerOpen} 
        handleClose={() => setScheduleDrawerOpen(false)}
        onClassScheduled={handleClassScheduled}
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
        component={() => <TablePaginationComponent table={table as any} />}
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => table.setPageIndex(page)}
      />
    </Card>
  )
}

export default ClassListTable
