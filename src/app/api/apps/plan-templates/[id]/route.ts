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

    const template = await PlanService.getTemplate(id)

    if (!template) {
      return NextResponse.json({ error: 'Plan template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error: any) {
    console.error('Get plan template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plan template' },
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
      id: id,
      ...body,
      duration: body.duration ? parseInt(body.duration) : undefined,
    }

    const template = await PlanService.updateTemplate(updateData)

    return NextResponse.json(template)
  } catch (error: any) {
    console.error('Update plan template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update plan template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'plans.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await PlanService.deleteTemplate(id)

    return NextResponse.json({ message: 'Plan template deleted successfully' })
  } catch (error: any) {
    console.error('Delete plan template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete plan template' },
      { status: 500 }
    )
  }
}