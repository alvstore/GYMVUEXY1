import { prisma } from '../prisma';
import { PermissionRowType } from '@/types/apps/permissionTypes';

export class PermissionService {
  /**
   * Get all permissions from the database
   */
  static async getAllPermissions(): Promise<PermissionRowType[]> {
    try {
      const permissions = await prisma.permission.findMany({
        include: {
          roles: {
            select: {
              name: true
            }
          }
        }
      });

      return permissions.map(permission => ({
        id: permission.id,
        name: permission.name,
        createdDate: permission.createdAt.toISOString(),
        assignedTo: permission.roles.map(role => role.name)
      }));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw new Error('Failed to fetch permissions');
    }
  }

  /**
   * Get permissions by role
   */
  static async getPermissionsByRole(roleName: string): Promise<PermissionRowType[]> {
    try {
      const role = await prisma.role.findUnique({
        where: { name: roleName },
        include: {
          permissions: true
        }
      });

      if (!role) {
        return [];
      }

      return role.permissions.map(permission => ({
        id: permission.id,
        name: permission.name,
        createdDate: permission.createdAt.toISOString(),
        assignedTo: [roleName]
      }));
    } catch (error) {
      console.error(`Error fetching permissions for role ${roleName}:`, error);
      throw new Error(`Failed to fetch permissions for role ${roleName}`);
    }
  }

  /**
   * Check if a user has a specific permission
   */
  static async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              permissions: {
                where: { name: permissionName }
              }
            }
          }
        }
      });

      if (!user) return false;

      // Check if any role has the required permission
      return user.roles.some(role => 
        role.permissions.some(permission => permission.name === permissionName)
      );
    } catch (error) {
      console.error(`Error checking permission ${permissionName} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Seed initial permissions and roles
   */
  static async seedPermissions() {
    const permissions: PermissionRowType[] = [
      // System Permissions (Super Admin only)
      {
        id: 100,
        name: 'System Settings Management',
        createdDate: new Date('2023-01-01').toISOString(),
        assignedTo: ['super-admin']
      },
      {
        id: 101,
        name: 'Tenant Management',
        createdDate: new Date('2023-01-01').toISOString(),
        assignedTo: ['super-admin']
      },
      // ... (other permissions from your mock data)
    ];

    try {
      // Create permissions
      for (const perm of permissions) {
        await prisma.permission.upsert({
          where: { id: perm.id },
          update: { name: perm.name },
          create: {
            id: perm.id,
            name: perm.name,
            createdAt: new Date(perm.createdDate)
          }
        });
      }

      // Assign permissions to roles
      for (const perm of permissions) {
        const roleNames = Array.isArray(perm.assignedTo) ? perm.assignedTo : [perm.assignedTo];
        
        for (const roleName of roleNames) {
          await prisma.role.upsert({
            where: { name: roleName },
            update: {
              permissions: {
                connect: { id: perm.id }
              }
            },
            create: {
              name: roleName,
              description: `${roleName} role`,
              permissions: {
                connect: { id: perm.id }
              }
            }
          });
        }
      }

      console.log('✅ Permissions and roles seeded successfully');
    } catch (error) {
      console.error('Error seeding permissions:', error);
      throw error;
    }
  }
}
