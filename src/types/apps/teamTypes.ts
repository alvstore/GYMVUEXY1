export type StaffRole = 'MANAGER' | 'TRAINER' | 'RECEPTIONIST' | 'CLEANER' | 'MAINTENANCE' | 'ADMIN'
export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED'

export type StaffMember = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar?: string
  employeeId: string
  role: StaffRole
  department?: string
  status: StaffStatus
  joinDate: string
  salary: number
  branchId: string
  branchName?: string
  tenantId: string
  createdAt: string
}
