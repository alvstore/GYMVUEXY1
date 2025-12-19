import CustomerListTable from '@views/apps/ecommerce/customers/list/CustomerListTable'

// Data Imports
import { getMembers } from '@/app/actions/members'

const CustomerListTablePage = async () => {
  const result = await getMembers({ page: 1, limit: 100 })

  return <CustomerListTable customerData={result.members} />
}

export default CustomerListTablePage
