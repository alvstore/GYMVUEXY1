// ** Fake user data and data type

// ** Please remove below user data and data type in production and verify user with Real Database
export type UserTable = {
  id: number
  name: string
  email: string
  image: string
  password: string
  tenantId: string
  branchId?: string
  roles: string[]
  permissions: string[]
}

// =============== Fake Data ============================

export const users: UserTable[] = [
  {
    id: 1,
    name: 'Admin User',
    password: 'admin',
    email: 'admin@vuexy.com',
    image: '/images/avatars/1.png',
    tenantId: 'tenant-demo-001',
    branchId: undefined, // Tenant-level admin - can see all branches
    roles: ['admin', 'super_admin'],
    permissions: ['*'] // Wildcard = all permissions
  },
  {
    id: 2,
    name: 'Rajesh Kumar',
    password: 'manager',
    email: 'manager@incline.gym',
    image: '/images/avatars/2.png',
    tenantId: 'tenant-demo-001',
    branchId: '576332a0-e48c-4931-933d-92dedd4e460f', // Main Branch
    roles: ['manager'],
    permissions: ['members.*', 'classes.*', 'attendance.*', 'referrals.*', 'dashboard.view', 'reports.*', 'leads.*', 'equipment.*', 'products.*', 'inventory.*', 'lockers.*', 'staff.view']
  },
  {
    id: 3,
    name: 'Priya Sharma',
    password: 'trainer',
    email: 'trainer@incline.gym',
    image: '/images/avatars/3.png',
    tenantId: 'tenant-demo-001',
    branchId: '576332a0-e48c-4931-933d-92dedd4e460f',
    roles: ['trainer'],
    permissions: ['members.view', 'classes.*', 'attendance.view', 'dashboard.view']
  },
  {
    id: 4,
    name: 'Amit Patel',
    password: 'member',
    email: 'member@incline.gym',
    image: '/images/avatars/4.png',
    tenantId: 'tenant-demo-001',
    branchId: '576332a0-e48c-4931-933d-92dedd4e460f',
    roles: ['member'],
    permissions: ['member-portal.*']
  }
]
