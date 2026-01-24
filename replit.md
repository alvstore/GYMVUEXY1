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