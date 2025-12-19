import { NextRequest, NextResponse } from 'next/server'
import { TrainerService } from '@/lib/services/trainerService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'trainer_assignments.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get('trainerId') || undefined
    const memberId = searchParams.get('memberId') || undefined
    const branchId = searchParams.get('branchId') || undefined
    const status = searchParams.get('status') || undefined

    const assignments = await TrainerService.getAssignments({
      trainerId,
      memberId,
      branchId,
      status: status as any,
    })

    return NextResponse.json(assignments)
  } catch (error: any) {
    console.error('Get assignments error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assignments' },
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'trainer_assignments.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      memberId,
      trainerId,
      branchId,
      sessionType,
      totalSessions,
      rate,
      startDate,
      endDate,
      notes,
      autoAssign,
    } = body

    // Validate required fields
    if (!memberId || !branchId || !sessionType || !totalSessions || !rate) {
      return NextResponse.json(
        { error: 'Member ID, branch ID, session type, total sessions, and rate are required' },
        { status: 400 }
      )
    }

    let finalTrainerId = trainerId

    // Auto-assign trainer if not specified
    if (autoAssign && !trainerId) {
      const optimalTrainer = await TrainerService.findOptimalTrainer(
        branchId,
        sessionType
      )
      finalTrainerId = optimalTrainer.id
    }

    if (!finalTrainerId) {
      return NextResponse.json(
        { error: 'Trainer ID is required or auto-assign must be enabled' },
        { status: 400 }
      )
    }

    const result = await TrainerService.createAssignment({
      memberId,
      trainerId: finalTrainerId,
      branchId,
      sessionType,
      totalSessions: parseInt(totalSessions),
      rate: parseFloat(rate),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      notes,
      requestedBy: userId,
    }, tenantId)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Create assignment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create assignment' },
      { status: 500 }
    )
  }
}