import { NextRequest, NextResponse } from 'next/server'
import { BranchService } from '@/libs/services/branchService'
import { RBACService } from '@/libs/rbac'

/**
 * GET /api/apps/branches
 * Get all branches with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'branches.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search') || undefined
    const city = searchParams.get('city') || undefined
    const state = searchParams.get('state') || undefined
    const country = searchParams.get('country') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await BranchService.getBranches({
      tenantId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
      city,
      state,
      country,
    }, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get branches error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/apps/branches
 * Create a new branch
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'branches.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      code,
      address,
      city,
      state,
      pincode,
      country,
      phone,
      email,
      currency,
      timezone,
      logo,
    } = body

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      )
    }

    // Check if code is unique
    const isUnique = await BranchService.isCodeUnique(tenantId, code)
    if (!isUnique) {
      return NextResponse.json(
        { error: 'Branch code already exists' },
        { status: 400 }
      )
    }

    const branch = await BranchService.createBranch({
      tenantId,
      name,
      code,
      address,
      city,
      state,
      pincode,
      country,
      phone,
      email,
      currency,
      timezone,
      logo,
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to create branch'

    console.error('Create branch error:', errorMessage, error)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
