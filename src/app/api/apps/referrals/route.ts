import { NextRequest, NextResponse } from 'next/server'
import { ReferralService } from '@/lib/services/referralService'
import { RBACService } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'members.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const referrerMemberId = searchParams.get('referrerMemberId') || undefined
    const isProcessed = searchParams.get('isProcessed') === 'true' ? true : 
                       searchParams.get('isProcessed') === 'false' ? false : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await ReferralService.getReferrals({
      branchId,
      referrerMemberId,
      isProcessed,
    }, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get referrals error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch referrals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'members.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      referrerMemberId,
      referredMemberId,
      branchId,
      bonusAmount,
      bonusType,
    } = body

    // Validate required fields
    if (!referrerMemberId || !referredMemberId || !branchId || !bonusAmount || !bonusType) {
      return NextResponse.json(
        { error: 'All referral fields are required' },
        { status: 400 }
      )
    }

    const referral = await ReferralService.createReferral({
      referrerMemberId,
      referredMemberId,
      branchId,
      bonusAmount: parseFloat(bonusAmount),
      bonusType,
    }, tenantId)

    return NextResponse.json(referral, { status: 201 })
  } catch (error: any) {
    console.error('Create referral error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create referral' },
      { status: 500 }
    )
  }
}