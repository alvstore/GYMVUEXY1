import { NextRequest, NextResponse } from 'next/server'
import { RoomService } from '@/lib/services/roomService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'rooms.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 })
    }

    const rooms = await RoomService.getRooms(branchId)

    return NextResponse.json(rooms)
  } catch (error: any) {
    console.error('Get rooms error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rooms' },
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'rooms.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { branchId, name, code, roomType, capacity, description } = body

    // Validate required fields
    if (!branchId || !name || !code || !roomType) {
      return NextResponse.json(
        { error: 'Branch ID, name, code, and room type are required' },
        { status: 400 }
      )
    }

    const room = await RoomService.createRoom({
      branchId,
      name,
      code,
      roomType,
      capacity: capacity ? parseInt(capacity) : undefined,
      description,
    }, tenantId)

    return NextResponse.json(room, { status: 201 })
  } catch (error: any) {
    console.error('Create room error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create room' },
      { status: 500 }
    )
  }
}