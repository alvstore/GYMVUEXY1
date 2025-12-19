import { NextRequest, NextResponse } from 'next/server'
import { TrainerService } from '@/lib/services/trainerService'
import { RBACService } from '@/lib/rbac'

export async function GET(
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'trainer_assignments.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const assignments = await TrainerService.getAssignments({
      trainerId: id,
    })

    return NextResponse.json(assignments)
  } catch (error: any) {
    console.error('Get trainer assignments error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trainer assignments' },
      { status: 500 }
    )
  }
}