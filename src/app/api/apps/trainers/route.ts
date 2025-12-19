import { NextRequest, NextResponse } from 'next/server'
import { TrainerService } from '@/libs/services/trainerService'
import { RBACService } from '@/libs/rbac'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'trainers.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const specialization = searchParams.get('specialization') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const availableOn = searchParams.get('availableOn') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await TrainerService.getTrainers({
      branchId,
      specialization: specialization as any,
      status: status as any,
      search,
      availableOn: availableOn as any,
    }, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get trainers error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trainers' },
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'trainers.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      userId: trainerUserId,
      branchId,
      bio,
      experience,
      certifications,
      specializations,
      languages,
    } = body

    // Validate required fields
    if (!trainerUserId || !branchId) {
      return NextResponse.json(
        { error: 'User ID and branch ID are required' },
        { status: 400 }
      )
    }

    const trainer = await TrainerService.createTrainer({
      userId: trainerUserId,
      branchId,
      bio,
      experience: experience ? parseInt(experience) : undefined,
      certifications: certifications || [],
      specializations: specializations || [],
      languages: languages || [],
    }, tenantId)

    return NextResponse.json(trainer, { status: 201 })
  } catch (error: any) {
    console.error('Create trainer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create trainer' },
      { status: 500 }
    )
  }
}