import { NextRequest, NextResponse } from 'next/server'
import { MeasurementService } from '@/lib/services/measurementService'
import { RBACService } from '@/lib/rbac'
import { AuditService } from '@/lib/services/auditService'

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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'members.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const measurements = await MeasurementService.getMemberMeasurements(id)
    const progressData = await MeasurementService.getProgressData(id)
    const progressPhotos = await MeasurementService.getProgressPhotos(id)

    return NextResponse.json({
      measurements,
      progressData,
      progressPhotos,
    })
  } catch (error: any) {
    console.error('Get member measurements error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch measurements' },
      { status: 500 }
    )
  }
}

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
      height,
      weight,
      bodyFat,
      muscleMass,
      chest,
      waist,
      hips,
      biceps,
      thighs,
      neck,
      notes,
    } = body

    // Validate required fields
    if (!branchId) {
      return NextResponse.json(
        { error: 'Branch ID is required' },
        { status: 400 }
      )
    }

    const measurement = await MeasurementService.createMeasurement({
      memberId: id,
      branchId,
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
      chest: chest ? parseFloat(chest) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      hips: hips ? parseFloat(hips) : undefined,
      biceps: biceps ? parseFloat(biceps) : undefined,
      thighs: thighs ? parseFloat(thighs) : undefined,
      neck: neck ? parseFloat(neck) : undefined,
      notes,
      takenBy: userId,
    }, tenantId)

    // Create audit log
    await AuditService.logUserAction(
      userId,
      'CREATE_MEASUREMENT',
      'measurements',
      measurement.id,
      null,
      measurement,
      request
    )

    return NextResponse.json(measurement, { status: 201 })
  } catch (error: any) {
    console.error('Create measurement error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create measurement' },
      { status: 500 }
    )
  }
}