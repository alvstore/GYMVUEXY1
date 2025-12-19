'use client'

import { useState } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import { toast } from 'react-toastify'
import AddGoalDrawer from './AddGoalDrawer'
import { createMemberGoal } from '@/app/actions/people/goals'

const GoalsDashboard = ({ goals }: { goals: any[] }) => {
  const [showCreate, setShowCreate] = useState(false)

  const handleCreateGoal = async (data: any) => {
    try {
      await createMemberGoal(data)
      toast.success('Goal created successfully!')
      setShowCreate(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create goal')
    }
  }

  return (
    <>
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Member Goals & Progress'
            action={
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => setShowCreate(true)}>
                Create Goal
              </Button>
            }
          />
        </Card>
      </Grid>

      {goals?.map((goal) => (
        <Grid item xs={12} md={6} key={goal.id}>
          <Card>
            <CardHeader
              avatar={
                <Avatar>
                  {goal.member?.firstName[0]}{goal.member?.lastName[0]}
                </Avatar>
              }
              title={`${goal.member?.firstName} ${goal.member?.lastName}`}
              subheader={goal.goalType}
              action={
                <Chip
                  label={goal.status}
                  size='small'
                  color={goal.status === 'COMPLETED' ? 'success' : goal.status === 'IN_PROGRESS' ? 'primary' : 'default'}
                />
              }
            />
            <CardContent>
              <Typography variant='body2' color='textSecondary' className='mb-4'>
                {goal.description}
              </Typography>

              <Box className='mb-4'>
                <div className='flex justify-between mb-2'>
                  <Typography variant='caption'>Target: {goal.targetValue} {goal.targetUnit}</Typography>
                  <Typography variant='caption'>Current: {goal.currentValue || 0} {goal.targetUnit}</Typography>
                </div>
                <LinearProgress
                  variant='determinate'
                  value={goal.targetValue > 0 ? ((goal.currentValue || 0) / goal.targetValue) * 100 : 0}
                  className='h-2 rounded'
                />
              </Box>

              <div className='flex gap-2 mb-4'>
                <Chip label={`Start: ${new Date(goal.startDate).toLocaleDateString()}`} size='small' />
                <Chip label={`Target: ${new Date(goal.targetDate).toLocaleDateString()}`} size='small' />
              </div>

              {goal.assignedTrainerId && goal.assignedTrainer && (
                <Typography variant='caption' color='textSecondary'>
                  Trainer Assigned: {goal.assignedTrainer.firstName} {goal.assignedTrainer.lastName}
                </Typography>
              )}

              <div className='flex gap-2 mt-4'>
                <Button size='small' variant='outlined' startIcon={<i className='tabler-photo' />}>
                  View Progress Photos
                </Button>
                <Button size='small' variant='outlined' startIcon={<i className='tabler-edit' />}>
                  Update Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {(!goals || goals.length === 0) && (
        <Grid item xs={12}>
          <Card>
            <CardContent className='text-center py-12'>
              <i className='tabler-target text-6xl text-textDisabled mb-4' />
              <Typography variant='h6' color='textSecondary'>
                No goals created yet
              </Typography>
              <Typography variant='body2' color='textSecondary' className='mb-4'>
                Start tracking member fitness goals and progress
              </Typography>
              <Button variant='contained' startIcon={<i className='tabler-plus' />}>
                Create First Goal
              </Button>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>

    <AddGoalDrawer
      open={showCreate}
      onClose={() => setShowCreate(false)}
      onSubmit={handleCreateGoal}
    />
    </>
  )
}

export default GoalsDashboard
