import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'

// Types
type Permission = {
  id: number
  name: string
  createdDate: string
  assignedTo: string | string[]
}

/**
 * Fetches permissions for the current user
 */
const fetchUserPermissions = async (userId: string | undefined): Promise<string[]> => {
  if (!userId) return []

  try {
    const response = await fetch(`/api/users/${userId}/permissions`)
    if (!response.ok) {
      throw new Error('Failed to fetch permissions')
    }
    const data = await response.json()
    return data.permissions || []
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return []
  }
}

/**
 * Hook to get user permissions
 */
export const usePermissions = () => {
  const { user } = useAuth()
  const userId = user?.id

  const { data: permissions = [] } = useQuery({
    queryKey: ['userPermissions', userId],
    queryFn: () => fetchUserPermissions(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return permissions
}

/**
 * Hook to check if user has a specific permission
 */
export const useHasPermission = (permission: string): boolean => {
  const permissions = usePermissions()

  return useMemo(() => {
    // Super admin has all permissions
    if (permissions.includes('*')) {
      return true
    }

    // Check exact permission
    if (permissions.includes(permission)) {
      return true
    }

    // Check wildcard permissions (e.g., 'members.*' for 'members.view')
    const [module] = permission.split('.')
    if (permissions.includes(`${module}.*`)) {
      return true
    }

    return false
  }, [permissions, permission])
}

/**
 * Hook to check if user has any of the specified permissions
 */
export const useHasAnyPermission = (requiredPermissions: string[]): boolean => {
  const permissions = usePermissions()

  return useMemo(() => {
    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    // Super admin has all permissions
    if (permissions.includes('*')) {
      return true
    }

    // Check if user has any of the required permissions
    return requiredPermissions.some(permission => {
      // Check exact permission
      if (permissions.includes(permission)) {
        return true
      }

      // Check wildcard permissions
      const [module] = permission.split('.')
      if (permissions.includes(`${module}.*`)) {
        return true
      }

      return false
    })
  }, [permissions, requiredPermissions])
}

/**
 * Hook to check if user has all of the specified permissions
 */
export const useHasAllPermissions = (requiredPermissions: string[]): boolean => {
  const permissions = usePermissions()

  return useMemo(() => {
    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    // Super admin has all permissions
    if (permissions.includes('*')) {
      return true
    }

    // Check if user has all of the required permissions
    return requiredPermissions.every(permission => {
      // Check exact permission
      if (permissions.includes(permission)) {
        return true
      }

      // Check wildcard permissions
      const [module] = permission.split('.')
      if (permissions.includes(`${module}.*`)) {
        return true
      }

      return false
    })
  }, [permissions, requiredPermissions])
}
