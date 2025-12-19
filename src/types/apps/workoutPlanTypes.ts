export type WorkoutPlanStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
export type WorkoutGoal = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'STRENGTH' | 'ENDURANCE' | 'FLEXIBILITY'
export type WorkoutLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export type WorkoutPlan = {
  id: string
  name: string
  description: string
  goal: WorkoutGoal
  level: WorkoutLevel
  duration: number
  daysPerWeek: number
  createdBy: string
  assignedMembers: number
  status: WorkoutPlanStatus
  createdAt: string
}

export const mockWorkoutPlans: WorkoutPlan[] = [
  {
    id: '1',
    name: 'Beginner Full Body',
    description: 'Full body workout for beginners',
    goal: 'STRENGTH',
    level: 'BEGINNER',
    duration: 30,
    daysPerWeek: 3,
    createdBy: 'John Trainer',
    assignedMembers: 52,
    status: 'ACTIVE',
    createdAt: '2024-10-01'
  },
  {
    id: '2',
    name: 'Advanced Muscle Building',
    description: 'Hypertrophy focused program',
    goal: 'MUSCLE_GAIN',
    level: 'ADVANCED',
    duration: 90,
    daysPerWeek: 5,
    createdBy: 'Mike Bodybuilder',
    assignedMembers: 23,
    status: 'ACTIVE',
    createdAt: '2024-09-15'
  },
  {
    id: '3',
    name: 'HIIT Fat Loss',
    description: 'High intensity interval training',
    goal: 'WEIGHT_LOSS',
    level: 'INTERMEDIATE',
    duration: 45,
    daysPerWeek: 4,
    createdBy: 'Sarah Cardio',
    assignedMembers: 38,
    status: 'ACTIVE',
    createdAt: '2024-08-20'
  }
]
