// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

const verticalMenuData = (dictionary: Awaited<ReturnType<typeof getDictionary>>): VerticalMenuDataType[] => [
  // DASHBOARDS
  {
    label: dictionary['navigation'].dashboards,
    icon: 'tabler-smart-home',
    children: [
      {
        label: 'Manager Dashboard',
        icon: 'tabler-building',
        href: '/dashboards/manager',
        permissions: ['dashboard.view']
      },
      {
        label: 'Staff Dashboard',
        icon: 'tabler-clipboard-check',
        href: '/dashboards/staff',
        permissions: ['attendance.view']
      },
      {
        label: 'Finance Dashboard',
        icon: 'tabler-report-money',
        href: '/dashboards/finance',
        permissions: ['finance.view']
      }
    ]
  },

  // MEMBER PORTAL (Self-service)
  {
    label: 'My Portal',
    icon: 'tabler-user-circle',
    href: '/member-portal',
    permissions: ['member-portal.*', 'self.view']
  },

  // MAIN GYM OPERATIONS
  {
    label: 'Gym Operations',
    isSection: true,
    children: [
      // 1. MEMBERS
      {
        label: 'Members',
        icon: 'tabler-users',
        permissions: ['members.view'],
        children: [
          {
            label: 'All Members',
            href: '/apps/members',
            permissions: ['members.view']
          },
          {
            label: 'Member Profile',
            href: '/apps/member',
            permissions: ['members.view']
          },
          {
            label: 'Member Goals',
            href: '/apps/goals',
            permissions: ['members.view']
          },
          {
            label: 'Referrals',
            href: '/apps/referrals',
            permissions: ['members.view']
          },
          {
            label: 'Leads',
            href: '/apps/leads',
            permissions: ['members.create']
          }
        ]
      },

      // 2. SALES/POS
      {
        label: 'Sales & POS',
        icon: 'tabler-shopping-cart',
        permissions: ['pos.view'],
        children: [
          {
            label: 'POS Dashboard',
            href: '/apps/ecommerce/dashboard',
            permissions: ['pos.view']
          },
          {
            label: 'Products',
            href: '/apps/ecommerce/products/list',
            permissions: ['products.view']
          },
          {
            label: 'Manage Products',
            href: '/apps/products',
            permissions: ['products.manage']
          },
          {
            label: 'Orders',
            href: '/apps/ecommerce/orders/list',
            permissions: ['pos.view']
          },
          {
            label: 'Customers',
            href: '/apps/ecommerce/customers/list',
            permissions: ['pos.view']
          },
          {
            label: 'Invoices',
            href: '/apps/invoice/list',
            permissions: ['finance.view']
          }
        ]
      },

      // 3. MEMBERSHIPS/PLANS
      {
        label: 'Memberships & Plans',
        icon: 'tabler-id-badge',
        permissions: ['membership_plans.view'],
        children: [
          {
            label: 'Plan Catalog',
            href: '/apps/plans',
            permissions: ['plans.view']
          },
          {
            label: 'Membership Plans',
            href: '/apps/membership-plans',
            permissions: ['membership_plans.view']
          },
          {
            label: 'Benefits Dashboard',
            href: '/apps/benefits',
            permissions: ['members.view']
          },
          {
            label: 'Lifecycle Management',
            href: '/apps/lifecycle',
            permissions: ['memberships.lifecycle']
          },
          {
            label: 'Active Memberships',
            href: '/apps/finance',
            permissions: ['finance.view']
          },
          {
            label: 'Renewals',
            href: '/apps/finance',
            permissions: ['finance.view']
          }
        ]
      },

      // 3B. PROMOTIONS
      {
        label: 'Promotions',
        icon: 'tabler-discount',
        permissions: ['coupons.view'],
        children: [
          {
            label: 'Coupons',
            href: '/apps/coupons',
            permissions: ['coupons.view']
          }
        ]
      },

      // 4. TRAINERS/PT
      {
        label: 'Trainers & PT',
        icon: 'tabler-user-check',
        permissions: ['trainers.view'],
        children: [
          {
            label: 'All Trainers',
            href: '/apps/trainers',
            permissions: ['trainers.view']
          },
          {
            label: 'Trainer Assignments',
            href: '/apps/trainers',
            permissions: ['trainers.view']
          },
          {
            label: 'Utilization Report',
            href: '/apps/reports',
            permissions: ['reports.view']
          }
        ]
      },

      // 5. CLASSES/CALENDAR
      {
        label: 'Classes & Schedule',
        icon: 'tabler-calendar-event',
        permissions: ['classes.view'],
        children: [
          {
            label: 'All Classes',
            href: '/apps/classes',
            permissions: ['classes.view']
          },
          {
            label: 'Calendar',
            href: '/apps/calendar',
            permissions: ['classes.view']
          },
          {
            label: 'Class Bookings',
            href: '/apps/classes',
            permissions: ['classes.view']
          }
        ]
      },

      // 6. ATTENDANCE/ACCESS
      {
        label: 'Attendance & Access',
        icon: 'tabler-door',
        permissions: ['attendance.view'],
        children: [
          {
            label: 'Attendance',
            href: '/apps/attendance',
            permissions: ['attendance.view']
          },
          {
            label: 'Access Control',
            href: '/apps/access-control',
            permissions: ['doors.view']
          },
          {
            label: 'Check-in Logs',
            href: '/apps/attendance',
            permissions: ['attendance.view']
          }
        ]
      },

      // 7. INVENTORY/LOCKERS
      {
        label: 'Inventory & Lockers',
        icon: 'tabler-box',
        permissions: ['inventory.view', 'lockers.view'],
        children: [
          {
            label: 'Inventory',
            href: '/apps/inventory',
            permissions: ['inventory.view']
          },
          {
            label: 'Lockers',
            href: '/apps/lockers',
            permissions: ['lockers.view']
          },
          {
            label: 'Equipment Maintenance',
            href: '/apps/equipment-maintenance',
            permissions: ['inventory.view']
          }
        ]
      },

      // 8. TASKS
      {
        label: 'Tasks',
        icon: 'tabler-list-check',
        href: '/apps/kanban',
        permissions: ['tasks.view']
      },

      // 9. DIET & WORKOUT
      {
        label: 'Diet & Workout',
        icon: 'tabler-apple',
        permissions: ['plans.view'],
        children: [
          {
            label: 'Workout Plans',
            href: '/apps/workout-plans',
            permissions: ['plans.view']
          },
          {
            label: 'Diet Plans',
            href: '/apps/diet-plans',
            permissions: ['plans.view']
          },
          {
            label: 'Plan Templates',
            href: '/apps/workout-plans',
            permissions: ['plans.manage']
          }
        ]
      }
    ]
  },

  // MANAGEMENT & ADMINISTRATION
  {
    label: 'Management',
    isSection: true,
    children: [
      // 10. FINANCE & OPERATIONS
      {
        label: 'Finance',
        icon: 'tabler-cash',
        permissions: ['finance.view'],
        children: [
          {
            label: 'Financial Overview',
            href: '/apps/finance',
            permissions: ['finance.view']
          },
          {
            label: 'Invoices',
            href: '/apps/invoice/list',
            permissions: ['finance.view']
          },
          {
            label: 'Expenses',
            href: '/apps/expenses',
            permissions: ['expenses.view']
          },
          {
            label: 'Payroll',
            href: '/apps/payroll',
            permissions: ['payroll.view']
          }
        ]
      },

      // 11. REPORTS
      {
        label: 'Reports',
        icon: 'tabler-chart-bar',
        permissions: ['reports.view'],
        children: [
          {
            label: 'All Reports',
            href: '/apps/reports',
            permissions: ['reports.view']
          },
          {
            label: 'Member Reports',
            href: '/apps/reports',
            permissions: ['reports.view']
          },
          {
            label: 'Financial Reports',
            href: '/apps/reports',
            permissions: ['reports.view']
          },
          {
            label: 'Attendance Reports',
            href: '/apps/reports',
            permissions: ['reports.view']
          },
          {
            label: 'Audit Logs',
            href: '/apps/audit',
            permissions: ['audit.view']
          }
        ]
      },

      // 12. FACILITIES
      {
        label: 'Facilities',
        icon: 'tabler-building',
        permissions: ['branches.view'],
        children: [
          {
            label: 'Branches',
            href: '/apps/branches',
            permissions: ['branches.view']
          },
          {
            label: 'Rooms & Spaces',
            href: '/apps/access-control',
            permissions: ['doors.view']
          }
        ]
      },

      // 13. COMMUNICATION
      {
        label: 'Communication',
        icon: 'tabler-message-circle',
        permissions: ['communication.view'],
        children: [
          {
            label: 'Messages',
            href: '/apps/communication',
            permissions: ['communication.view']
          },
          {
            label: 'Email',
            href: '/apps/email',
            permissions: ['communication.view']
          },
          {
            label: 'Chat',
            href: '/apps/chat',
            permissions: ['communication.view']
          },
          {
            label: 'Referrals',
            href: '/apps/referrals',
            permissions: ['referrals.view']
          }
        ]
      },

      // 14. ADMINISTRATION
      {
        label: 'Administration',
        icon: 'tabler-settings',
        permissions: ['users.view', 'roles.view', 'settings.view'],
        children: [
          {
            label: 'Team Management',
            href: '/apps/team',
            permissions: ['users.view']
          },
          {
            label: 'Roles & Permissions',
            href: '/apps/roles',
            permissions: ['roles.view']
          },
          {
            label: 'Settings',
            href: '/apps/settings',
            permissions: ['settings.view']
          }
        ]
      }
    ]
  }
]

export default verticalMenuData
