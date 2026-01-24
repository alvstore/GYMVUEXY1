# Gym Management System (Incline)

### Overview
The Incline Gym Management System is a comprehensive, multi-tenant solution designed to streamline the operations of gym chains. It provides a robust platform for managing members, staff, classes, payments, and equipment, alongside advanced features for lead management, financial analytics, and a self-service member portal. The system aims to enhance operational efficiency, improve member engagement, and provide actionable insights for business growth. Key capabilities include membership lifecycle management, integrated e-commerce for products, real-time dashboards for various roles (Admin, Manager, Staff, Member), and a secure, scalable architecture.

### User Preferences
No specific user preferences were provided in the original document.

### System Architecture

#### Frontend
- **Framework:** Next.js 15 with App Router
- **UI Library:** Material-UI v6 (MUI) components
- **Styling:** Tailwind CSS utilities
- **Admin Template:** Vuexy admin template is used as a base.

#### Backend
- **Framework:** Next.js server actions for handling business logic
- **ORM:** Prisma ORM for database interactions
- **Database:** PostgreSQL with 80+ models
- **Authentication:** NextAuth for authentication, utilizing JWT tokens with role-based permissions.
- **Security:** Per-request permission checks, tenant/branch data isolation, Stripe webhook signature verification, comprehensive audit trail.
- **Core Features:**
    - **Multi-tenant Architecture:** Supports multiple gym branches with tenant and branch isolation.
    - **Role-Based Access Control (RBAC):** Granular permissions for Admin, Manager, Trainer, Staff, and Member roles.
    - **User & Role Management:** Tools for provisioning users and assigning roles.
    - **Membership Management:** Full lifecycle management including creation, renewal, freezing, unfreezing, and benefit allocation.
    - **Class Scheduling:** Management of class schedules, trainer assignments, and member bookings.
    - **Payment Processing:** Integrated Stripe checkout for memberships and product purchases, with webhook support for transaction reconciliation.
    - **E-commerce:** Shopping cart functionality, product catalog, order management, and stock deduction.
    - **Equipment Tracking:** Inventory management, condition tracking, and maintenance scheduling.
    - **Lead Management:** Visual Kanban board for lead pipeline, activity tracking, and conversion to members.
    - **Financial Analytics:** Tracking of net profit, ARR, MRR, revenue breakdown, and expense tracking.
    - **Dashboards:**
        - **Admin Dashboard:** Tenant-wide CRM, sales analytics, member growth, lead pipeline, and revenue metrics.
        - **Manager Dashboard:** Branch-specific metrics, staff team panel, membership renewal alerts, and class schedule overview.
        - **Staff Dashboard:** For attendance check-ins and member interaction.
        - **Member Portal:** Self-service for membership overview, fitness goal tracking, attendance history, and class browsing/booking.
    - **Notifications:** Integrated notification service for email, SMS, and WhatsApp (currently stubbed).
    - **Audit Logging:** Comprehensive logging of all system changes.

#### Database
- **Schema:** 80+ models covering gym operations, including members, staff, classes, products, equipment, leads, and financial records.
- **Isolation:** Multi-tenant isolation enforced per branch.
- **Integrity:** Transaction support for critical operations.

### External Dependencies
- **Database:** PostgreSQL
- **Payment Gateway:** Stripe (for checkout sessions and webhooks)
- **Authentication:** NextAuth
- **UI Components:** Material-UI (MUI)
- **Styling Utilities:** Tailwind CSS
- **Admin Template:** Vuexy
- **Notification Services:** (Currently stubbed, future integration planned for SendGrid, Twilio, etc.)
- **Validation:** Zod schema validation for forms

### Recent Changes (January 2026)

#### Schema Updates
- Added `durationMonths` (Int with default 1) and `basePrice` (Decimal) fields to `MembershipPlan` model
- Added `quantityPerMonth` (Int with default 0) field to `PlanBenefit` model for monthly benefit allocations
- Added `MembershipStatus` enum with values: ACTIVE, FROZEN, EXPIRED
- Added payment tracking fields to `MemberMembership`: `totalPrice`, `amountPaid`, `balanceDue` (all Decimal)
- Created new `BenefitLedger` model for duration-linked benefit tracking with:
  - `totalAllocated`: Calculated as quantityPerMonth * durationMonths
  - `usedCount`: Tracked sessions used
  - `remainingCount`: Remaining benefit balance

#### Backend Logic
- New `registerMemberWithPlan` server action in `src/app/actions/members.ts` that:
  - Creates a member with full profile
  - Creates MemberMembership with auto-calculated endDate based on durationMonths
  - Populates BenefitLedger entries for each plan benefit

#### UI Updates
- Added Zod validation to AddMemberDrawer component using @hookform/resolvers/zod
- Member List page fetches real data from database via getMembers action

#### Facility Booking System (January 2026)
**Schema Additions:**
- `Facility` model: name, facilityType (enum), maxCapacity, durationMinutes, linkedBenefitName
- `BookingSlot` model: dayOfWeek, startTime, endTime, linked to Facility
- `FacilityBooking` model: bookingDate, status, audit fields (bookedAt, cancelledAt, attendedAt)
- `FacilityType` enum: SAUNA, ICE_BATH, STEAM_ROOM, POOL, MASSAGE, GROUP_CLASS, etc.
- `FacilityBookingStatus` enum: CONFIRMED, ATTENDED, NO_SHOW, CANCELLED

