import { NextRequest, NextResponse } from 'next/server'
import { PlanService } from '@/lib/services/planService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'plans.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const planType = searchParams.get('planType') || undefined

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const plans = await PlanService.getMemberPlans(memberId, planType as any)

    return NextResponse.json(plans)
  } catch (error: any) {
    console.error('Get member plans error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch member plans' },
      { status: 500 }
    )
  }
}

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
      templateId,
      trainerId,
      name,
      planType,
      category,
      difficulty,
      content,
      startDate,
      endDate,
      customNotes,
    } = body

    // Validate required fields
    if (!memberId || !name || !planType || !category || !difficulty || !content || !startDate) {
      return NextResponse.json(
        { error: 'Member ID, name, plan type, category, difficulty, content, and start date are required' },
        { status: 400 }
      )
    }

    const memberPlan = await PlanService.createMemberPlan({
      memberId,
      templateId,
      trainerId,
      name,
      planType,
      category,
      difficulty,
      content,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      customNotes,
    })

    return NextResponse.json(memberPlan, { status: 201 })
  } catch (error: any) {
    console.error('Create member plan error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create member plan' },
      { status: 500 }
    )
  }
}