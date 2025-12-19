'use client'

import { useState, useEffect, useMemo } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { rankItem } from '@tanstack/match-sorter-utils'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { ThemeColor } from '@core/types'
import type { Referral, ReferralStatus } from '@/types/apps/referralTypes'
import { getReferrals } from '@/app/actions/referrals'
import OptionMenu from '@core/components/option-menu'
import tableStyles from '@core/styles/table.module.css'

const statusObj: { [key in ReferralStatus]: ThemeColor } = {
  PENDING: 'warning',
  COMPLETED: 'success',
  REWARDED: 'primary'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<Referral>()

const ReferralDashboard = () => {
  const [data, setData] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const referrals = await getReferrals()
        setData(referrals)
      } catch (error) {
        console.error('Failed to load referrals:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = [
    { title: 'Total Referrals', value: data.length, icon: 'tabler-users-group' },
    { title: 'Completed', value: data.filter(r => r.status !== 'PENDING').length, icon: 'tabler-check' },
    { title: 'Total Rewards', value: `₹${data.filter(r => r.status === 'REWARDED').reduce((sum, r) => sum + r.rewardAmount, 0)}`, icon: 'tabler-gift' }
  ]

  const columns = useMemo<ColumnDef<Referral, any>[]>(
    () => [
      columnHelper.accessor('referrerName', {
        header: 'Referrer',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>{row.original.referrerName}</Typography>
            <Typography variant='body2' className='text-textSecondary'>{row.original.referrerMemberId}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('refereeName', {
        header: 'Referee',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>{row.original.refereeName}</Typography>
            <Typography variant='body2' className='text-textSecondary'>{row.original.refereeEmail}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('rewardType', {
        header: 'Reward',
        cell: ({ row }) => <Chip label={row.original.rewardType} size='small' color='warning' variant='tonal' />
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => <Chip label={row.original.status} variant='tonal' color={statusObj[row.original.status]} size='small' />
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: ({ row }) => <Typography variant='body2'>{new Date(row.original.createdAt).toLocaleDateString()}</Typography>
      }),
      columnHelper.accessor('id', {
        header: 'Action',
        cell: () => (
          <OptionMenu
            iconClassName='text-textSecondary'
            options={[
              { text: 'View Details', icon: 'tabler-eye' },
              { text: 'Mark Completed', icon: 'tabler-check' },
              { text: 'Process Reward', icon: 'tabler-gift' }
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
    <>
      <Grid container spacing={6} className='mbe-6'>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 4 }} key={index}>
            <Card>
              <CardContent className='flex items-center gap-4'>
                <div className='flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10'>
                  <i className={`${stat.icon} text-primary text-2xl`} />
                </div>
                <div>
                  <Typography variant='h5' className='font-bold'>{stat.value}</Typography>
                  <Typography variant='body2' className='text-textSecondary'>{stat.title}</Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardHeader
          title='Referral Program'
          action={
            <Button variant='contained' startIcon={<i className='tabler-share' />}>
              Share Referral Link
            </Button>
          }
        />
        {data.length === 0 ? (
          <CardContent>
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Referrals Yet
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={3}>
                Start referring friends and family to earn rewards!
              </Typography>
              <Button variant="contained" startIcon={<i className='tabler-share' />}>
                Share Referral Link
              </Button>
            </Box>
          </CardContent>
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
                  <tr key={row.id}>
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
    </>
  )
}

export default ReferralDashboard
