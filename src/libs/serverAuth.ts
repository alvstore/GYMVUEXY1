import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { RBACService } from '@/libs/rbac'

export interface AuthContext {
  userId: string
  tenantId: string
  branchId?: string | null
  permissions: string[]
  roles: string[]
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  const user = session.user as any
  
  if (!user.id && !user.sub) {
    throw new Error('Session missing user ID')
  }
  
  if (!user.tenantId) {
    throw new Error('Session missing tenant ID - tenant isolation required')
  }
  
  if (!user.permissions || !Array.isArray(user.permissions)) {
    throw new Error('Session missing permissions - RBAC enforcement required')
  }
  
  if (!user.roles || !Array.isArray(user.roles)) {
    throw new Error('Session missing roles - RBAC enforcement required')
  }
  
  return {
    userId: user.id || user.sub,
    tenantId: user.tenantId,
    branchId: user.branchId || null,
    permissions: user.permissions,
    roles: user.roles,
  }
}

export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext()
  
  if (!context) {
    throw new Error('Unauthorized')
  }
  
  return context
}

export async function requirePermission(permission: string): Promise<AuthContext> {
  const context = await requireAuth()
  
  if (!RBACService.hasPermission(
    { id: context.userId, tenantId: context.tenantId, permissions: context.permissions },
    permission
  )) {
    throw new Error(`Missing permission: ${permission}`)
  }
  
  return context
}

export function hasPermission(context: AuthContext, permission: string): boolean {
  return RBACService.hasPermission(
    { id: context.userId, tenantId: context.tenantId, permissions: context.permissions },
    permission
  )
}
