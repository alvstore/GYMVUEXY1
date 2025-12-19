import { NextRequest, NextResponse } from 'next/server'
import { PlanService } from '@/lib/services/planService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'plans.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const memberPlan = await PlanService.getMemberPlan(id)

    if (!memberPlan) {
      return NextResponse.json({ error: 'Member plan not found' }, { status: 404 })
    }

    return NextResponse.json(memberPlan)
  } catch (error: any) {
    console.error('Get member plan error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch member plan' },
      { status: 500 }
    )
  }
}

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
    const updateData = {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    }

    const memberPlan = await PlanService.updateMemberPlan(id, updateData, userId)

    return NextResponse.json(memberPlan)
  } catch (error: any) {
    console.error('Update member plan error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update member plan' },
      { status: 500 }
    )
  }
}