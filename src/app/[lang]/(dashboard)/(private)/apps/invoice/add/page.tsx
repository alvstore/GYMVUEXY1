// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import AddCard from '@views/apps/invoice/add/AddCard'
import AddActions from '@views/apps/invoice/add/AddActions'

// Data Imports
import { getMembers } from '@/app/actions/members'

const InvoiceAdd = async () => {
  const result = await getMembers({ page: 1, limit: 100 })

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 9 }}>
        <AddCard membersData={result.members} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <AddActions />
      </Grid>
    </Grid>
  )
}

export default InvoiceAdd
