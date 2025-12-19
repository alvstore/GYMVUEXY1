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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'communication.send')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      to,
      content,
      templateId,
      memberId,
      variables,
    } = body

    // Validate required fields
    if (!branchId || !to || !content) {
      return NextResponse.json(
        { error: 'Branch ID, recipient, and content are required' },
        { status: 400 }
      )
    }

    // Process template variables if provided
    let processedContent = content
    if (variables && typeof variables === 'object') {
      processedContent = CommunicationService.processTemplate(content, variables)
    }

    const result = await CommunicationService.sendSms(tenantId, branchId, {
      to,
      content: processedContent,
      templateId,
      memberId,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Send SMS error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    )
  }
}