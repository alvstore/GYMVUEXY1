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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'trainers.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const sessionType = searchParams.get('sessionType')
    const preferredDay = searchParams.get('preferredDay') || undefined

    if (!branchId || !sessionType) {
      return NextResponse.json(
        { error: 'Branch ID and session type are required' },
        { status: 400 }
      )
    }

    const trainer = await TrainerService.findOptimalTrainer(
      branchId,
      sessionType as any,
      undefined,
      preferredDay as any
    )

    return NextResponse.json(trainer)
  } catch (error: any) {
    console.error('Find optimal trainer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to find optimal trainer' },
      { status: 500 }
    )
  }
}