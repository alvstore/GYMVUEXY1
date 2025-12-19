// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

const horizontalMenuData = (dictionary: Awaited<ReturnType<typeof getDictionary>>): HorizontalMenuDataType[] => [
  // DASHBOARDS
  {
    label: dictionary['navigation'].dashboards,
    icon: 'tabler-smart-home',
    children: [
      {
        label: 'Gym Dashboard',
        icon: 'tabler-chart-pie-2',
        href: '/apps/dashboard',
        permissions: ['dashboard.view']
      },
      {
        label: dictionary['navigation'].crm,
        icon: 'tabler-chart-pie-2',
        href: '/dashboards/crm',
        permissions: ['dashboard.view']
      },
      {
        label: dictionary['navigation'].analytics,
        icon: 'tabler-trending-up',
        href: '/dashboards/analytics',
        permissions: ['dashboard.view']
      }
    ]
  },

  // GYM OPERATIONS
  {
    label: 'Gym Operations',
    icon: 'tabler-barbell',
    children: [
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
            label: 'Leads',
            href: '/apps/leads',
            permissions: ['members.create']
          }
        ]
      },
      {
        label: 'Sales & POS',
        icon: 'tabler-shopping-cart',
        permissions: ['pos.view'],
        children: [
          {
            label: 'Point of Sale',
            href: '/apps/pos',
            permissions: ['pos.view']
          },
          {
            label: 'Products',
            href: '/apps/products',
            permissions: ['products.view']
          },
          {
            label: 'Orders',
            href: '/apps/ecommerce/orders/list',
            permissions: ['pos.view']
          }
        ]
      },
      {
        label: 'Memberships',
        icon: 'tabler-id-badge',
        permissions: ['membership_plans.view'],
        children: [
          {
            label: 'Plans',
            href: '/apps/membership-plans',
            permissions: ['membership_plans.view']
          },
          {
            label: 'Active Memberships',
            href: '/apps/finance',
            permissions: ['finance.view']
          }
        ]
      },
      {
        label: 'Trainers & PT',
        icon: 'tabler-user-check',
        permissions: ['trainers.view'],
        href: '/apps/trainers'
      },
      {
        label: 'Classes',
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
          }
        ]
      },
      {
        label: 'Attendance',
        icon: 'tabler-door',
        permissions: ['attendance.view'],
        href: '/apps/attendance'
      },
      {
        label: 'Inventory',
        icon: 'tabler-box',
        permissions: ['inventory.view'],
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
          }
        ]
      },
      {
        label: 'Tasks',
        icon: 'tabler-list-check',
        href: '/apps/kanban',
        permissions: ['tasks.view']
      },
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
          }
        ]
      }
    ]
  },

  // MANAGEMENT
  {
    label: 'Management',
    icon: 'tabler-settings',
    children: [
      {
        label: 'Finance',
        icon: 'tabler-cash',
        permissions: ['finance.view'],
        children: [
          {
            label: 'Overview',
            href: '/apps/finance',
            permissions: ['finance.view']
          },
          {
            label: dictionary['navigation'].invoice,
            permissions: ['finance.view'],
            children: [
              {
                label: dictionary['navigation'].list,
                href: '/apps/invoice/list',
                permissions: ['finance.view']
              },
              {
                label: dictionary['navigation'].add,
                href: '/apps/invoice/add',
                permissions: ['finance.create']
              }
            ]
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
            label: 'Audit Logs',
            href: '/apps/audit',
            permissions: ['audit.view']
          }
        ]
      },
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
            label: 'Access Control',
            href: '/apps/access-control',
            permissions: ['doors.view']
          }
        ]
      },
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
            label: dictionary['navigation'].email,
            href: '/apps/email',
            permissions: ['communication.view']
          },
          {
            label: dictionary['navigation'].chat,
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
      {
        label: 'Administration',
        icon: 'tabler-settings',
        permissions: ['users.view', 'roles.view', 'settings.view'],
        children: [
          {
            label: 'Team',
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

export default horizontalMenuData
