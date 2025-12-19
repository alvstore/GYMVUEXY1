import { NextRequest, NextResponse } from 'next/server'
import { LockerService } from '@/lib/services/lockerService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'lockers.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const lockerType = searchParams.get('lockerType') || undefined
    const size = searchParams.get('size') || undefined
    const isOccupied = searchParams.get('isOccupied') === 'true' ? true : 
                      searchParams.get('isOccupied') === 'false' ? false : undefined
    const location = searchParams.get('location') || undefined
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await LockerService.getLockers({
      branchId,
      lockerType: lockerType as any,
      size: size as any,
      isOccupied,
      location,
      search,
    }, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get lockers error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lockers' },
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'lockers.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      lockerNumber,
      lockerType,
      location,
      size,
      monthlyRate,
    } = body

    // Validate required fields
    if (!branchId || !lockerNumber || !monthlyRate) {
      return NextResponse.json(
        { error: 'Branch ID, locker number, and monthly rate are required' },
        { status: 400 }
      )
    }

    const locker = await LockerService.createLocker({
      branchId,
      lockerNumber,
      lockerType,
      location,
      size,
      monthlyRate: parseFloat(monthlyRate),
    }, tenantId)

    return NextResponse.json(locker, { status: 201 })
  } catch (error: any) {
    console.error('Create locker error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create locker' },
      { status: 500 }
    )
  }
}