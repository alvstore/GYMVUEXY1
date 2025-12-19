// Roles & Permissions Server Actions

'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

export async function getRoles() {
  const context = await requirePermission('roles.view')

  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          userAssignments: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return roles
}

export async function getPermissions() {
  const context = await requirePermission('roles.view')

  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: 'asc' }, { action: 'asc' }],
  })

  // Group by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = []
    }
    acc[permission.module].push(permission)
    return acc
  }, {} as Record<string, typeof permissions>)

  return groupedPermissions
}

export async function getRole(id: string) {
  const context = await requirePermission('roles.view')

  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      userAssignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!role) {
    throw new Error('Role not found')
  }

  return role
}

export async function createRole(data: {
  name: string
  description?: string
  permissionIds: string[]
}) {
  const context = await requirePermission('roles.create')

  const role = await prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      permissions: {
        create: data.permissionIds.map(permissionId => ({
          permissionId,
        })),
      },
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'CREATE',
    entity: 'Role',
    entityId: role.id,
    metadata: { name: data.name, permissionCount: data.permissionIds.length },
  })

  return role
}

export async function updateRole(
  id: string,
  data: {
    name?: string
    description?: string
    permissionIds?: string[]
  }
) {
  const context = await requirePermission('roles.update')

  const role = await prisma.role.findUnique({
    where: { id },
  })

  if (!role) {
    throw new Error('Role not found')
  }

  if (role.isSystem) {
    throw new Error('Cannot update system roles')
  }

  const updated = await prisma.role.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.permissionIds && {
        permissions: {
          deleteMany: {},
          create: data.permissionIds.map(permissionId => ({
            permissionId,
          })),
        },
      }),
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'UPDATE',
    entity: 'Role',
    entityId: id,
    metadata: data,
  })

  return updated
}

export async function deleteRole(id: string) {
  const context = await requirePermission('roles.delete')

  const role = await prisma.role.findUnique({
    where: { id },
  })

  if (!role) {
    throw new Error('Role not found')
  }

  if (role.isSystem) {
    throw new Error('Cannot delete system roles')
  }

  await prisma.role.delete({
    where: { id },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'DELETE',
    entity: 'Role',
    entityId: id,
    metadata: { name: role.name },
  })

  return { success: true }
}

export async function assignRole(data: {
  userId: string
  roleId: string
  branchId?: string
}) {
  const context = await requirePermission('roles.assign')

  const assignment = await prisma.userRoleAssignment.create({
    data: {
      userId: data.userId,
      roleId: data.roleId,
      branchId: data.branchId,
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'ASSIGN',
    entity: 'UserRoleAssignment',
    entityId: assignment.id,
    metadata: data,
  })

  return assignment
}

export async function unassignRole(data: {
  userId: string
  roleId: string
  branchId?: string
}) {
  const context = await requirePermission('roles.assign')

  await prisma.userRoleAssignment.deleteMany({
    where: {
      userId: data.userId,
      roleId: data.roleId,
      branchId: data.branchId,
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'UNASSIGN',
    entity: 'UserRoleAssignment',
    entityId: `${data.userId}-${data.roleId}`,
    metadata: data,
  })

  return { success: true }
}
