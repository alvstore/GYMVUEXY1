// Next Imports
import { redirect } from 'next/navigation'

// Type Imports
import type { InvoiceType } from '@/types/apps/invoiceTypes'

// Component Imports
import Preview from '@views/apps/invoice/preview'

// Data Imports
import { getInvoices } from '@/app/actions/invoices'

const PreviewPage = async (props: { params: Promise<{ id: string }> }) => {
  const params = await props.params

  const result = await getInvoices({ page: 1, limit: 100 })
  const filteredData = result.invoices?.find((invoice) => invoice.id === params.id)

  if (!filteredData) {
    redirect('/not-found')
  }

  return filteredData ? <Preview invoiceData={filteredData as any} id={params.id} /> : null
}

export default PreviewPage
