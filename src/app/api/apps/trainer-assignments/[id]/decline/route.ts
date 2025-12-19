import { NextRequest, NextResponse } from 'next/server'
import { TrainerService } from '@/lib/services/trainerService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'trainer_assignments.approve')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { reason } = body

    const assignment = await TrainerService.declineAssignment(id, reason)

    return NextResponse.json(assignment)
  } catch (error: any) {
    console.error('Decline assignment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to decline assignment' },
      { status: 500 }
    )
  }
}