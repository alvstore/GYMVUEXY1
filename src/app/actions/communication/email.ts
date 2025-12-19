'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

// Get user's emails
export async function getUserEmails(filters?: {
  folder?: string
  search?: string
  labels?: string[]
  isStarred?: boolean
  isRead?: boolean
}) {
  const context = await requirePermission('email.view')

  // Build where clause
  const where: any = {
    recipients: {
      some: {
        userId: context.userId,
      },
    },
  }

  if (filters?.folder) {
    where.recipients = {
      ...where.recipients,
      some: {
        ...where.recipients.some,
        // Filter by folder on recipient level
      },
    }
  }

  if (filters?.search) {
    where.OR = [
      { subject: { contains: filters.search, mode: 'insensitive' } },
      { message: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters?.isStarred !== undefined) {
    where.isStarred = filters.isStarred
  }

  if (filters?.labels && filters.labels.length > 0) {
    where.labels = {
      hasSome: filters.labels,
    }
  }

  const emails = await prisma.inboxEmail.findMany({
    where,
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      recipients: {
        where: {
          userId: context.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      attachments: true,
      replies: {
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return emails
}

// Get single email by ID
export async function getEmailById(emailId: string) {
  const context = await requirePermission('email.view')

  const email = await prisma.inboxEmail.findFirst({
    where: {
      id: emailId,
      recipients: {
        some: {
          userId: context.userId,
        },
      },
    },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      recipients: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      attachments: true,
      replies: {
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!email) {
    throw new Error('Email not found')
  }

  // Mark as read
  await prisma.emailRecipient.updateMany({
    where: {
      emailId,
      userId: context.userId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })

  return email
}

// Send email
export async function sendEmail(data: {
  to: string[] // User IDs
  cc?: string[]
  bcc?: string[]
  subject: string
  message: string
  attachments?: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }[]
  replyToId?: string
}) {
  const context = await requirePermission('email.send')

  const email = await prisma.inboxEmail.create({
    data: {
      tenantId: context.tenantId,
      branchId: context.branchId,
      fromUserId: context.userId,
      subject: data.subject,
      message: data.message,
      folder: 'sent',
      cc: data.cc || [],
      bcc: data.bcc || [],
      replyToId: data.replyToId,
      sentAt: new Date(),
      recipients: {
        create: [
          ...data.to.map(userId => ({
            userId,
            type: 'to',
          })),
          ...(data.cc || []).map(userId => ({
            userId,
            type: 'cc',
          })),
          ...(data.bcc || []).map(userId => ({
            userId,
            type: 'bcc',
          })),
        ],
      },
      attachments: {
        create: data.attachments || [],
      },
    },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      recipients: true,
      attachments: true,
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: context.branchId,
    action: 'Email.sent',
    resource: 'InboxEmail',
    resourceId: email.id,
    newValues: { subject: data.subject, recipientCount: data.to.length },
  })

  return email
}

// Toggle star
export async function toggleEmailStar(emailId: string) {
  const context = await requirePermission('email.view')

  const email = await prisma.inboxEmail.findFirst({
    where: {
      id: emailId,
      recipients: {
        some: {
          userId: context.userId,
        },
      },
    },
  })

  if (!email) {
    throw new Error('Email not found')
  }

  const updated = await prisma.inboxEmail.update({
    where: {
      id: emailId,
    },
    data: {
      isStarred: !email.isStarred,
    },
  })

  return updated
}

// Toggle read status
export async function toggleEmailRead(emailId: string) {
  const context = await requirePermission('email.view')

  const recipient = await prisma.emailRecipient.findFirst({
    where: {
      emailId,
      userId: context.userId,
    },
  })

  if (!recipient) {
    throw new Error('Email not found')
  }

  const updated = await prisma.emailRecipient.update({
    where: {
      id: recipient.id,
    },
    data: {
      isRead: !recipient.isRead,
      readAt: !recipient.isRead ? new Date() : null,
    },
  })

  return updated
}

// Add/remove label
export async function toggleEmailLabel(emailId: string, label: string) {
  const context = await requirePermission('email.view')

  const email = await prisma.inboxEmail.findFirst({
    where: {
      id: emailId,
      recipients: {
        some: {
          userId: context.userId,
        },
      },
    },
  })

  if (!email) {
    throw new Error('Email not found')
  }

  const hasLabel = email.labels.includes(label)
  const newLabels = hasLabel
    ? email.labels.filter((l: string) => l !== label)
    : [...email.labels, label]

  const updated = await prisma.inboxEmail.update({
    where: {
      id: emailId,
    },
    data: {
      labels: newLabels,
    },
  })

  return updated
}

// Delete email (move to trash)
export async function deleteEmail(emailId: string) {
  const context = await requirePermission('email.delete')

  const email = await prisma.inboxEmail.findFirst({
    where: {
      id: emailId,
      recipients: {
        some: {
          userId: context.userId,
        },
      },
    },
  })

  if (!email) {
    throw new Error('Email not found')
  }

  const updated = await prisma.inboxEmail.update({
    where: {
      id: emailId,
    },
    data: {
      folder: 'trash',
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: context.branchId,
    action: 'Email.deleted',
    resource: 'InboxEmail',
    resourceId: emailId,
    oldValues: { folder: email.folder },
  })

  return updated
}

// Bulk operations
export async function bulkToggleRead(emailIds: string[], isRead: boolean) {
  const context = await requirePermission('email.view')

  await prisma.emailRecipient.updateMany({
    where: {
      emailId: {
        in: emailIds,
      },
      userId: context.userId,
    },
    data: {
      isRead,
      readAt: isRead ? new Date() : null,
    },
  })

  return { success: true }
}

export async function bulkDeleteEmails(emailIds: string[]) {
  const context = await requirePermission('email.delete')

  await prisma.inboxEmail.updateMany({
    where: {
      id: {
        in: emailIds,
      },
      recipients: {
        some: {
          userId: context.userId,
        },
      },
    },
    data: {
      folder: 'trash',
    },
  })

  return { success: true }
}
