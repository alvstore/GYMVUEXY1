import { NextRequest, NextResponse } from 'next/server'
import { ClassService } from '@/lib/services/classService'
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
    const memberId = searchParams.get('memberId')
    const status = searchParams.get('status') || undefined

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const bookings = await ClassService.getMemberBookings(memberId, status as any)

    return NextResponse.json(bookings)
  } catch (error: any) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}