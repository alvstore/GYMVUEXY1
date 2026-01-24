export type StaffRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'TRAINER'

export interface PermissionGate {
  canAccess: boolean
  reason?: string
}

const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  ADMIN: [
    '*',
    'financial.*',
    'reports.*',
    'settings.*',
    'system.*',
    'analytics.*',
    'export.*',
  ],
  MANAGER: [
    'members.*',
    'memberships.*',
    'lockers.*',
    'bookings.*',
    'bookings.override',
    'memberships.freeze',
    'memberships.unfreeze',
    'attendance.*',
    'classes.*',
    'staff.view',
    'reports.branch',
    'analytics.branch',
  ],
  STAFF: [
    'members.view',
    'members.create',
    'attendance.*',
    'checkin.*',
    'bookings.view',
    'bookings.create',
    'bookings.markAttended',
    'lockers.view',
    'classes.view',
  ],
  TRAINER: [
    'classes.view',
    'classes.schedule',
    'classes.attendees',
    'members.view',
    'attendance.view',
    'training.*',
  ],
}

const ACTION_PERMISSIONS: Record<string, string[]> = {
  viewFinancialReports: ['financial.view', 'reports.financial', 'analytics.revenue'],
  manageSystemSettings: ['settings.*', 'system.*'],
  overrideBookings: ['bookings.override', 'bookings.*'],
  processMembershipFreeze: ['memberships.freeze', 'memberships.*'],
  assignLockers: ['lockers.update', 'lockers.*'],
  performCheckins: ['checkin.*', 'attendance.create'],
  viewClassSchedules: ['classes.view', 'classes.*'],
  manageClasses: ['classes.create', 'classes.update', 'classes.delete', 'classes.*'],
  viewMemberProfiles: ['members.view', 'members.*'],
  createMembers: ['members.create', 'members.*'],
  viewAttendance: ['attendance.view', 'attendance.*'],
  markAttendance: ['attendance.create', 'bookings.markAttended'],
  exportData: ['export.*', 'reports.export'],
  viewAnalytics: ['analytics.*', 'reports.*'],
  viewBranchAnalytics: ['analytics.branch', 'reports.branch'],
}

export function hasRolePermission(role: StaffRole, requiredPermission: string): boolean {
  const rolePerms = ROLE_PERMISSIONS[role] || []
  
  if (rolePerms.includes('*')) {
    return true
  }

  if (rolePerms.includes(requiredPermission)) {
    return true
  }

  const [module] = requiredPermission.split('.')
  if (rolePerms.includes(`${module}.*`)) {
    return true
  }

  return false
}

export function canPerformAction(role: StaffRole, action: keyof typeof ACTION_PERMISSIONS): PermissionGate {
  const requiredPerms = ACTION_PERMISSIONS[action] || []
  
  const hasAccess = requiredPerms.some(perm => hasRolePermission(role, perm))
  
  return {
    canAccess: hasAccess,
    reason: hasAccess ? undefined : `${role} role does not have permission for this action`,
  }
}

export function getRoleDisplayName(role: StaffRole): string {
  const displayNames: Record<StaffRole, string> = {
    ADMIN: 'Administrator',
    MANAGER: 'Branch Manager',
    STAFF: 'Front Desk Staff',
    TRAINER: 'Trainer',
  }
  return displayNames[role] || role
}

export function getRoleCapabilities(role: StaffRole): string[] {
  const capabilities: Record<StaffRole, string[]> = {
    ADMIN: [
      'Full system access',
      'Financial reports and analytics',
      'System settings management',
      'User and role management',
      'Data export',
    ],
    MANAGER: [
      'Member management',
      'Booking overrides',
      'Membership freeze/unfreeze',
      'Locker assignments',
      'Branch-level reports',
      'Staff supervision',
    ],
    STAFF: [
      'Member check-ins',
      'View member profiles',
      'Create new members',
      'View and create bookings',
      'Mark attendance',
    ],
    TRAINER: [
      'View class schedules',
      'View class attendees',
      'View member profiles',
      'Session tracking',
    ],
  }
  return capabilities[role] || []
}

export function checkMultiplePermissions(
  role: StaffRole, 
  permissions: string[], 
  requireAll: boolean = false
): PermissionGate {
  if (requireAll) {
    const allHave = permissions.every(perm => hasRolePermission(role, perm))
    return {
      canAccess: allHave,
      reason: allHave ? undefined : `Missing required permissions for ${role} role`,
    }
  } else {
    const hasAny = permissions.some(perm => hasRolePermission(role, perm))
    return {
      canAccess: hasAny,
      reason: hasAny ? undefined : `${role} role lacks any of the required permissions`,
    }
  }
}

export { ROLE_PERMISSIONS, ACTION_PERMISSIONS }
