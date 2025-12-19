// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Component Imports
import CardStatVertical from '@/components/card-statistics/Vertical'

const GymDashboard = async () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant='h4' className='mbe-1'>
              Gym Management Dashboard
            </Typography>
            <Typography>Welcome to your gym management overview</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Total Members'
          subtitle='Active Members'
          stats='2,458'
          avatarColor='primary'
          avatarIcon='tabler-users'
          avatarSkin='light'
          avatarSize={44}
          chipText='+12.5%'
          chipColor='success'
          chipVariant='tonal'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Active Memberships'
          subtitle='Current Month'
          stats='1,842'
          avatarColor='success'
          avatarIcon='tabler-id-badge'
          avatarSkin='light'
          avatarSize={44}
          chipText='+8.3%'
          chipColor='success'
          chipVariant='tonal'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title="Today's Check-ins"
          subtitle='Last updated now'
          stats='347'
          avatarColor='info'
          avatarIcon='tabler-door-enter'
          avatarSkin='light'
          avatarSize={44}
          chipText='+5.2%'
          chipColor='success'
          chipVariant='tonal'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Monthly Revenue'
          subtitle='This Month'
          stats='$84,250'
          avatarColor='warning'
          avatarIcon='tabler-currency-dollar'
          avatarSkin='light'
          avatarSize={44}
          chipText='+18.9%'
          chipColor='success'
          chipVariant='tonal'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Active Trainers'
          subtitle='On Duty Today'
          stats='24'
          avatarColor='error'
          avatarIcon='tabler-user-check'
          avatarSkin='light'
          avatarSize={44}
          chipText='100%'
          chipColor='success'
          chipVariant='tonal'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Upcoming Classes'
          subtitle='Today'
          stats='18'
          avatarColor='secondary'
          avatarIcon='tabler-calendar-event'
          avatarSkin='light'
          avatarSize={44}
          chipText='6 in progress'
          chipColor='info'
          chipVariant='tonal'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Available Lockers'
          subtitle='Total Lockers'
          stats='45/120'
          avatarColor='primary'
          avatarIcon='tabler-lock'
          avatarSkin='light'
          avatarSize={44}
          chipText='37.5% Free'
          chipColor='info'
          chipVariant='tonal'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <CardStatVertical
          title='Pending Payments'
          subtitle='Overdue'
          stats='12'
          avatarColor='error'
          avatarIcon='tabler-alert-circle'
          avatarSkin='light'
          avatarSize={44}
          chipText='Needs attention'
          chipColor='error'
          chipVariant='tonal'
        />
      </Grid>
    </Grid>
  )
}

export default GymDashboard
