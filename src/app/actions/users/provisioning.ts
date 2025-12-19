'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function provisionUser(data: {
  email: string
  name: string
  phone?: string
  password: string
  roleIds: string[]
  branchId?: string
}) {
  const context = await requirePermission('users.create')

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Get roles to verify they exist
    const roles = await prisma.role.findMany({
      where: { id: { in: data.roleIds } },
    })

    if (roles.length !== data.roleIds.length) {
      throw new Error('One or more roles not found')
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        passwordHash: hashedPassword,
        tenantId: context.tenantId,
        branchId: data.branchId || context.branchId,
        isActive: true,
        emailVerified: null,
        image: null,
        roleAssignments: {
          create: data.roleIds.map((roleId) => ({
            roleId,
          })),
        },
      },
      include: {
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Log audit
    await AuditLogger.log({
      userId: context.userId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      action: 'User.provisioned',
      resource: 'User',
      resourceId: user.id,
      newValues: {
        email: user.email,
        name: user.name,
        roles: data.roleIds,
      },
    })

    revalidatePath('/apps/users')
    revalidatePath('/settings/users')

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        roles: user.roleAssignments.map((ur) => ur.role.name),
      },
    }
  } catch (error) {
    console.error('Error provisioning user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to provision user',
    }
  }
}

export async function getUsers(filters?: { branchId?: string; roleId?: string }) {
  const context = await requirePermission('users.view')

  const where: any = {
    tenantId: context.tenantId,
    isActive: true,
  }

  if (filters?.branchId) {
    where.branchId = filters.branchId
  } else if (context.branchId) {
    where.branchId = context.branchId
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      roleAssignments: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      staffMember: {
        select: {
          id: true,
          employeeId: true,
          role: true,
          department: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Apply role filter if specified
  if (filters?.roleId) {
    return users.filter((user) => user.roleAssignments.some((ur) => ur.roleId === filters.roleId))
  }

  return users
}

export async function assignRolesToUser(userId: string, roleIds: string[]) {
  const context = await requirePermission('users.manage')

  try {
    // Verify user exists and belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: context.tenantId,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Verify all roles exist
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    })

    if (roles.length !== roleIds.length) {
      throw new Error('One or more roles not found')
    }

    // Remove existing roles
    await prisma.userRoleAssignment.deleteMany({
      where: { userId },
    })

    // Assign new roles
    await prisma.userRoleAssignment.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
      })),
    })

    await AuditLogger.log({
      userId: context.userId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      action: 'User.rolesAssigned',
      resource: 'User',
      resourceId: userId,
      newValues: {
        roles: roleIds,
      },
    })

    revalidatePath('/apps/users')

    return { success: true }
  } catch (error) {
    console.error('Error assigning roles:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign roles',
    }
  }
}

export async function deactivateUser(userId: string) {
  const context = await requirePermission('users.deactivate')

  try {
    const user = await prisma.user.update({
      where: {
        id: userId,
        tenantId: context.tenantId,
      },
      data: {
        isActive: false,
      },
    })

    await AuditLogger.log({
      userId: context.userId,
      tenantId: context.tenantId,
      branchId: context.branchId,
      action: 'User.deactivated',
      resource: 'User',
      resourceId: user.id,
      newValues: {
        email: user.email,
        isActive: false,
      },
    })

    revalidatePath('/apps/users')

    return { success: true }
  } catch (error) {
    console.error('Error deactivating user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate user',
    }
  }
}
