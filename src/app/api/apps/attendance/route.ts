import { NextRequest, NextResponse } from 'next/server'
import { AttendanceService } from '@/lib/services/attendanceService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'attendance.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const memberId = searchParams.get('memberId') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await AttendanceService.getMemberAttendance({
      branchId,
      memberId,
      startDate,
      endDate,
    }, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get attendance error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'attendance.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { memberId, branchId, entryMethod, roomId, notes } = body

    // Validate required fields
    if (!memberId || !branchId) {
      return NextResponse.json(
        { error: 'Member ID and branch ID are required' },
        { status: 400 }
      )
    }

    const attendance = await AttendanceService.memberCheckIn({
      memberId,
      branchId,
      entryMethod,
      roomId,
      notes,
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch (error: any) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check in member' },
      { status: 500 }
    )
  }
}