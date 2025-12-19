'use client'

import { useState, useEffect, useMemo } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { AttendanceRecord } from '@/types/apps/attendanceTypes'
import { getAttendanceRecords } from '@/app/actions/attendance'
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<AttendanceRecord>()

const AttendanceTable = () => {
  const [data, setData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const records = await getAttendanceRecords()
        setData(records)
      } catch (error) {
        console.error('Failed to load attendance:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const columns = useMemo<ColumnDef<AttendanceRecord, any>[]>(
    () => [
      columnHelper.accessor('memberName', {
        header: 'Member',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            {row.original.memberAvatar ? (
              <CustomAvatar src={row.original.memberAvatar} size={34} />
            ) : (
              <CustomAvatar skin='light' size={34}>
                {getInitials(row.original.memberName)}
              </CustomAvatar>
            )}
            <div>
              <Typography className='font-medium'>{row.original.memberName}</Typography>
              <Typography variant='body2' className='text-textSecondary'>
                {row.original.memberId}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('branchName', {
        header: 'Branch',
        cell: ({ row }) => <Typography>{row.original.branchName}</Typography>
      }),
      columnHelper.accessor('checkInTime', {
        header: 'Check In',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {new Date(row.original.checkInTime).toLocaleTimeString()}
          </Typography>
        )
      }),
      columnHelper.accessor('checkOutTime', {
        header: 'Check Out',
        cell: ({ row }) =>
          row.original.checkOutTime ? (
            <Typography variant='body2'>
              {new Date(row.original.checkOutTime).toLocaleTimeString()}
            </Typography>
          ) : (
            <Chip label='Active' color='success' size='small' variant='tonal' />
          )
      }),
      columnHelper.accessor('duration', {
        header: 'Duration',
        cell: ({ row }) =>
          row.original.duration ? (
            <Typography>{row.original.duration} min</Typography>
          ) : (
            <Typography className='text-textSecondary'>-</Typography>
          )
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {new Date(row.original.date).toLocaleDateString()}
          </Typography>
        )
      }),
      columnHelper.accessor('id', {
        header: 'Action',
        cell: () => (
          <OptionMenu
            iconClassName='text-textSecondary'
            options={[
              { text: 'View Details', icon: 'tabler-eye' },
              { text: 'Manual Check Out', icon: 'tabler-logout' }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Card>
      <CardHeader
        title='Attendance Log'
        action={
          <div className='flex gap-2'>
            <Button variant='outlined' startIcon={<i className='tabler-calendar' />}>
              View Calendar
            </Button>
            <Button variant='outlined' startIcon={<i className='tabler-download' />}>
              Export
            </Button>
          </div>
        }
      />
      {data.length === 0 ? (
        <Box textAlign="center" py={8} px={4}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No Attendance Records
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Members will appear here once they check in to the gym.
          </Typography>
        </Box>
      ) : (
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default AttendanceTable
