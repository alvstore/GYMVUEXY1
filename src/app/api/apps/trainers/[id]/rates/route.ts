import { NextRequest, NextResponse } from 'next/server'
import { TrainerService } from '@/lib/services/trainerService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'trainers.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { rates } = body

    if (!Array.isArray(rates)) {
      return NextResponse.json(
        { error: 'Rates must be an array' },
        { status: 400 }
      )
    }

    await TrainerService.setRates(id, rates)

    return NextResponse.json({ message: 'Rates updated successfully' })
  } catch (error: any) {
    console.error('Update rates error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update rates' },
      { status: 500 }
    )
  }
}