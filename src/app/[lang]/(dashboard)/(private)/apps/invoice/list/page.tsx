// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import InvoiceList from '@views/apps/invoice/list'

// Data Imports
import { getInvoices } from '@/app/actions/invoices'

const InvoiceApp = async () => {
  const result = await getInvoices({ page: 1, limit: 100 })

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <InvoiceList invoiceData={result.invoices} />
      </Grid>
    </Grid>
  )
}

export default InvoiceApp
