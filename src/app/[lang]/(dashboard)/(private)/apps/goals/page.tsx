import GoalsDashboard from '@/views/apps/goals/GoalsDashboard'
import { getAllGoals } from '@/app/actions/people/goals'

const GoalsPage = async () => {
  const result = await getAllGoals({ page: 1, limit: 50 })

  return <GoalsDashboard goals={result.data} />
}

export default GoalsPage
