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
    const branchId = searchParams.get('branchId') || undefined
    const planType = searchParams.get('planType') || undefined
    const category = searchParams.get('category') || undefined
    const difficulty = searchParams.get('difficulty') || undefined
    const search = searchParams.get('search') || undefined
    const isAiGenerated = searchParams.get('isAiGenerated') === 'true' ? true : undefined
    const isFeatured = searchParams.get('isFeatured') === 'true' ? true : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await PlanService.getTemplates({
      tenantId,
      branchId,
      planType: planType as any,
      category: category as any,
      difficulty: difficulty as any,
      search,
      isAiGenerated,
      isFeatured,
    }, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get plan templates error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plan templates' },
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
    const {
      branchId,
      name,
      description,
      planType,
      category,
      difficulty,
      duration,
      visibility,
      content,
      tags,
      isAiGenerated,
    } = body

    // Validate required fields
    if (!name || !planType || !category || !difficulty || !duration || !content) {
      return NextResponse.json(
        { error: 'Name, plan type, category, difficulty, duration, and content are required' },
        { status: 400 }
      )
    }

    const template = await PlanService.createTemplate({
      tenantId,
      branchId,
      createdBy: userId,
      name,
      description,
      planType,
      category,
      difficulty,
      duration: parseInt(duration),
      visibility,
      content,
      tags: tags || [],
      isAiGenerated: isAiGenerated || false,
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error('Create plan template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create plan template' },
      { status: 500 }
    )
  }
}