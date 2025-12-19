import { NextRequest, NextResponse } from 'next/server'
import { MemberService } from '@/lib/services/memberService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'memberships.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { planId, branchId, startDate, notes } = body

    // Validate required fields
    if (!planId || !branchId || !startDate) {
      return NextResponse.json(
        { error: 'Plan ID, branch ID, and start date are required' },
        { status: 400 }
      )
    }

    const result = await MemberService.assignMembership({
      memberId: id,
      planId,
      branchId,
      startDate: new Date(startDate),
      notes,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Assign membership error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to assign membership' },
      { status: 500 }
    )
  }
}