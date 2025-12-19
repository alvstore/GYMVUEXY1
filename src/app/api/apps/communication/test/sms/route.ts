import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/lib/services/communicationService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'communication.manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { branchId, testPhone } = body

    if (!branchId || !testPhone) {
      return NextResponse.json(
        { error: 'Branch ID and test phone are required' },
        { status: 400 }
      )
    }

    const result = await CommunicationService.sendTestSms(tenantId, branchId, testPhone)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Send test SMS error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test SMS' },
      { status: 500 }
    )
  }
}