export type LockerStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'
export type LockerType = 'FREE' | 'PAID'

export type Locker = {
  id: string
  number: string
  floor: number
  section: string
  type: LockerType
  status: LockerStatus
  occupiedBy?: string
  memberName?: string
  assignedDate?: string
  dueDate?: string
  monthlyFee?: number
}
