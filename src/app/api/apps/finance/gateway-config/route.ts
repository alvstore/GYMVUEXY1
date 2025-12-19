import { NextRequest, NextResponse } from 'next/server'
import { EnhancedFinanceService } from '@/lib/services/enhancedFinanceService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'finance.manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { branchId, gateway, config, isDefault } = body

    // Validate required fields
    if (!gateway || !config) {
      return NextResponse.json(
        { error: 'Gateway and config are required' },
        { status: 400 }
      )
    }

    const gatewayConfig = await EnhancedFinanceService.savePaymentGatewayConfig({
      tenantId,
      branchId,
      gateway,
      config,
      isDefault,
    })

    return NextResponse.json(gatewayConfig, { status: 201 })
  } catch (error: any) {
    console.error('Save gateway config error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save gateway configuration' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'finance.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const gateway = searchParams.get('gateway') || undefined

    const config = await EnhancedFinanceService.getPaymentGatewayConfig(
      tenantId, 
      branchId, 
      gateway as any
    )

    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Get gateway config error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch gateway configuration' },
      { status: 500 }
    )
  }
}