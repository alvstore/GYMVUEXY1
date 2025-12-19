export type ClassStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type ClassType = 'GROUP' | 'PERSONAL' | 'VIRTUAL'

export type GymClass = {
  id: string
  name: string
  description?: string
  type: ClassType
  trainerId: string
  trainerName: string
  capacity: number
  enrolled: number
  waitlist: number
  schedule: string
  duration: number
  status: ClassStatus
  branchId: string
  tenantId: string
  createdAt: string
}
