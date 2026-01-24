'use client'

import { useEffect } from 'react'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            p: 4,
            bgcolor: '#f5f5f5',
          }}
        >
          <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2, color: '#d32f2f' }}>
            Something went wrong
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, color: '#666' }}>
            An unexpected error occurred. Please try again.
          </Typography>
          {error.digest && (
            <Typography variant="caption" sx={{ mb: 4, color: '#999' }}>
              Error ID: {error.digest}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => reset()}
              sx={{ bgcolor: '#1976d2' }}
            >
              Try Again
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </Button>
          </Box>
        </Box>
      </body>
    </html>
  )
}
