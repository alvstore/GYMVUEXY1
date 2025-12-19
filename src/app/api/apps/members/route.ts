import { NextRequest, NextResponse } from 'next/server'
import { MemberService } from '@/lib/services/memberService'
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'members.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const membershipStatus = searchParams.get('membershipStatus') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await MemberService.getMembers({
      branchId,
      status: status as any,
      search,
      membershipStatus: membershipStatus as any,
    }, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch members' },
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
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'members.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      branchId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      emergencyPhone,
      height,
      weight,
      bloodGroup,
      medicalConditions,
      allergies,
      foodPreference,
      activityLevel,
      notes,
    } = body

    // Validate required fields
    if (!branchId || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Branch ID, first name, last name, and phone are required' },
        { status: 400 }
      )
    }

    const member = await MemberService.createMember({
      branchId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      address,
      emergencyContact,
      emergencyPhone,
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      bloodGroup,
      medicalConditions,
      allergies,
      foodPreference,
      activityLevel,
      notes,
    }, tenantId)

    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    console.error('Create member error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create member' },
      { status: 500 }
    )
  }
}