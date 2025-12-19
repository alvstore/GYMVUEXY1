export type BranchStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'

export type Branch = {
  id: string
  name: string
  location: string
  phone: string
  email: string
  manager: string
  managerAvatar?: string
  memberCount: number
  staffCount: number
  monthlyRevenue: number
  status: BranchStatus
  establishedDate: string
  timezone: string
  currency: string
}

export const mockBranches: Branch[] = [
  {
    id: '1',
    name: 'Downtown Branch',
    location: '123 Main St, New York, NY',
    phone: '+1-555-0101',
    email: 'downtown@fitnesshub.com',
    manager: 'John Smith',
    managerAvatar: '/images/avatars/1.png',
    memberCount: 450,
    staffCount: 25,
    monthlyRevenue: 125000,
    status: 'ACTIVE',
    establishedDate: '2020-01-15',
    timezone: 'America/New_York',
    currency: 'USD'
  },
  {
    id: '2',
    name: 'Westside Branch',
    location: '456 Park Ave, Los Angeles, CA',
    phone: '+1-555-0102',
    email: 'westside@fitnesshub.com',
    manager: 'Sarah Johnson',
    memberCount: 380,
    staffCount: 20,
    monthlyRevenue: 98000,
    status: 'ACTIVE',
    establishedDate: '2021-06-20',
    timezone: 'America/Los_Angeles',
    currency: 'USD'
  },
  {
    id: '3',
    name: 'North Branch',
    location: '789 Oak Rd, Chicago, IL',
    phone: '+1-555-0103',
    email: 'north@fitnesshub.com',
    manager: 'Mike Williams',
    memberCount: 320,
    staffCount: 18,
    monthlyRevenue: 85000,
    status: 'ACTIVE',
    establishedDate: '2022-03-10',
    timezone: 'America/Chicago',
    currency: 'USD'
  },
  {
    id: '4',
    name: 'South Branch',
    location: '321 Pine St, Miami, FL',
    phone: '+1-555-0104',
    email: 'south@fitnesshub.com',
    manager: 'Emily Davis',
    memberCount: 180,
    staffCount: 12,
    monthlyRevenue: 45000,
    status: 'MAINTENANCE',
    establishedDate: '2023-09-05',
    timezone: 'America/New_York',
    currency: 'USD'
  }
]
