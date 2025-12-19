import { NextRequest, NextResponse } from 'next/server'
import { EnhancedClassService } from '@/lib/services/enhancedClassService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'classes.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date()
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 })
    }

    const events = await EnhancedClassService.getCalendarEvents(branchId, startDate, endDate, userId)

    return NextResponse.json(events)
  } catch (error: any) {
    console.error('Get calendar events error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}