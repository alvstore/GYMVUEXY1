import { NextRequest, NextResponse } from 'next/server'
import { AccessControlService } from '@/lib/services/accessControlService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      branchId,
      roomId,
      deviceId,
      memberId,
      userId,
      accessMethod,
      cardId,
      biometricId,
    } = body

    // Validate required fields
    if (!branchId || !roomId || !deviceId || !accessMethod) {
      return NextResponse.json(
        { error: 'Branch ID, room ID, device ID, and access method are required' },
        { status: 400 }
      )
    }

    if (!memberId && !userId) {
      return NextResponse.json(
        { error: 'Either member ID or user ID is required' },
        { status: 400 }
      )
    }

    const result = await AccessControlService.processAccess({
      branchId,
      roomId,
      deviceId,
      memberId,
      userId,
      accessMethod,
      cardId,
      biometricId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Access check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process access request' },
      { status: 500 }
    )
  }
}