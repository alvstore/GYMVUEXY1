import LockerGrid from '@/views/apps/lockers/LockerGrid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

export default function LockerGridPage() {
  return (
    <Card>
      <CardHeader 
        title="Locker Management" 
        subheader="Visual overview of all lockers - click to assign or release"
        action={
          <Box display="flex" gap={1}>
            <Button variant="outlined" size="small" href="/en/apps/lockers/review">
              Review Pending
            </Button>
          </Box>
        }
      />
      <CardContent>
        <LockerGrid />
      </CardContent>
    </Card>
  )
}
