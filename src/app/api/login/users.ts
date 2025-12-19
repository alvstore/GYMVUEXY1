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
    name: 'John Doe',
    password: 'admin',
    email: 'admin@vuexy.com',
    image: '/images/avatars/1.png',
    tenantId: 'tenant-demo-001',
    branchId: 'branch-demo-001',
    roles: ['admin', 'super_admin'],
    permissions: ['*'] // Wildcard = all permissions
  }
]
