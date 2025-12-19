'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

const PlanCatalog = ({ plans }: { plans: any[] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'INACTIVE': return 'error'
      default: return 'default'
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Membership Plans Catalog'
            action={
              <Button variant='contained' startIcon={<i className='tabler-plus' />}>
                Create Plan
              </Button>
            }
          />
        </Card>
      </Grid>

      {plans?.map((plan) => (
        <Grid item xs={12} md={6} lg={4} key={plan.id}>
          <Card className='h-full'>
            <CardHeader
              title={plan.name}
              subheader={plan.description}
              action={
                <Chip
                  label={plan.status}
                  size='small'
                  color={getStatusColor(plan.status)}
                  variant='tonal'
                />
              }
            />
            <CardContent>
              <div className='mb-6'>
                <Typography variant='h3' className='mb-2'>
                  ${plan.price}
                  <Typography component='span' variant='body2' color='textSecondary'>
                    /{plan.billingCycle}
                  </Typography>
                </Typography>
                <Typography variant='caption' color='textSecondary'>
                  Duration: {plan.durationDays} days
                </Typography>
              </div>

              <Divider className='mb-4' />

              <Typography variant='subtitle2' className='mb-2'>
                Plan Benefits:
              </Typography>
              <List dense>
                {plan.benefits?.map((benefit: any) => (
                  <ListItem key={benefit.id}>
                    <ListItemIcon>
                      <i className='tabler-check text-success' />
                    </ListItemIcon>
                    <ListItemText
                      primary={benefit.benefitName}
                      secondary={
                        benefit.isUnlimited
                          ? 'Unlimited'
                          : `${benefit.benefitValue} ${benefit.benefitUnit || ''} ${
                              benefit.isRecurring ? `(${benefit.recurringFrequency})` : ''
                            }`
                      }
                    />
                  </ListItem>
                ))}
              </List>

              {(!plan.benefits || plan.benefits.length === 0) && (
                <Typography variant='body2' color='textSecondary' className='text-center py-4'>
                  No benefits configured
                </Typography>
              )}

              <div className='mt-6 flex gap-2'>
                <Button variant='outlined' fullWidth startIcon={<i className='tabler-edit' />}>
                  Edit
                </Button>
                <Button variant='outlined' fullWidth startIcon={<i className='tabler-plus' />}>
                  Add Benefits
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {(!plans || plans.length === 0) && (
        <Grid item xs={12}>
          <Card>
            <CardContent className='text-center py-12'>
              <i className='tabler-package text-6xl text-textDisabled mb-4' />
              <Typography variant='h6' color='textSecondary'>
                No plans created yet
              </Typography>
              <Typography variant='body2' color='textSecondary' className='mb-4'>
                Create membership plans to get started
              </Typography>
              <Button variant='contained' startIcon={<i className='tabler-plus' />}>
                Create First Plan
              </Button>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}

export default PlanCatalog
