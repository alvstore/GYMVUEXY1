export type TrainerStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
export type TrainerSpecialization = 'STRENGTH' | 'CARDIO' | 'YOGA' | 'PILATES' | 'CROSSFIT' | 'MARTIAL_ARTS' | 'NUTRITION' | 'PHYSIOTHERAPY'

export type Trainer = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar?: string
  employeeId: string
  status: TrainerStatus
  specializations: TrainerSpecialization[]
  certifications: string[]
  joinDate: string
  salary: number
  commissionRate: number
  assignedClients: number
  maxCapacity: number
  branchId: string
  branchName?: string
  tenantId: string
  createdAt: string
}
