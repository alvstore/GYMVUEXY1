import { NextRequest, NextResponse } from 'next/server'
import { EnhancedClassService } from '@/lib/services/enhancedClassService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'classes.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const trainerId = searchParams.get('trainerId') || undefined
    const classType = searchParams.get('classType') || undefined
    const difficulty = searchParams.get('difficulty') || undefined
    const search = searchParams.get('search') || undefined
    const isActive = searchParams.get('isActive') === 'true' ? true : 
                     searchParams.get('isActive') === 'false' ? false : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await EnhancedClassService.getClasses({
      branchId,
      trainerId,
      classType: classType as any,
      difficulty: difficulty as any,
      search,
      isActive,
    }, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get classes error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch classes' },
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'classes.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      trainerId,
      name,
      description,
      classType,
      difficulty,
      duration,
      capacity,
      price,
      isRecurring,
      recurringDays,
      startTime,
      endTime,
      roomId,
      imageUrl,
      requirements,
    } = body

    // Validate required fields
    if (!branchId || !name || !classType || !duration || !capacity || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Branch ID, name, class type, duration, capacity, start time, and end time are required' },
        { status: 400 }
      )
    }

    const classData = await EnhancedClassService.createClass({
      tenantId,
      branchId,
      trainerId,
      name,
      description,
      classType,
      difficulty,
      duration: parseInt(duration),
      capacity: parseInt(capacity),
      price: price ? parseFloat(price) : undefined,
      isRecurring: isRecurring || false,
      recurringDays: recurringDays || [],
      startTime,
      endTime,
      roomId,
      imageUrl,
      requirements,
    })

    return NextResponse.json(classData, { status: 201 })
  } catch (error: any) {
    console.error('Create class error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create class' },
      { status: 500 }
    )
  }
}