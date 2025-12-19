// Next Imports
import { redirect } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { InvoiceType } from '@/types/apps/invoiceTypes'

// Component Imports
import EditCard from '@views/apps/invoice/edit/EditCard'
import EditActions from '@views/apps/invoice/edit/EditActions'

// Data Imports
import { getInvoices } from '@/app/actions/invoices'

const EditPage = async (props: { params: Promise<{ id: string }> }) => {
  const params = await props.params

  const result = await getInvoices({ page: 1, limit: 100 })
  const filteredData = result.invoices?.find((invoice) => invoice.id === params.id)

  if (!filteredData) {
    redirect('/not-found')
  }

  return filteredData ? (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 9 }}>
        <EditCard data={result.invoices} invoiceData={filteredData as any} id={params.id} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <EditActions id={params.id} />
      </Grid>
    </Grid>
  ) : null
}

export default EditPage
