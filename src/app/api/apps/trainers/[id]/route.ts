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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'trainers.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const trainer = await TrainerService.getTrainer(id)

    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    return NextResponse.json(trainer)
  } catch (error: any) {
    console.error('Get trainer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trainer' },
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'trainers.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updateData = {
      id: id,
      ...body,
      experience: body.experience ? parseInt(body.experience) : undefined,
    }

    const trainer = await TrainerService.updateTrainer(updateData)

    return NextResponse.json(trainer)
  } catch (error: any) {
    console.error('Update trainer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update trainer' },
      { status: 500 }
    )
  }
}