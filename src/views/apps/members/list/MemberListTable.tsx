'use client'

import { useEffect, useState, useMemo } from 'react'
import { getMembers } from '@/app/actions/members'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'

import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

import type { ThemeColor } from '@core/types'
import type { Member, MemberStatus } from '@/types/apps/memberTypes'
import type { Locale } from '@configs/i18n'

import AddMemberDrawer from './AddMemberDrawer'
import MemberProfileDrawer from './MemberProfileDrawer'
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'

import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type MemberWithAction = Member & {
  action?: string
}

type MemberStatusColor = {
  [key in MemberStatus]: ThemeColor
}

const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({
    itemRank
  })

  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const memberStatusObj: MemberStatusColor = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  EXPIRED: 'error',
  FROZEN: 'warning',
  PENDING: 'info'
}

const columnHelper = createColumnHelper<MemberWithAction>()

const MemberListTable = ({ memberData }: { memberData?: Member[] }) => {
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(memberData || [])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')

  const { lang: locale } = useParams()

  const handleOpenProfile = (memberId: string) => {
    setSelectedMemberId(memberId)
    setProfileDrawerOpen(true)
  }

  const handleCloseProfile = () => {
    setProfileDrawerOpen(false)
    setSelectedMemberId(null)
  }

  const columns = useMemo<ColumnDef<MemberWithAction, any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        )
      },
      columnHelper.accessor('firstName', {
        header: 'Member',
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
              <Typography
                component={Link}
                href={getLocalizedUrl(`/apps/members/${row.original.id}`, locale as Locale)}
                className='font-medium hover:text-primary'
                color='text.primary'
              >
                {row.original.firstName} {row.original.lastName}
              </Typography>
              <Typography variant='body2' className='text-textSecondary'>
                {row.original.membershipId}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: ({ row }) => <Typography>{row.original.email}</Typography>
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: ({ row }) => <Typography>{row.original.phone}</Typography>
      }),
      columnHelper.accessor('membershipPlan', {
        header: 'Membership',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.membershipPlan || 'None'}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Chip
              label={row.original.status}
              variant='tonal'
              color={memberStatusObj[row.original.status]}
              size='small'
            />
          </div>
        )
      }),
      columnHelper.accessor('endDate', {
        header: 'Expiry Date',
        cell: ({ row }) => (
          <Typography>
            {row.original.endDate ? new Date(row.original.endDate).toLocaleDateString() : 'N/A'}
          </Typography>
        )
      }),
      columnHelper.accessor('lastAttendance', {
        header: 'Last Visit',
        cell: ({ row }) => (
          <Typography className='text-textSecondary'>
            {row.original.lastAttendance
              ? new Date(row.original.lastAttendance).toLocaleDateString()
              : 'Never'}
          </Typography>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center gap-1'>
            <IconButton size='small' onClick={() => handleOpenProfile(row.original.id)}>
              <i className='tabler-user-circle text-[22px] text-textSecondary' />
            </IconButton>
            <IconButton size='small'>
              <Link
                href={getLocalizedUrl(`/apps/members/${row.original.id}`, locale as Locale)}
                className='flex'
              >
                <i className='tabler-eye text-[22px] text-textSecondary' />
              </Link>
            </IconButton>
            <OptionMenu
              iconClassName='text-[22px] text-textSecondary'
              options={[
                { text: 'Edit', icon: 'tabler-edit', menuItemProps: { className: 'flex items-center gap-2' } },
                {
                  text: 'Freeze Membership',
                  icon: 'tabler-snowflake',
                  menuItemProps: { className: 'flex items-center gap-2' }
                },
                {
                  text: 'Send Message',
                  icon: 'tabler-message',
                  menuItemProps: { className: 'flex items-center gap-2' }
                },
                { divider: true },
                {
                  text: 'Delete',
                  icon: 'tabler-trash',
                  menuItemProps: { className: 'flex items-center gap-2 text-error' }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
      })
    ],
    [locale]
  )

  const table = useReactTable({
    data: filteredData as Member[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const getAvatar = (params: Pick<Member, 'avatar' | 'firstName' | 'lastName'>) => {
    const { avatar, firstName, lastName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else {
      return (
        <CustomAvatar skin='light' size={34}>
          {getInitials(`${firstName} ${lastName}`)}
        </CustomAvatar>
      )
    }
  }

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const result = await getMembers({ page: 1, limit: 100 })
        setData(result.members || [])
        setFilteredData(result.members || [])
      } catch (error) {
        console.error('Failed to load members:', error)
        setData(memberData || [])
        setFilteredData(memberData || [])
      }
    }

    loadMembers()
  }, [])

  useEffect(() => {
    setFilteredData(data)
  }, [data])

  return (
    <>
      <Card>
        <CardHeader
          title='Members List'
          className='flex-wrap gap-4'
          action={
            <div className='flex flex-wrap items-center gap-4'>
              <DebouncedInput
                value={globalFilter ?? ''}
                onChange={value => setGlobalFilter(String(value))}
                placeholder='Search Members'
                className='is-full sm:is-auto'
              />
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={() => setAddMemberOpen(true)}
                className='is-full sm:is-auto'
              >
                Add Member
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
                        <>
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
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No members found
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table
                  .getRowModel()
                  .rows.slice(0, table.getState().pagination.pageSize)
                  .map(row => {
                    return (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
        />
      </Card>
      <AddMemberDrawer open={addMemberOpen} handleClose={() => setAddMemberOpen(false)} setData={setData} />
      <MemberProfileDrawer open={profileDrawerOpen} memberId={selectedMemberId} onClose={handleCloseProfile} />
    </>
  )
}

export default MemberListTable
