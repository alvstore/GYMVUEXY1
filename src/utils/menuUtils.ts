import type {
  VerticalMenuDataType,
  VerticalSectionDataType,
  VerticalSubMenuDataType,
  VerticalMenuItemDataType
} from '@/types/menuTypes'

/**
 * Check if user has any of the required permissions
 */
export const hasAnyPermission = (userPermissions: string[], requiredPermissions?: string[]): boolean => {
  // If no permissions required, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true
  }

  // Super admin has all permissions
  if (userPermissions.includes('*')) {
    return true
  }

  // Check if user has any of the required permissions
  return requiredPermissions.some(permission => {
    // Check exact permission
    if (userPermissions.includes(permission)) {
      return true
    }

    // Check wildcard permissions (e.g., 'members.*' for 'members.view')
    const [module] = permission.split('.')
    if (userPermissions.includes(`${module}.*`)) {
      return true
    }

    return false
  })
}

/**
 * Filter menu items based on user permissions
 */
export const filterMenuByPermissions = (
  menuData: VerticalMenuDataType[],
  userPermissions: string[]
): VerticalMenuDataType[] => {
  return menuData
    .map(item => {
      const menuSectionItem = item as VerticalSectionDataType
      const subMenuItem = item as VerticalSubMenuDataType
      const menuItem = item as VerticalMenuItemDataType

      // Handle menu sections
      if (menuSectionItem.isSection) {
        // Check section permissions
        if (!hasAnyPermission(userPermissions, menuSectionItem.permissions)) {
          return null
        }

        // Filter children
        const filteredChildren = menuSectionItem.children
          ? filterMenuByPermissions(menuSectionItem.children, userPermissions)
          : []

        // Only include section if it has visible children
        if (filteredChildren.length === 0) {
          return null
        }

        return {
          ...menuSectionItem,
          children: filteredChildren
        }
      }

      // Handle sub menus
      if (subMenuItem.children) {
        // Check submenu permissions
        if (!hasAnyPermission(userPermissions, subMenuItem.permissions)) {
          return null
        }

        // Filter children
        const filteredChildren = subMenuItem.children
          ? filterMenuByPermissions(subMenuItem.children, userPermissions)
          : []

        // Only include submenu if it has visible children
        if (filteredChildren.length === 0) {
          return null
        }

        return {
          ...subMenuItem,
          children: filteredChildren
        }
      }

      // Handle menu items
      if (!hasAnyPermission(userPermissions, menuItem.permissions)) {
        return null
      }

      return menuItem
    })
    .filter((item): item is VerticalMenuDataType => item !== null)
}
