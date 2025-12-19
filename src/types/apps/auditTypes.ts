export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW'
export type AuditEntity = 'MEMBER' | 'TRAINER' | 'MEMBERSHIP' | 'PAYMENT' | 'CLASS' | 'USER' | 'BRANCH' | 'PRODUCT' | 'OTHER'

export type AuditLog = {
  id: string
  action: AuditAction
  entity: AuditEntity
  entityId: string
  userName: string
  userEmail: string
  description: string
  ipAddress: string
  timestamp: string
  changes?: string
}

export const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    action: 'CREATE',
    entity: 'MEMBER',
    entityId: 'M156',
    userName: 'Admin User',
    userEmail: 'admin@gym.com',
    description: 'Created new member: Chandler Bing',
    ipAddress: '192.168.1.100',
    timestamp: '2024-11-19T10:30:00'
  },
  {
    id: '2',
    action: 'UPDATE',
    entity: 'MEMBERSHIP',
    entityId: 'MS045',
    userName: 'John Smith',
    userEmail: 'john@gym.com',
    description: 'Renewed membership for member M025',
    ipAddress: '192.168.1.101',
    timestamp: '2024-11-19T09:15:00',
    changes: JSON.stringify({ endDate: { from: '2024-11-30', to: '2024-12-31' } })
  },
  {
    id: '3',
    action: 'DELETE',
    entity: 'PRODUCT',
    entityId: 'P012',
    userName: 'Sarah Johnson',
    userEmail: 'sarah@gym.com',
    description: 'Deleted product: Old Protein Powder',
    ipAddress: '192.168.1.102',
    timestamp: '2024-11-19T08:45:00'
  },
  {
    id: '4',
    action: 'LOGIN',
    entity: 'USER',
    entityId: 'U001',
    userName: 'Admin User',
    userEmail: 'admin@gym.com',
    description: 'User logged in successfully',
    ipAddress: '192.168.1.100',
    timestamp: '2024-11-19T08:00:00'
  }
]
