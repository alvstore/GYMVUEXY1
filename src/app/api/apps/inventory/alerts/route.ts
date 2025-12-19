import { NextRequest, NextResponse } from 'next/server'
import { InventoryService } from '@/lib/services/inventoryService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'inventory.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 })
    }

    const alerts = await InventoryService.checkStockAlerts(branchId)

    return NextResponse.json(alerts)
  } catch (error: any) {
    console.error('Get stock alerts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock alerts' },
      { status: 500 }
    )
  }
}