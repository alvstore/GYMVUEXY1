import StaffListTable from '@/views/apps/staff/StaffListTable'
import { getStaff } from '@/app/actions/people/staff'

const StaffPage = async () => {
  const result = await getStaff({ page: 1, limit: 100 })

  return <StaffListTable staffData={result.data} />
}

export default StaffPage
