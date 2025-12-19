import { NextRequest, NextResponse } from 'next/server'
import { CommunicationService } from '@/lib/services/communicationService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'communication.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const templateType = searchParams.get('templateType') || undefined

    const templates = await CommunicationService.getTemplates(tenantId, branchId, templateType as any)

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('Get templates error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'communication.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      name,
      description,
      templateType,
      category,
      subject,
      content,
      htmlContent,
      placeholders,
    } = body

    // Validate required fields
    if (!name || !templateType || !category || !content) {
      return NextResponse.json(
        { error: 'Name, template type, category, and content are required' },
        { status: 400 }
      )
    }

    const template = await CommunicationService.createTemplate({
      tenantId,
      branchId,
      name,
      description,
      templateType,
      category,
      subject,
      content,
      htmlContent,
      placeholders,
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    )
  }
}