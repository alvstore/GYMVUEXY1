import { NextRequest, NextResponse } from 'next/server'
import { MeasurementService } from '@/lib/services/measurementService'
import { RBACService } from '@/lib/rbac'

export async function POST(
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'members.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      memberPlanId,
      imageUrl,
      caption,
      photoType,
    } = body

    // Validate required fields
    if (!branchId || !imageUrl) {
      return NextResponse.json(
        { error: 'Branch ID and image URL are required' },
        { status: 400 }
      )
    }

    const progressPhoto = await MeasurementService.addProgressPhoto({
      memberId: id,
      branchId,
      memberPlanId,
      imageUrl,
      caption,
      photoType,
    }, tenantId)

    return NextResponse.json(progressPhoto, { status: 201 })
  } catch (error: any) {
    console.error('Add progress photo error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add progress photo' },
      { status: 500 }
    )
  }
}