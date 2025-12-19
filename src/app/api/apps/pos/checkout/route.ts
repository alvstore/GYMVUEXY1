import { NextRequest, NextResponse } from 'next/server'
import { POSService } from '@/lib/services/posService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'pos.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      items,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      discountAmount,
      notes,
    } = body

    // Validate required fields
    if (!branchId || !items || !Array.isArray(items) || items.length === 0 || !paymentMethod) {
      return NextResponse.json(
        { error: 'Branch ID, items, and payment method are required' },
        { status: 400 }
      )
    }

    const result = await POSService.checkout({
      branchId,
      items,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      discountAmount: discountAmount || 0,
      notes,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('POS checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    )
  }
}