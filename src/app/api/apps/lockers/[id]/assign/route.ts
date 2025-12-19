import { NextRequest, NextResponse } from 'next/server'
import { LockerService } from '@/lib/services/lockerService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'lockers.assign')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      memberId,
      branchId,
      startDate,
      endDate,
      monthlyRate,
      securityDeposit,
      keyNumber,
      notes,
    } = body

    // Validate required fields
    if (!memberId || !branchId || !startDate || !endDate || !monthlyRate) {
      return NextResponse.json(
        { error: 'Member ID, branch ID, start date, end date, and monthly rate are required' },
        { status: 400 }
      )
    }

    const result = await LockerService.assignLocker({
      lockerId: id,
      memberId,
      branchId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      monthlyRate: parseFloat(monthlyRate),
      securityDeposit: securityDeposit ? parseFloat(securityDeposit) : 0,
      keyNumber,
      notes,
    }, tenantId)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Assign locker error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to assign locker' },
      { status: 500 }
    )
  }
}