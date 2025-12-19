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

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const favorites = await PlanService.getMemberFavorites(memberId)

    return NextResponse.json(favorites)
  } catch (error: any) {
    console.error('Get plan favorites error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plan favorites' },
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
    const { memberId, templateId, action } = body

    if (!memberId || !templateId || !action) {
      return NextResponse.json(
        { error: 'Member ID, template ID, and action are required' },
        { status: 400 }
      )
    }

    if (action === 'add') {
      const favorite = await PlanService.addToFavorites(memberId, templateId)
      return NextResponse.json(favorite, { status: 201 })
    } else if (action === 'remove') {
      await PlanService.removeFromFavorites(memberId, templateId)
      return NextResponse.json({ message: 'Removed from favorites' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Plan favorites error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update plan favorites' },
      { status: 500 }
    )
  }
}