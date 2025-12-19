import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/lib/services/communicationService'
import { RBACService } from '@/lib/rbac'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'communication.manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      provider,
      config,
      fromName,
      fromEmail,
      replyToEmail,
      logoUrl,
      brandColor,
      footerText,
    } = body

    // Validate required fields
    if (!provider || !config || !fromName || !fromEmail) {
      return NextResponse.json(
        { error: 'Provider, config, from name, and from email are required' },
        { status: 400 }
      )
    }

    const emailConfig = await CommunicationService.saveEmailConfig(tenantId, branchId || null, {
      provider,
      config,
      fromName,
      fromEmail,
      replyToEmail,
      logoUrl,
      brandColor,
      footerText,
    })

    return NextResponse.json(emailConfig, { status: 201 })
  } catch (error: any) {
    console.error('Save email config error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save email configuration' },
      { status: 500 }
    )
  }
}