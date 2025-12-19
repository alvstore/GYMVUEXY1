import { NextRequest, NextResponse } from 'next/server'
import { MemberService } from '@/lib/services/memberService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'membership_plans.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined

    const plans = await MemberService.getMembershipPlans(branchId)

    return NextResponse.json(plans)
  } catch (error: any) {
    console.error('Get membership plans error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch membership plans' },
      { status: 500 }
    )
  }
}