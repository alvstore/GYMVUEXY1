import { NextRequest, NextResponse } from 'next/server'
import { SettingsService } from '@/libs/services/settingsService'
import { RBACService } from '@/libs/rbac'

/**
 * GET /api/apps/settings
 * Get settings with optional filters
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'settings.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const keyPrefix = searchParams.get('keyPrefix') || undefined
    const keys = searchParams.get('keys')?.split(',') || undefined
    const category = searchParams.get('category') // 'payment', 'branding', 'templates', 'backup'

    let settings

    if (category) {
      // Get settings grouped by category
      const categorized = await SettingsService.getSettingsByCategory(
        tenantId,
        branchId || null
      )
      settings = categorized[category as keyof typeof categorized] || []
    } else {
      // Get settings with filters
      settings = await SettingsService.getSettings({
        tenantId,
        branchId: branchId || null,
        keyPrefix,
        keys,
      })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/apps/settings
 * Create or update (upsert) a setting
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - different permissions for different setting types
    const body = await request.json()
    const { key, branchId, value, description, isEncrypted } = body

    // Validate required fields
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    // Check specific permissions based on setting key
    let requiredPermission = 'settings.update'
    if (key.startsWith('payment.')) {
      requiredPermission = 'settings.payment.update'
    } else if (key.startsWith('template.')) {
      requiredPermission = 'settings.templates.update'
    } else if (key.startsWith('backup.')) {
      requiredPermission = 'settings.backup.manage'
    }

    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, requiredPermission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const setting = await SettingsService.upsertSetting({
      tenantId,
      branchId: branchId || null,
      key,
      value,
      description,
      isEncrypted: isEncrypted || false,
    })

    return NextResponse.json({ setting }, { status: 200 })
  } catch (error: any) {
    console.error('Upsert setting error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save setting' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/apps/settings
 * Bulk upsert multiple settings
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { settings: settingsToUpdate } = body

    if (!Array.isArray(settingsToUpdate) || settingsToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'Settings array is required' },
        { status: 400 }
      )
    }

    // Add tenantId to each setting
    const settingsWithTenant = settingsToUpdate.map(s => ({
      ...s,
      tenantId,
    }))

    const settings = await SettingsService.bulkUpsertSettings(settingsWithTenant)

    return NextResponse.json({ settings, count: settings.length })
  } catch (error: any) {
    console.error('Bulk upsert settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    )
  }
}
