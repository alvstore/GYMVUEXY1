export type AttendanceRecord = {
  id: string
  memberId: string
  memberName: string
  memberAvatar?: string
  checkInTime: string
  checkOutTime?: string
  duration?: number
  branchName: string
  date: string
}
