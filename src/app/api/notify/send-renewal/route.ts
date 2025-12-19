import { NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'

/**
 * Automated Renewal Notification Endpoint
 * 
 * This GET route is designed to be called by a cron job/scheduler
 * to send renewal reminders to members whose memberships are expiring within 14 days
 * 
 * Usage: GET /api/notify/send-renewal
 * 
 * Security: Should be protected by API key or cron secret in production
 */
export async function GET(request: Request) {
  try {
    // Validate cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret) {
      return NextResponse.json({ error: 'Server configuration error: CRON_SECRET not set' }, { status: 500 })
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const fourteenDaysFromNow = new Date()
    fourteenDaysFromNow.setDate(today.getDate() + 14)

    // Get tenant/branch from query params for scoping (REQUIRED for multi-tenancy)
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const branchId = searchParams.get('branchId')

    if (!tenantId) {
      return NextResponse.json({ 
        error: 'Bad Request: tenantId query parameter is required' 
      }, { status: 400 })
    }

    // Fetch tenant contact info for tenant-wide memberships
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Query memberships expiring within 14 days with ENFORCED tenant/branch scoping
    const expiringMemberships = await prisma.memberMembership.findMany({
      where: {
        endDate: {
          gte: today,
          lte: fourteenDaysFromNow
        },
        status: 'ACTIVE',
        tenantId,
        ...(branchId && { branchId })
      },
      include: {
        member: true,
        plan: true,
        branch: {
          select: {
            name: true,
            phone: true,
            email: true,
            address: true
          }
        }
      }
    })

    const notifications = []

    for (const membership of expiringMemberships) {
      const daysUntilExpiry = Math.ceil((membership.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Build contact info (use branch contact if available, otherwise tenant contact)
      const branchInfo = membership.branch 
        ? `
          Branch Contact Information:
          - ${membership.branch.name}
          - Phone: ${membership.branch.phone}
          - Email: ${membership.branch.email}
          - Address: ${membership.branch.address}
        `
        : `
          Contact Information:
          - ${tenant.name}
          - Phone: ${tenant.phone || 'N/A'}
          - Email: ${tenant.email || 'N/A'}
          - Address: ${tenant.address || 'N/A'}
        `

      // Mock email sending (replace with actual email service in production)
      const emailData = {
        to: membership.member.email,
        subject: `Your ${membership.plan.name} membership expires in ${daysUntilExpiry} days`,
        body: `
          Dear ${membership.member.firstName} ${membership.member.lastName},

          Your membership "${membership.plan.name}" will expire on ${membership.endDate.toLocaleDateString()}.

          Days remaining: ${daysUntilExpiry}

          ${branchInfo}

          Please visit us or contact us to renew your membership.

          Thank you for being a valued member!
        `
      }

      // In production, replace this with actual email service call:
      // await sendEmail(emailData)
      
      console.log(`[RENEWAL NOTIFICATION] Sending to ${emailData.to}:`, emailData.subject)

      notifications.push({
        memberId: membership.member.id,
        memberEmail: membership.member.email,
        memberName: `${membership.member.firstName} ${membership.member.lastName}`,
        planName: membership.plan.name,
        expiryDate: membership.endDate,
        daysRemaining: daysUntilExpiry,
        branchName: membership.branch?.name || 'Tenant-wide',
        sent: true
      })

      // Create a notification record in the database
      await prisma.notification.create({
        data: {
          memberId: membership.member.id,
          tenantId: membership.member.tenantId,
          branchId: membership.branchId,
          type: 'RENEWAL_REMINDER',
          channel: 'EMAIL',
          title: 'Membership Renewal Reminder',
          message: `Your ${membership.plan.name} membership expires in ${daysUntilExpiry} days`,
          isRead: false,
          sentAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${notifications.length} renewal notifications`,
      count: notifications.length,
      notifications
    })
  } catch (error) {
    console.error('Error sending renewal notifications:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send renewal notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
