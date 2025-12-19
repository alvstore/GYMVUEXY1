import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';

interface Context {
  params: {
    userId: string;
  };
}

export async function GET(_: Request, { params }: Context) {
  try {
    const { userId } = params;

    // Get user with their roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            permissions: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Collect all unique permissions from user's roles
    const permissions = new Set<string>();
    
    user.roles.forEach(role => {
      role.permissions.forEach(permission => {
        permissions.add(permission.name);
      });
    });

    return NextResponse.json({
      permissions: Array.from(permissions)
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user permissions' },
      { status: 500 }
    );
  }
}
