export type LeadStatus = 'NEW' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'NEGOTIATION' | 'WON' | 'LOST'
export type LeadSource = 'WEBSITE' | 'WALK_IN' | 'REFERRAL' | 'SOCIAL_MEDIA' | 'ADVERTISEMENT' | 'OTHER'

export type Lead = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  source: LeadSource
  status: LeadStatus
  assignedTo: string
  assignedToAvatar?: string
  interestedIn: string
  followUpDate?: string
  notes?: string
  createdAt: string
  convertedAt?: string
}

export const mockLeads: Lead[] = [
  {
    id: '1',
    firstName: 'Alex',
    lastName: 'Turner',
    email: 'alex.turner@email.com',
    phone: '+1-555-1001',
    source: 'WEBSITE',
    status: 'NEW',
    assignedTo: 'John Smith',
    assignedToAvatar: '/images/avatars/1.png',
    interestedIn: 'Premium Membership',
    followUpDate: '2024-11-20',
    notes: 'Interested in personal training',
    createdAt: '2024-11-19T09:00:00'
  },
  {
    id: '2',
    firstName: 'Rachel',
    lastName: 'Green',
    email: 'rachel.green@email.com',
    phone: '+1-555-1002',
    source: 'WALK_IN',
    status: 'CONTACTED',
    assignedTo: 'Sarah Johnson',
    interestedIn: 'Basic Membership',
    followUpDate: '2024-11-21',
    notes: 'Wants to visit facility first',
    createdAt: '2024-11-18T14:30:00'
  },
  {
    id: '3',
    firstName: 'Ross',
    lastName: 'Geller',
    email: 'ross.geller@email.com',
    phone: '+1-555-1003',
    source: 'REFERRAL',
    status: 'DEMO_SCHEDULED',
    assignedTo: 'Mike Williams',
    interestedIn: 'Group Classes',
    followUpDate: '2024-11-22',
    notes: 'Referred by member M042',
    createdAt: '2024-11-17T10:15:00'
  },
  {
    id: '4',
    firstName: 'Monica',
    lastName: 'Geller',
    email: 'monica.geller@email.com',
    phone: '+1-555-1004',
    source: 'SOCIAL_MEDIA',
    status: 'NEGOTIATION',
    assignedTo: 'Emily Davis',
    interestedIn: 'Family Plan',
    followUpDate: '2024-11-20',
    notes: 'Negotiating corporate discount',
    createdAt: '2024-11-16T11:00:00'
  },
  {
    id: '5',
    firstName: 'Chandler',
    lastName: 'Bing',
    email: 'chandler.bing@email.com',
    phone: '+1-555-1005',
    source: 'ADVERTISEMENT',
    status: 'WON',
    assignedTo: 'John Smith',
    interestedIn: 'Premium Membership',
    convertedAt: '2024-11-18T16:00:00',
    notes: 'Converted to member M156',
    createdAt: '2024-11-15T09:30:00'
  },
  {
    id: '6',
    firstName: 'Phoebe',
    lastName: 'Buffay',
    email: 'phoebe.buffay@email.com',
    phone: '+1-555-1006',
    source: 'WALK_IN',
    status: 'LOST',
    assignedTo: 'Sarah Johnson',
    interestedIn: 'Yoga Classes',
    notes: 'Chose competitor - price too high',
    createdAt: '2024-11-14T13:00:00'
  }
]
