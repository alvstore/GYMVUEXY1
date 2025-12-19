import { NextRequest, NextResponse } from 'next/server'
import { PlanService } from '@/lib/services/planService'
import { RBACService } from '@/lib/rbac'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'plans.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      memberId,
      planType,
      category,
      duration,
      preferences,
    } = body

    // Validate required fields
    if (!memberId || !planType || !category || !duration) {
      return NextResponse.json(
        { error: 'Member ID, plan type, category, and duration are required' },
        { status: 400 }
      )
    }

    // Generate AI plan (currently mock implementation)
    const result = await PlanService.generatePlan({
      memberId,
      planType,
      category,
      duration: parseInt(duration),
      preferences,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('AI plan generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate plan' },
      { status: 500 }
    )
  }
}