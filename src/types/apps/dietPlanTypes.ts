export type DietPlanStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
export type DietGoal = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'GENERAL_HEALTH'

export type DietPlan = {
  id: string
  name: string
  description: string
  goal: DietGoal
  caloriesPerDay: number
  duration: number
  createdBy: string
  assignedMembers: number
  status: DietPlanStatus
  createdAt: string
}

export const mockDietPlans: DietPlan[] = [
  {
    id: '1',
    name: 'Weight Loss - Beginner',
    description: 'Low calorie balanced diet for beginners',
    goal: 'WEIGHT_LOSS',
    caloriesPerDay: 1500,
    duration: 30,
    createdBy: 'Dr. Sarah Nutritionist',
    assignedMembers: 45,
    status: 'ACTIVE',
    createdAt: '2024-10-15'
  },
  {
    id: '2',
    name: 'Muscle Gain - High Protein',
    description: 'High protein diet for muscle building',
    goal: 'MUSCLE_GAIN',
    caloriesPerDay: 2500,
    duration: 60,
    createdBy: 'John Trainer',
    assignedMembers: 28,
    status: 'ACTIVE',
    createdAt: '2024-09-20'
  },
  {
    id: '3',
    name: 'Maintenance Plan',
    description: 'Balanced diet for weight maintenance',
    goal: 'MAINTENANCE',
    caloriesPerDay: 2000,
    duration: 90,
    createdBy: 'Dr. Sarah Nutritionist',
    assignedMembers: 67,
    status: 'ACTIVE',
    createdAt: '2024-08-10'
  },
  {
    id: '4',
    name: 'Keto Diet - Advanced',
    description: 'Low carb ketogenic diet',
    goal: 'WEIGHT_LOSS',
    caloriesPerDay: 1800,
    duration: 45,
    createdBy: 'Dr. Sarah Nutritionist',
    assignedMembers: 0,
    status: 'DRAFT',
    createdAt: '2024-11-15'
  }
]
