import BranchListTable from '@/views/apps/branches/list/BranchListTable'
import { getBranches } from '@/app/actions/branches'

const BranchesPage = async () => {
  const result = await getBranches()

  return <BranchListTable branchData={result.branches} />
}

export default BranchesPage
