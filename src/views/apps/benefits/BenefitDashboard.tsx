'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'

const BenefitDashboard = ({ balances, transactions }: { balances: any[], transactions: any[] }) => {
  const columns: GridColDef[] = [
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'transactionType',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size='small'
          color={params.value === 'CONSUMED' ? 'error' : 'success'}
          variant='tonal'
        />
      ),
    },
    {
      field: 'benefitType',
      headerName: 'Benefit',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 100,
    },
    {
      field: 'balanceBefore',
      headerName: 'Before',
      width: 100,
    },
    {
      field: 'balanceAfter',
      headerName: 'After',
      width: 100,
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 1,
      minWidth: 150,
    },
  ]

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4' className='mb-2'>
          Benefit Balances
        </Typography>
      </Grid>

      {balances?.map((balance) => (
        <Grid item xs={12} md={6} lg={4} key={balance.id}>
          <Card>
            <CardHeader
              title={balance.benefitName}
              subheader={balance.benefitType}
              action={
                balance.isUnlimited ? (
                  <Chip label='Unlimited' size='small' color='success' />
                ) : null
              }
            />
            <CardContent>
              {!balance.isUnlimited && (
                <>
                  <Box className='mb-4'>
                    <div className='flex justify-between mb-2'>
                      <Typography variant='caption'>Used: {balance.usedBalance}</Typography>
                      <Typography variant='caption'>Remaining: {balance.remainingBalance}</Typography>
                    </div>
                    <LinearProgress
                      variant='determinate'
                      value={(balance.usedBalance / balance.totalBalance) * 100}
                      className='h-2 rounded'
                      color={balance.remainingBalance > 0 ? 'primary' : 'error'}
                    />
                  </Box>
                  <Typography variant='h6' className='text-center'>
                    {balance.remainingBalance} / {balance.totalBalance}
                  </Typography>
                </>
              )}
              {balance.isUnlimited && (
                <Typography variant='h6' className='text-center text-success'>
                  ∞ Unlimited Access
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}

      {(!balances || balances.length === 0) && (
        <Grid item xs={12}>
          <Card>
            <CardContent className='text-center py-8'>
              <Typography variant='body2' color='textSecondary'>
                No benefit balances found
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12}>
        <Card>
          <CardHeader title='Transaction History' />
          <DataGrid
            rows={transactions || []}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            className='min-h-[400px]'
          />
        </Card>
      </Grid>
    </Grid>
  )
}

export default BenefitDashboard
