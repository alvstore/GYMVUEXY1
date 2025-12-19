import { NextRequest, NextResponse } from 'next/server'
import { AttendanceService } from '@/lib/services/attendanceService'
import { RBACService } from '@/lib/rbac'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'attendance.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const attendance = await AttendanceService.memberCheckOut(id)

    return NextResponse.json(attendance)
  } catch (error: any) {
    console.error('Check-out error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check out member' },
      { status: 500 }
    )
  }
}