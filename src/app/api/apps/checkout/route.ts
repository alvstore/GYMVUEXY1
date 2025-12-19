import { NextRequest, NextResponse } from 'next/server'
import { CheckoutService } from '@/lib/services/checkoutService'
import { RBACService } from '@/lib/rbac'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'memberships.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      memberId,
      membershipPlanId,
      paymentMethod,
      paymentGateway,
      referralCode,
      customDiscount,
      notes,
    } = body

    // Validate required fields
    if (!branchId || !memberId || !membershipPlanId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Branch ID, member ID, membership plan ID, and payment method are required' },
        { status: 400 }
      )
    }

    const result = await CheckoutService.createMembershipCheckout({
      branchId,
      memberId,
      membershipPlanId,
      paymentMethod,
      paymentGateway,
      referralCode,
      customDiscount: customDiscount ? parseFloat(customDiscount) : undefined,
      notes,
    }, tenantId)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process checkout' },
      { status: 500 }
    )
  }
}