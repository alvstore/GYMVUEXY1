'use client'

import { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import CustomTextField from '@/@core/components/mui/TextField'
import { assignTrainer, getMembersWithoutTrainers, getAvailableTrainers } from '@/app/actions/trainerAssignment'

const ManagerAssignmentTool = () => {
  const [members, setMembers] = useState<any[]>([])
  const [trainers, setTrainers] = useState<any[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedTrainerId, setSelectedTrainerId] = useState('')
  const [sessionType, setSessionType] = useState('PERSONAL_TRAINING')
  const [totalSessions, setTotalSessions] = useState(10)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [membersResult, trainersResult] = await Promise.all([
        getMembersWithoutTrainers(),
        getAvailableTrainers()
      ])

      if (membersResult.success) {
        setMembers(membersResult.members || [])
      } else {
        toast.error('Failed to load members: ' + (membersResult.error || 'Unknown error'))
      }

      if (trainersResult.success) {
        setTrainers(trainersResult.trainers || [])
      } else {
        toast.error('Failed to load trainers: ' + (trainersResult.error || 'Unknown error'))
      }
    } catch (error) {
      toast.error('Error loading data. Please try again.')
      console.error('Error loading data:', error)
    }
  }

  const handleAssign = async () => {
    if (!selectedMemberId || !selectedTrainerId) {
      toast.error('Please select both a member and a trainer')
      return
    }

    setLoading(true)
    try {
      const result = await assignTrainer({
        memberId: selectedMemberId,
        trainerId: selectedTrainerId,
        sessionType: sessionType as any,
        totalSessions,
        startDate: new Date().toISOString(),
        rate: 0
      })

      if (result.success) {
        toast.success('Trainer assigned successfully!')
        setSelectedMemberId('')
        setSelectedTrainerId('')
        await loadData()
      } else {
        toast.error(result.error || 'Failed to assign trainer')
      }
    } catch (error) {
      toast.error('An error occurred while assigning trainer')
    } finally {
      setLoading(false)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'membershipId',
      headerName: 'Member ID',
      width: 150
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => `${params.row.firstName} ${params.row.lastName}`
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150
    },
    {
      field: 'joinDate',
      headerName: 'Join Date',
      width: 130,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Button
          variant='outlined'
          size='small'
          onClick={() => setSelectedMemberId(params.row.id)}
        >
          Select
        </Button>
      )
    }
  ]

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title='Assign Trainer' />
          <CardContent>
            <div className='flex flex-col gap-4'>
              <CustomTextField
                select
                fullWidth
                label='Select Member'
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value=''>Choose a member</MenuItem>
                {members.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName} ({member.membershipId})
                  </MenuItem>
                ))}
              </CustomTextField>

              <CustomTextField
                select
                fullWidth
                label='Select Trainer'
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value=''>Choose a trainer</MenuItem>
                {trainers.map((trainer) => (
                  <MenuItem key={trainer.id} value={trainer.id}>
                    {trainer.user?.name} ({trainer._count?.assignments || 0} active)
                  </MenuItem>
                ))}
              </CustomTextField>

              <CustomTextField
                select
                fullWidth
                label='Session Type'
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
              >
                <MenuItem value='PERSONAL_TRAINING'>Personal Training</MenuItem>
                <MenuItem value='GROUP_CLASS'>Group Class</MenuItem>
                <MenuItem value='CONSULTATION'>Consultation</MenuItem>
                <MenuItem value='ASSESSMENT'>Assessment</MenuItem>
              </CustomTextField>

              <CustomTextField
                fullWidth
                type='number'
                label='Total Sessions'
                value={totalSessions}
                onChange={(e) => setTotalSessions(parseInt(e.target.value) || 1)}
              />

              <Button
                variant='contained'
                fullWidth
                onClick={handleAssign}
                disabled={loading || !selectedMemberId || !selectedTrainerId}
              >
                {loading ? 'Assigning...' : 'Assign Trainer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title='Members Without Trainers' />
          <DataGrid
            rows={members}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } }
            }}
            disableRowSelectionOnClick
            className='min-h-[400px]'
          />
        </Card>
      </Grid>
    </Grid>
  )
}

export default ManagerAssignmentTool
