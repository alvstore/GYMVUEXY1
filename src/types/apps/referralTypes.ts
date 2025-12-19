export type ReferralStatus = 'PENDING' | 'COMPLETED' | 'REWARDED'

export type Referral = {
  id: string
  referrerName: string
  referrerMemberId: string
  refereeName: string
  refereeEmail: string
  refereePhone: string
  status: ReferralStatus
  rewardAmount: number
  rewardType: string
  createdAt: string
  completedAt?: string
}
