import { NextRequest, NextResponse } from 'next/server'
import { InventoryService } from '@/lib/services/inventoryService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'inventory.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      productId,
      quantity,
      movementType,
      unitPrice,
      reference,
      notes,
    } = body

    // Validate required fields
    if (!productId || !quantity || !movementType) {
      return NextResponse.json(
        { error: 'Product ID, quantity, and movement type are required' },
        { status: 400 }
      )
    }

    const result = await InventoryService.updateStock(
      productId,
      parseInt(quantity),
      movementType,
      unitPrice ? parseFloat(unitPrice) : undefined,
      reference,
      notes
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Update stock error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update stock' },
      { status: 500 }
    )
  }
}