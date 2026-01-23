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