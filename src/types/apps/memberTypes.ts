export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'CANCELLED' | 'FROZEN'

export type Member = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar?: string
  membershipId: string
  status: MemberStatus
  membershipPlan?: string
  startDate: string
  endDate: string
  emergencyContact?: string
  emergencyPhone?: string
  bloodGroup?: string
  medicalNotes?: string
  assignedTrainer?: string
  lastAttendance?: string
  totalAttendance?: number
  branchId: string
  branchName?: string
  tenantId: string
  createdAt: string
}

export type MemberFormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  address?: string
  membershipPlanId?: string
  startDate?: string
  emergencyContact?: string
  emergencyPhone?: string
  bloodGroup?: string
  medicalNotes?: string
  assignedTrainerId?: string
}
