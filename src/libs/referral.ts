import { customAlphabet } from 'nanoid'

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const nanoid = customAlphabet(alphabet, 8)

export class ReferralCodeGenerator {
  static generate(prefix: string = 'REF'): string {
    return `${prefix}${nanoid()}`
  }

  static generateMemberCode(memberId: string): string {
    const shortId = memberId.slice(-4).toUpperCase()
    return `MEM${shortId}${nanoid().slice(0, 4)}`
  }

  static validate(code: string): boolean {
    return /^[A-Z0-9]{7,12}$/.test(code)
  }
}

export interface ReferralReward {
  referrerId: string
  refereeId: string
  type: 'DISCOUNT' | 'CREDIT' | 'FREE_DAYS'
  value: number
  description: string
}

export class ReferralRewardCalculator {
  static calculateReward(
    referralCount: number,
    rewardType: 'DISCOUNT' | 'CREDIT' | 'FREE_DAYS'
  ): number {
    switch (rewardType) {
      case 'DISCOUNT':
        return Math.min(10 + referralCount * 2, 30)
      case 'CREDIT':
        return 500 + referralCount * 100
      case 'FREE_DAYS':
        return 7 + Math.floor(referralCount / 3) * 7
      default:
        return 0
    }
  }
}
