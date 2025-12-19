import { NextRequest, NextResponse } from 'next/server'
import { SettingsService } from '@/libs/services/settingsService'
import { RBACService } from '@/libs/rbac'

/**
 * GET /api/apps/settings/[key]
 * Get a specific setting by key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'settings.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || null
    const key = decodeURIComponent(params.key)

    const setting = await SettingsService.getSetting(tenantId, key, branchId)

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    return NextResponse.json({ setting })
  } catch (error: any) {
    console.error('Get setting error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch setting' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/apps/settings/[key]
 * Delete a specific setting
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'settings.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || null
    const key = decodeURIComponent(params.key)

    await SettingsService.deleteSetting(tenantId, key, branchId)

    return NextResponse.json({ success: true, message: 'Setting deleted successfully' })
  } catch (error: any) {
    console.error('Delete setting error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete setting' },
      { status: 500 }
    )
  }
}
