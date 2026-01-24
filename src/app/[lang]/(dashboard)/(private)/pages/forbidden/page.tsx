import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

export const metadata = {
  title: 'Access Denied',
  description: 'You do not have permission to access this page',
}

export default function ForbiddenPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        p: 4,
      }}
    >
      <Card sx={{ maxWidth: 500, textAlign: 'center' }}>
        <CardContent sx={{ py: 6, px: 4 }}>
          <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'error.main', mb: 2 }}>
            403
          </Typography>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Access Denied
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            You do not have permission to access this page. Please contact your administrator if you believe this is an error.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Link href="/" passHref>
              <Button variant="contained">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/pages/account-settings" passHref>
              <Button variant="outlined">
                Account Settings
              </Button>
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
