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
import type { AuditLog, AuditAction } from '@/types/apps/auditTypes'
import { mockAuditLogs } from '@/types/apps/auditTypes'
import tableStyles from '@core/styles/table.module.css'

const actionColors: { [key in AuditAction]: ThemeColor } = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  LOGIN: 'primary',
  LOGOUT: 'secondary',
  VIEW: 'warning'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<AuditLog>()

const AuditLogTable = ({ auditData }: { auditData?: AuditLog[] }) => {
  const [data] = useState(auditData || mockAuditLogs)

  const columns = useMemo<ColumnDef<AuditLog, any>[]>(
    () => [
      columnHelper.accessor('timestamp', {
        header: 'Timestamp',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {new Date(row.original.timestamp).toLocaleString()}
          </Typography>
        )
      }),
      columnHelper.accessor('userName', {
        header: 'User',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>{row.original.userName}</Typography>
            <Typography variant='body2' className='text-textSecondary'>{row.original.userEmail}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => <Chip label={row.original.action} size='small' color={actionColors[row.original.action]} variant='tonal' />
      }),
      columnHelper.accessor('entity', {
        header: 'Entity',
        cell: ({ row }) => (
          <div>
            <Chip label={row.original.entity} size='small' color='primary' />
            <Typography variant='caption' className='text-textSecondary mls-2'>
              {row.original.entityId}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: ({ row }) => <Typography variant='body2'>{row.original.description}</Typography>
      }),
      columnHelper.accessor('ipAddress', {
        header: 'IP Address',
        cell: ({ row }) => <Typography variant='body2' className='font-mono'>{row.original.ipAddress}</Typography>
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
        title='Audit Logs'
        action={
          <Button variant='outlined' startIcon={<i className='tabler-file-export' />}>
            Export Logs
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

export default AuditLogTable
