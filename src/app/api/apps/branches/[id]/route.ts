import { NextRequest, NextResponse } from 'next/server'
import { BranchService } from '@/libs/services/branchService'
import { RBACService } from '@/libs/rbac'

/**
 * GET /api/apps/branches/[id]
 * Get a specific branch by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const branch = await BranchService.getBranch(params.id)

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    // Ensure user can only access branches from their tenant
    if (branch.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ branch })
  } catch (error: any) {
    console.error('Get branch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branch' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/apps/branches/[id]
 * Update a specific branch
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'branches.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify branch exists and belongs to tenant
    const existingBranch = await BranchService.getBranch(params.id)
    if (!existingBranch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    if (existingBranch.tenantId !== tenantId) {
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
      isActive,
    } = body

    // If code is being changed, check if it's unique
    if (code && code !== existingBranch.code) {
      const isUnique = await BranchService.isCodeUnique(tenantId, code, params.id)
      if (!isUnique) {
        return NextResponse.json(
          { error: 'Branch code already exists' },
          { status: 400 }
        )
      }
    }

    const branch = await BranchService.updateBranch({
      id: params.id,
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
      isActive,
    })

    return NextResponse.json({ branch })
  } catch (error: any) {
    console.error('Update branch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update branch' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/apps/branches/[id]
 * Soft delete a branch (sets isActive to false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'branches.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify branch exists and belongs to tenant
    const existingBranch = await BranchService.getBranch(params.id)
    if (!existingBranch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    if (existingBranch.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await BranchService.deleteBranch(params.id)

    return NextResponse.json({ success: true, message: 'Branch deleted successfully' })
  } catch (error: any) {
    console.error('Delete branch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete branch' },
      { status: 500 }
    )
  }
}
