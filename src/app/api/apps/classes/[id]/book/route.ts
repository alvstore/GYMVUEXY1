import { NextRequest, NextResponse } from 'next/server'
import { EnhancedClassService } from '@/lib/services/enhancedClassService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'classes.book')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { memberId, bookingType, notes } = body

    // Validate required fields
    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    const booking = await EnhancedClassService.bookClass({
      scheduleId: id,
      memberId,
      bookingType,
      notes,
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    console.error('Book class error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to book class' },
      { status: 500 }
    )
  }
}