**Server Actions (src/app/actions/bookings.ts):**
- `createBooking`: Atomic transaction with membership status check, credit check, capacity check, usedCount increment
- `cancelBooking`: Cancels booking and refunds credit to BenefitLedger
- `markAsAttended`: Marks booking as attended by staff
- `markAsNoShow`: Marks booking as no-show
- `getFacilities`: Gets all active facilities with booking slots
- `getAvailableSlots`: Gets available slots for a date with capacity info
- `getMemberCredits`: Gets member's remaining benefit credits
- `getMemberBookings`: Gets member's bookings with filters
- `getAllBookingsForCalendar`: Gets bookings for admin calendar view

**UI Components:**
- Admin Facility Calendar (`/apps/facility-calendar`): FullCalendar view with filter sidebar, booking detail modal with cancel/attend controls
- Member Booking Portal (`/member-portal/bookings`): Credits display, facility selection, date picker, time slot selection, booking confirmation

**Seeded Data:**
- Infrared Sauna (30-min slots, capacity 4)
- Ice Bath (15-min slots, capacity 2)
- Steam Room (20-min slots, capacity 6)
- Time slots from 6:00 AM to 9:00 PM for all days

#### Locker Management System (January 2026)
**Schema Additions:**
- `Locker` model: lockerNumber, floor, section, size, monthlyRate, isPremium flag, status enum
- `LockerAssignment` model: startDate, endDate (synced with membership.endDate), totalFee, includedInPlan, paymentStatus, PENDING_REVIEW status
- `LockerStatus` enum: AVAILABLE, OCCUPIED, MAINTENANCE, OUT_OF_ORDER
- `LockerAssignmentStatus` enum: ACTIVE, RELEASED, EXPIRED, PENDING_REVIEW

**Server Actions (src/app/actions/lockers.ts):**
- `assignLocker`: Assigns locker with membership sync, auto-calculates fee and adds to balanceDue if not included in plan
- `releaseLocker`: Releases locker and creates audit log
- `getLockerGrid`: Returns grid data with assignment info
- `getLockerStats`: Returns occupancy stats, pending reviews, premium lockers
- `flagExpiredLockerAssignments`: Flags PENDING_REVIEW when membership expires/freezes

**UI Components:**
- Locker Grid View (`/apps/lockers/grid`): Visual grid with Vuexy color coding (Success=Vacant, Danger=Occupied), assignment/release modals
- Stats dashboard with occupancy rate, pending reviews, premium locker count

#### Staff RBAC System (January 2026)
**Permissions Utility (src/libs/permissions/rolePermissions.ts):**
- Role definitions: ADMIN (full access), MANAGER (override bookings, freeze memberships, assign lockers), STAFF (check-ins, view profiles, create bookings), TRAINER (classes only)
- `hasRolePermission()`: Checks if role has specific permission
- `canPerformAction()`: Maps actions to required permissions
- Permission guards applied to server actions and API routes

**Staff Dashboard (src/views/dashboards/StaffDashboard.tsx):**
- 6 Quick Action cards: Check-in, Attendance, Lockers, Bookings, New Member, Classes
- Locker overview panel with pending reviews
- Real-time clock and member search

#### Automated Notifications (January 2026)
**Schema Additions:**
- `NotificationLog` model: notificationType, channel, status, dedupeKey (prevents spam), scheduledFor, sentAt
- `NotificationLogType` enum: MEMBERSHIP_EXPIRY_7_DAYS, MEMBERSHIP_EXPIRY_3_DAYS, MEMBERSHIP_EXPIRY_1_DAY, PAYMENT_DUE_REMINDER, BOOKING_REMINDER_2_HOURS

**Cron API Route (/api/cron/notifications):**
- Membership expiry notifications at 7, 3, and 1 day intervals
- Weekly payment due reminders for outstanding balances
- Booking reminders 2 hours before scheduled sessions
- Deduplication via dedupeKey to prevent duplicate messages
- Protected by CRON_SECRET environment variable

#### Owner Analytics Dashboard (January 2026)
**Dashboard (src/views/dashboards/OwnerAnalyticsDashboard.tsx):**
- Revenue Trends chart (collected vs projected)
- Member Distribution donut chart (active, expiring, new, expired)
- Facility Utilization bar chart with percentage breakdown
- Staff Performance metrics (check-ins, lockers, bookings)
- Period selector (month, quarter, year)

**Data Export (/api/export/[type]):**
- CSV export for: revenue, members, outstanding dues, all data
- Admin-only middleware protection
- Proper CSV formatting with escaped values

#### UI Components (January 2026)
**Toast Notification System (src/contexts/ToastContext.tsx):**
- `useToast()` hook for showSuccess, showError, showWarning, showInfo
- Stacked toast notifications with auto-dismiss
- Consistent styling with MUI Alert component

**Empty State Component (src/components/EmptyState.tsx):**
- Variants: default, relaxed, minimal
- Pre-built components: NoBookingsToday, NoMembersFound, NoPendingReviews, etc.