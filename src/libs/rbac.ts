import { prisma } from './prisma';

export interface UserWithPermissions {
  id: string;
  tenantId: string;
  branchId?: string | null;
  permissions: string[];
}

export class RBACService {
  /**
   * Check if user has a specific permission
   */
  static hasPermission(
    user: UserWithPermissions,
    permission: string,
    branchId?: string
  ): boolean {
    // Super admin has all permissions
    if (user.permissions.includes('*') || user.permissions.includes('super_admin.*')) {
      return true;
    }

    // Check exact permission
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Check wildcard permissions (e.g., 'members.*' for 'members.create')
    const [module] = permission.split('.');
    if (user.permissions.includes(`${module}.*`)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(
    user: UserWithPermissions,
    permissions: string[],
    branchId?: string
  ): boolean {
    return permissions.some(permission =>
      this.hasPermission(user, permission, branchId)
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  static hasAllPermissions(
    user: UserWithPermissions,
    permissions: string[],
    branchId?: string
  ): boolean {
    return permissions.every(permission =>
      this.hasPermission(user, permission, branchId)
    );
  }

  /**
   * Get user permissions for a specific branch
   */
  static async getUserPermissions(userId: string, branchId?: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          where: branchId ? { branchId } : {},
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
    });

    if (!user) {
      return [];
    }

    const permissions = user.roleAssignments.flatMap(assignment =>
      assignment.role.permissions.map(rp => rp.permission.name)
    );

    return [...new Set(permissions)]; // Remove duplicates
  }

  /**
   * Seed default roles and permissions
   */
  static async seedRolesAndPermissions() {
    // Define default permissions
    const permissions = [
      // Super Admin
      { name: '*', description: 'All permissions', module: 'system', action: 'all' },
      
      // Tenant Management
      { name: 'tenants.view', description: 'View tenants', module: 'tenants', action: 'read' },
      { name: 'tenants.create', description: 'Create tenants', module: 'tenants', action: 'create' },
      { name: 'tenants.update', description: 'Update tenants', module: 'tenants', action: 'update' },
      { name: 'tenants.delete', description: 'Delete tenants', module: 'tenants', action: 'delete' },
      
      // Branch Management
      { name: 'branches.view', description: 'View branches', module: 'branches', action: 'read' },
      { name: 'branches.create', description: 'Create branches', module: 'branches', action: 'create' },
      { name: 'branches.update', description: 'Update branches', module: 'branches', action: 'update' },
      { name: 'branches.delete', description: 'Delete branches', module: 'branches', action: 'delete' },
      
      // User Management
      { name: 'users.view', description: 'View users', module: 'users', action: 'read' },
      { name: 'users.create', description: 'Create users', module: 'users', action: 'create' },
      { name: 'users.update', description: 'Update users', module: 'users', action: 'update' },
      { name: 'users.delete', description: 'Delete users', module: 'users', action: 'delete' },
      
      // Role Management
      { name: 'roles.view', description: 'View roles', module: 'roles', action: 'read' },
      { name: 'roles.create', description: 'Create roles', module: 'roles', action: 'create' },
      { name: 'roles.update', description: 'Update roles', module: 'roles', action: 'update' },
      { name: 'roles.delete', description: 'Delete roles', module: 'roles', action: 'delete' },
      
      // Member Management
      { name: 'members.view', description: 'View members', module: 'members', action: 'read' },
      { name: 'members.create', description: 'Create members', module: 'members', action: 'create' },
      { name: 'members.update', description: 'Update members', module: 'members', action: 'update' },
      { name: 'members.delete', description: 'Delete members', module: 'members', action: 'delete' },
      
      // Membership Management
      { name: 'memberships.view', description: 'View memberships', module: 'memberships', action: 'read' },
      { name: 'memberships.create', description: 'Create memberships', module: 'memberships', action: 'create' },
      { name: 'memberships.update', description: 'Update memberships', module: 'memberships', action: 'update' },
      { name: 'memberships.delete', description: 'Delete memberships', module: 'memberships', action: 'delete' },
      
      // Membership Plans
      { name: 'membership_plans.view', description: 'View membership plans', module: 'membership_plans', action: 'read' },
      { name: 'membership_plans.create', description: 'Create membership plans', module: 'membership_plans', action: 'create' },
      { name: 'membership_plans.update', description: 'Update membership plans', module: 'membership_plans', action: 'update' },
      { name: 'membership_plans.delete', description: 'Delete membership plans', module: 'membership_plans', action: 'delete' },
      
      // Attendance Management
      { name: 'attendance.view', description: 'View attendance records', module: 'attendance', action: 'read' },
      { name: 'attendance.create', description: 'Create attendance records', module: 'attendance', action: 'create' },
      { name: 'attendance.update', description: 'Update attendance records', module: 'attendance', action: 'update' },
      { name: 'attendance.delete', description: 'Delete attendance records', module: 'attendance', action: 'delete' },
      
      // Room Management
      { name: 'rooms.view', description: 'View rooms', module: 'rooms', action: 'read' },
      { name: 'rooms.create', description: 'Create rooms', module: 'rooms', action: 'create' },
      { name: 'rooms.update', description: 'Update rooms', module: 'rooms', action: 'update' },
      { name: 'rooms.delete', description: 'Delete rooms', module: 'rooms', action: 'delete' },
      
      // Access Control
      { name: 'access_control.view', description: 'View access control', module: 'access_control', action: 'read' },
      { name: 'access_control.manage', description: 'Manage access control', module: 'access_control', action: 'update' },
      
      // Trainer Management
      { name: 'trainers.view', description: 'View trainers', module: 'trainers', action: 'read' },
      { name: 'trainers.create', description: 'Create trainers', module: 'trainers', action: 'create' },
      { name: 'trainers.update', description: 'Update trainers', module: 'trainers', action: 'update' },
      { name: 'trainers.delete', description: 'Delete trainers', module: 'trainers', action: 'delete' },
      
      // Trainer Assignments
      { name: 'trainer_assignments.view', description: 'View trainer assignments', module: 'trainer_assignments', action: 'read' },
      { name: 'trainer_assignments.create', description: 'Create trainer assignments', module: 'trainer_assignments', action: 'create' },
      { name: 'trainer_assignments.update', description: 'Update trainer assignments', module: 'trainer_assignments', action: 'update' },
      { name: 'trainer_assignments.approve', description: 'Approve trainer assignments', module: 'trainer_assignments', action: 'approve' },
      
      // Plans Management
      { name: 'plans.view', description: 'View plans', module: 'plans', action: 'read' },
      { name: 'plans.create', description: 'Create plans', module: 'plans', action: 'create' },
      { name: 'plans.update', description: 'Update plans', module: 'plans', action: 'update' },
      { name: 'plans.delete', description: 'Delete plans', module: 'plans', action: 'delete' },
      { name: 'plans.assign', description: 'Assign plans to members', module: 'plans', action: 'assign' },
      
      // Finance Management
      { name: 'finance.view', description: 'View financial data', module: 'finance', action: 'read' },
      { name: 'finance.create', description: 'Create financial records', module: 'finance', action: 'create' },
      { name: 'finance.update', description: 'Update financial records', module: 'finance', action: 'update' },
      { name: 'finance.delete', description: 'Delete financial records', module: 'finance', action: 'delete' },
      
      // Invoice Management
      { name: 'invoices.view', description: 'View invoices', module: 'invoices', action: 'read' },
      { name: 'invoices.create', description: 'Create invoices', module: 'invoices', action: 'create' },
      { name: 'invoices.update', description: 'Update invoices', module: 'invoices', action: 'update' },
      { name: 'invoices.delete', description: 'Delete invoices', module: 'invoices', action: 'delete' },
      
      // Product Management
      { name: 'products.view', description: 'View products', module: 'products', action: 'read' },
      { name: 'products.create', description: 'Create products', module: 'products', action: 'create' },
      { name: 'products.update', description: 'Update products', module: 'products', action: 'update' },
      { name: 'products.delete', description: 'Delete products', module: 'products', action: 'delete' },
      
      // POS System
      { name: 'pos.view', description: 'View POS', module: 'pos', action: 'read' },
      { name: 'pos.create', description: 'Process POS sales', module: 'pos', action: 'create' },
      
      // Expense Management
      { name: 'expenses.view', description: 'View expenses', module: 'expenses', action: 'read' },
      { name: 'expenses.create', description: 'Create expenses', module: 'expenses', action: 'create' },
      { name: 'expenses.approve', description: 'Approve expenses', module: 'expenses', action: 'approve' },
      
      // Communication Management
      { name: 'communication.view', description: 'View communication settings', module: 'communication', action: 'read' },
      { name: 'communication.create', description: 'Create templates and campaigns', module: 'communication', action: 'create' },
      { name: 'communication.update', description: 'Update templates and campaigns', module: 'communication', action: 'update' },
      { name: 'communication.delete', description: 'Delete templates and campaigns', module: 'communication', action: 'delete' },
      { name: 'communication.send', description: 'Send messages', module: 'communication', action: 'send' },
      { name: 'communication.manage', description: 'Manage communication settings', module: 'communication', action: 'manage' },
      
      // Announcement Management
      { name: 'announcements.view', description: 'View announcements', module: 'announcements', action: 'read' },
      { name: 'announcements.create', description: 'Create announcements', module: 'announcements', action: 'create' },
      { name: 'announcements.update', description: 'Update announcements', module: 'announcements', action: 'update' },
      { name: 'announcements.delete', description: 'Delete announcements', module: 'announcements', action: 'delete' },
      
      // Feedback Management
      { name: 'feedback.view', description: 'View feedback', module: 'feedback', action: 'read' },
      { name: 'feedback.create', description: 'Create feedback', module: 'feedback', action: 'create' },
      { name: 'feedback.respond', description: 'Respond to feedback', module: 'feedback', action: 'respond' },
      
      // Reports & Analytics
      { name: 'reports.view', description: 'View reports', module: 'reports', action: 'read' },
      { name: 'reports.create', description: 'Create custom reports', module: 'reports', action: 'create' },
      { name: 'reports.export', description: 'Export reports', module: 'reports', action: 'export' },
      
      // Audit Management
      { name: 'audit.view', description: 'View audit logs', module: 'audit', action: 'read' },
      { name: 'audit.export', description: 'Export audit logs', module: 'audit', action: 'export' },
      
      // Referral Management
      { name: 'referrals.view', description: 'View referrals', module: 'referrals', action: 'read' },
      { name: 'referrals.create', description: 'Create referrals', module: 'referrals', action: 'create' },
      { name: 'referrals.process', description: 'Process referral bonuses', module: 'referrals', action: 'process' },
      
      // Measurement Management
      { name: 'measurements.view', description: 'View measurements', module: 'measurements', action: 'read' },
      { name: 'measurements.create', description: 'Create measurements', module: 'measurements', action: 'create' },
      { name: 'measurements.update', description: 'Update measurements', module: 'measurements', action: 'update' },
      
      // Locker Management
      { name: 'lockers.view', description: 'View lockers', module: 'lockers', action: 'read' },
      { name: 'lockers.create', description: 'Create lockers', module: 'lockers', action: 'create' },
      { name: 'lockers.update', description: 'Update lockers', module: 'lockers', action: 'update' },
      { name: 'lockers.delete', description: 'Delete lockers', module: 'lockers', action: 'delete' },
      { name: 'lockers.assign', description: 'Assign lockers to members', module: 'lockers', action: 'assign' },
      
      // Inventory Management
      { name: 'inventory.view', description: 'View inventory', module: 'inventory', action: 'read' },
      { name: 'inventory.create', description: 'Create inventory items', module: 'inventory', action: 'create' },
      { name: 'inventory.update', description: 'Update inventory', module: 'inventory', action: 'update' },
      { name: 'inventory.delete', description: 'Delete inventory items', module: 'inventory', action: 'delete' },
      { name: 'inventory.stock_adjust', description: 'Adjust stock levels', module: 'inventory', action: 'adjust' },
      
      // Vendor Management
      { name: 'vendors.view', description: 'View vendors', module: 'vendors', action: 'read' },
      { name: 'vendors.create', description: 'Create vendors', module: 'vendors', action: 'create' },
      { name: 'vendors.update', description: 'Update vendors', module: 'vendors', action: 'update' },
      { name: 'vendors.delete', description: 'Delete vendors', module: 'vendors', action: 'delete' },
      
      // Class Management
      { name: 'classes.view', description: 'View classes', module: 'classes', action: 'read' },
      { name: 'classes.create', description: 'Create classes', module: 'classes', action: 'create' },
      { name: 'classes.update', description: 'Update classes', module: 'classes', action: 'update' },
      { name: 'classes.delete', description: 'Delete classes', module: 'classes', action: 'delete' },
      { name: 'classes.schedule', description: 'Schedule classes', module: 'classes', action: 'schedule' },
      { name: 'classes.book', description: 'Book classes', module: 'classes', action: 'book' },
      { name: 'classes.cancel', description: 'Cancel class bookings', module: 'classes', action: 'cancel' },
      
      // Settings Management
      { name: 'settings.view', description: 'View settings', module: 'settings', action: 'read' },
      { name: 'settings.update', description: 'Update settings', module: 'settings', action: 'update' },
      { name: 'settings.payment.update', description: 'Update payment gateway settings', module: 'settings', action: 'payment_update' },
      { name: 'settings.templates.update', description: 'Update communication templates settings', module: 'settings', action: 'templates_update' },
      { name: 'settings.backup.manage', description: 'Manage backup settings and trigger backups', module: 'settings', action: 'backup_manage' },
      
      // Permission & Role Management (Advanced)
      { name: 'permissions.view', description: 'View permissions', module: 'permissions', action: 'read' },
      { name: 'permissions.manage', description: 'Manage permissions', module: 'permissions', action: 'manage' },
      { name: 'roles.manage', description: 'Manage roles and their permissions', module: 'roles', action: 'manage' },
      
      // Access & Doors Management
      { name: 'doors.view', description: 'View door access logs', module: 'doors', action: 'read' },
      { name: 'doors.manage', description: 'Manage door access controls', module: 'doors', action: 'manage' },
      
      // Checkout & Payment Processing
      { name: 'checkout.process', description: 'Process checkout and payments', module: 'checkout', action: 'process' },
      { name: 'payment.webhook', description: 'Handle payment gateway webhooks', module: 'payment', action: 'webhook' },
      
      // Payroll Management
      { name: 'payroll.view', description: 'View payroll', module: 'payroll', action: 'read' },
      { name: 'payroll.create', description: 'Create payroll entries', module: 'payroll', action: 'create' },
      { name: 'payroll.update', description: 'Update payroll', module: 'payroll', action: 'update' },
      { name: 'payroll.approve', description: 'Approve payroll', module: 'payroll', action: 'approve' },
      { name: 'payroll.process', description: 'Process payroll payments', module: 'payroll', action: 'process' },
      
      // Dashboard Access
      { name: 'dashboard.super_admin', description: 'Access Super Admin Dashboard', module: 'dashboard', action: 'read' },
      { name: 'dashboard.admin', description: 'Access Admin Dashboard', module: 'dashboard', action: 'read' },
    ];

    // Create permissions
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    }

    // Define default roles
    const roles = [
      {
        name: 'super_admin',
        description: 'Super Administrator with full system access',
        isSystem: true,
        permissions: ['*'],
      },
      {
        name: 'admin',
        description: 'Administrator with tenant-level access',
        isSystem: true,
        permissions: [
          'branches.view', 'branches.create', 'branches.update',
          'users.view', 'users.create', 'users.update',
          'roles.view', 'roles.create', 'roles.update',
          'members.view', 'members.create', 'members.update',
          'memberships.view', 'memberships.create', 'memberships.update',
          'membership_plans.view', 'membership_plans.create', 'membership_plans.update',
          'attendance.view', 'attendance.create', 'attendance.update',
          'rooms.view', 'rooms.create', 'rooms.update',
          'access_control.view', 'access_control.manage',
          'trainers.view', 'trainers.create', 'trainers.update',
          'trainer_assignments.view', 'trainer_assignments.create', 'trainer_assignments.update', 'trainer_assignments.approve',
          'plans.view', 'plans.create', 'plans.update', 'plans.delete', 'plans.assign',
          'finance.view', 'finance.create', 'finance.update',
          'finance.manage',
          'expenses.view', 'expenses.create', 'expenses.update', 'expenses.approve', 'expenses.delete',
          'invoices.view', 'invoices.create', 'invoices.update',
          'products.view', 'products.create', 'products.update',
          'pos.view', 'pos.create',
          'expenses.view', 'expenses.create', 'expenses.approve',
          'plans.view', 'plans.create', 'plans.update', 'plans.delete', 'plans.assign',
          'communication.view', 'communication.create', 'communication.update', 'communication.delete', 'communication.send', 'communication.manage',
          'announcements.view', 'announcements.create', 'announcements.update', 'announcements.delete',
          'feedback.view', 'feedback.create', 'feedback.respond',
          'lockers.view', 'lockers.create', 'lockers.update', 'lockers.delete', 'lockers.assign',
          'inventory.view', 'inventory.create', 'inventory.update', 'inventory.delete', 'inventory.stock_adjust',
          'vendors.view', 'vendors.create', 'vendors.update', 'vendors.delete',
          'reports.view', 'reports.create', 'reports.export',
          'audit.view', 'audit.export',
          'referrals.view', 'referrals.create', 'referrals.process',
          'measurements.view', 'measurements.create', 'measurements.update',
          'payroll.view', 'payroll.create', 'payroll.update', 'payroll.approve', 'payroll.process',
          'classes.view', 'classes.create', 'classes.update', 'classes.delete', 'classes.schedule', 'classes.book', 'classes.cancel',
          'settings.view', 'settings.update', 'settings.payment.update', 'settings.templates.update', 'settings.backup.manage',
          'permissions.view', 'permissions.manage',
          'roles.manage',
          'doors.view', 'doors.manage',
          'checkout.process',
          'payment.webhook',
          'dashboard.admin',
        ],
      },
      {
        name: 'trainer',
        description: 'Trainer with access to assigned members and sessions',
        isSystem: true,
        permissions: [
          'members.view', // Only assigned members
          'trainer_assignments.view', 'trainer_assignments.update',
          'plans.view', 'plans.create', 'plans.update', 'plans.assign',
          'plans.view', 'plans.create', 'plans.update', 'plans.assign',
          'training_sessions.view', 'training_sessions.create', 'training_sessions.update',
          'attendance.view', 'attendance.create',
          'lockers.view',
          'inventory.view',
          'measurements.view', 'measurements.create',
          'referrals.view',
        ],
      },
      {
        name: 'staff',
        description: 'Staff member with basic operational access',
        isSystem: true,
        permissions: [
          'members.view', 'members.create', 'members.update',
          'memberships.view', 'memberships.create',
          'attendance.view', 'attendance.create', 'attendance.update',
          'trainers.view',
          'trainer_assignments.view', 'trainer_assignments.create',
          'plans.view', 'plans.create',
          'products.view',
          'pos.view', 'pos.create',
          'invoices.view',
          'plans.view', 'plans.create',
          'communication.view', 'communication.send',
          'announcements.view',
          'feedback.view', 'feedback.create',
          'lockers.view', 'lockers.assign',
          'inventory.view', 'inventory.create', 'inventory.update', 'inventory.stock_adjust',
        ],
      },
      {
        name: 'member',
        description: 'Gym member with self-service access',
        isSystem: true,
        permissions: [
          'members.view', // Own profile only
          'trainer_assignments.view', // Own assignments only
          'plans.view', // Own plans only
          'plans.view', // Own plans only
          'attendance.view', // Own attendance only
          'invoices.view', // Own invoices only
          'classes.view', // View class schedules
          'classes.book', // Book classes
          'classes.cancel', // Cancel own bookings
          'measurements.view', // Own measurements only
          'referrals.view', // Own referrals only
        ],
      },
    ];

    // Create roles and assign permissions
    for (const roleData of roles) {
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {},
        create: {
          name: roleData.name,
          description: roleData.description,
          isSystem: roleData.isSystem,
        },
      });

      // Clear existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Prepare permissions for bulk create
      const permissionRecords = [];
      
      for (const permissionName of roleData.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName },
        });

        if (permission) {
          permissionRecords.push({
            roleId: role.id,
            permissionId: permission.id,
          });
        }
      }

      // Create role-permission relationships in bulk, skipping duplicates
      if (permissionRecords.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionRecords,
          skipDuplicates: true,
        });
      }
    }
  }
}