'use client'

import { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import type { ThemeColor } from '@core/types'
import type { Locker, LockerStatus } from '@/types/apps/lockerTypes'
import { getLockers } from '@/app/actions/lockers'

const statusColors: { [key in LockerStatus]: ThemeColor } = {
  AVAILABLE: 'success',
  OCCUPIED: 'primary',
  MAINTENANCE: 'warning',
  RESERVED: 'info'
}

const LockerGrid = () => {
  const [data, setData] = useState<Locker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const lockers = await getLockers()
        setData(lockers)
      } catch (error) {
        console.error('Failed to load lockers:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Card className='mbe-6'>
        <CardHeader
          title='Locker Management'
          action={
            <Button variant='contained' startIcon={<i className='tabler-plus' />}>
              Assign Locker
            </Button>
          }
        />
        <CardContent>
          <div className='flex gap-4 flex-wrap'>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-success' />
              <Typography variant='body2'>Available ({data.filter(l => l.status === 'AVAILABLE').length})</Typography>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-primary' />
              <Typography variant='body2'>Occupied ({data.filter(l => l.status === 'OCCUPIED').length})</Typography>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-warning' />
              <Typography variant='body2'>Maintenance ({data.filter(l => l.status === 'MAINTENANCE').length})</Typography>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded bg-info' />
              <Typography variant='body2'>Reserved ({data.filter(l => l.status === 'RESERVED').length})</Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Lockers Found
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={3}>
                Add lockers to your branch to start managing locker assignments.
              </Typography>
              <Button variant="contained" startIcon={<i className='tabler-plus' />}>
                Add First Locker
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={4}>
          {data.map(locker => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={locker.id}>
              <Card className='cursor-pointer hover:shadow-lg transition-shadow'>
                <CardContent>
                  <div className='flex justify-between items-start mbe-4'>
                    <div>
                      <Typography variant='h5' className='font-bold'>
                        {locker.number}
                      </Typography>
                      <Typography variant='body2' className='text-textSecondary'>
                        Floor {locker.floor} - Section {locker.section}
                      </Typography>
                    </div>
                    <Chip label={locker.type} size='small' color={locker.type === 'PAID' ? 'warning' : 'secondary'} />
                  </div>

                  <Chip
                    label={locker.status}
                    color={statusColors[locker.status]}
                    size='small'
                    variant='tonal'
                    className='mbe-3'
                  />

                  {locker.memberName && (
                    <div className='mbs-3'>
                      <Typography variant='body2' className='font-medium'>
                        {locker.memberName}
                      </Typography>
                      <Typography variant='caption' className='text-textSecondary'>
                        {locker.occupiedBy}
                      </Typography>
                    </div>
                  )}

                  {locker.dueDate && (
                    <div className='mbs-2'>
                      <Typography variant='caption' className='text-textSecondary'>
                        Due: {new Date(locker.dueDate).toLocaleDateString()}
                      </Typography>
                    </div>
                  )}

                  {locker.monthlyFee && (
                    <div className='mbs-2'>
                      <Typography variant='body2' className='font-medium text-primary'>
                        ₹{locker.monthlyFee}/month
                      </Typography>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  )
}

export default LockerGrid
