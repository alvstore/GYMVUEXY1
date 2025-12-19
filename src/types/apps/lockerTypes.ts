export type LockerStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_ORDER'
export type LockerType = 'STANDARD' | 'PREMIUM' | 'VIP' | 'TEMPORARY'

export type Locker = {
  id: string
  number: string
  floor: number
  section: string
  type: LockerType
  status: LockerStatus
  size?: 'SMALL' | 'MEDIUM' | 'LARGE'
  occupiedBy?: string
  memberName?: string
  assignedDate?: string
  dueDate?: string
  monthlyFee?: number
}
