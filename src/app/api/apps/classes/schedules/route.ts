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
    const branchId = searchParams.get('branchId') || undefined
    const trainerId = searchParams.get('trainerId') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const schedules = await EnhancedClassService.getSchedules(branchId, startDate, endDate, trainerId)

    return NextResponse.json(schedules)
  } catch (error: any) {
    console.error('Get schedules error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schedules' },
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'classes.schedule')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      classId,
      trainerId,
      scheduledDate,
      startTime,
      endTime,
      capacity,
      roomId,
      notes,
    } = body

    // Validate required fields
    if (!classId || !scheduledDate) {
      return NextResponse.json(
        { error: 'Class ID and scheduled date are required' },
        { status: 400 }
      )
    }

    const schedule = await EnhancedClassService.createSchedule({
      classId,
      trainerId,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      capacity: capacity ? parseInt(capacity) : undefined,
      roomId,
      notes,
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error: any) {
    console.error('Create schedule error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create schedule' },
      { status: 500 }
    )
  }
}