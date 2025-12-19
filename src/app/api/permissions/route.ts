import { NextResponse } from 'next/server';
import { PermissionService } from '@/libs/services/permissionService';

export async function GET() {
  try {
    const permissions = await PermissionService.getAllPermissions();
    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
