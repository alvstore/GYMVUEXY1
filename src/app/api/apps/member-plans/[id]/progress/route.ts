import { NextRequest, NextResponse } from 'next/server'
import { PlanService } from '@/lib/services/planService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'plans.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { progress } = body

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'Progress must be a number between 0 and 100' },
        { status: 400 }
      )
    }

    const memberPlan = await PlanService.updateMemberPlanProgress(id, progress, userId)

    return NextResponse.json(memberPlan)
  } catch (error: any) {
    console.error('Update plan progress error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update plan progress' },
      { status: 500 }
    )
  }
}