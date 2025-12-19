'use client'

import { useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import AddMemberDrawer from './AddMemberDrawer'
import EditMemberDrawer from './EditMemberDrawer'
import { createMember, updateMember } from '@/app/actions/people/members'

const EnhancedMemberDirectory = ({ members }: { members: any[] }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: any) => {
    setAnchorEl(event.currentTarget)
    setSelectedMember(member)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedMember(null)
  }

  const columns: GridColDef[] = [
    {
      field: 'member',
      headerName: 'Member',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <div className='flex items-center gap-3'>
          <Avatar src={params.row.avatarUrl}>
            {params.row.firstName[0]}{params.row.lastName[0]}
          </Avatar>
          <div>
            <Typography variant='body2' className='font-medium'>
              {params.row.firstName} {params.row.lastName}
            </Typography>
            <Typography variant='caption' color='textSecondary'>
              {params.row.email}
            </Typography>
          </div>
        </div>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
    },
    {
      field: 'membershipStatus',
      headerName: 'Membership',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.row.membershipStatus || 'No Active Plan'}
          size='small'
          variant='tonal'
          color={params.row.membershipStatus === 'ACTIVE' ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 200,
      renderCell: (params) => (
        <div className='flex gap-1 flex-wrap'>
          {params.row.tags?.slice(0, 2).map((tag: string) => (
            <Chip key={tag} label={tag} size='small' />
          ))}
          {params.row.tags?.length > 2 && (
            <Chip label={`+${params.row.tags.length - 2}`} size='small' />
          )}
        </div>
      ),
    },
    {
      field: 'kycStatus',
      headerName: 'KYC',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.idProofType ? 'Submitted' : 'Pending'}
          size='small'
          variant='tonal'
          color={params.row.idProofType ? 'info' : 'warning'}
        />
      ),
    },
    {
      field: 'referralCode',
      headerName: 'Referral Code',
      width: 130,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <IconButton onClick={(e) => handleMenuOpen(e, params.row)}>
          <i className='tabler-dots-vertical' />
        </IconButton>
      ),
    },
  ]

  const filteredMembers = members.filter(m =>
    `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateMember = async (data: any) => {
    try {
      const result = await createMember(data)
      if (result.success) {
        toast.success('Member created successfully!')
        setCreateDrawerOpen(false)
      } else {
        toast.error(result.error || 'Failed to create member')
      }
    } catch (error) {
      toast.error('An error occurred while creating the member')
    }
  }

  const handleUpdateMember = async (data: any) => {
    if (!selectedMember) return
    
    try {
      const result = await updateMember(selectedMember.id, data)
      if (result.success) {
        toast.success('Member updated successfully!')
        setEditDrawerOpen(false)
        setSelectedMember(null)
      } else {
        toast.error(result.error || 'Failed to update member')
      }
    } catch (error) {
      toast.error('An error occurred while updating the member')
    }
  }

  const handleEditClick = () => {
    setEditDrawerOpen(true)
    handleMenuClose()
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Member Directory'
          action={
            <div className='flex gap-4 items-center'>
              <TextField
                size='small'
                placeholder='Search members...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button 
                variant='contained' 
                startIcon={<i className='tabler-plus' />}
                onClick={() => setCreateDrawerOpen(true)}
              >
                Add Member
              </Button>
            </div>
          }
        />
        <DataGrid
          rows={filteredMembers}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          className='min-h-[500px]'
        />
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditClick}>
          <i className='tabler-edit mr-2' />
          Edit Member
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <i className='tabler-file-text mr-2' />
          View KYC
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <i className='tabler-trophy mr-2' />
          View Goals
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <i className='tabler-gift mr-2' />
          View Benefits
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <i className='tabler-clock mr-2' />
          Membership History
        </MenuItem>
      </Menu>

      <AddMemberDrawer 
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSubmit={handleCreateMember}
      />

      <EditMemberDrawer 
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false)
          setSelectedMember(null)
        }}
        onSubmit={handleUpdateMember}
        member={selectedMember}
      />
    </>
  )
}

export default EnhancedMemberDirectory
