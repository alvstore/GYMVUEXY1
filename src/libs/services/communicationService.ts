import { prisma } from '@/lib/prisma'
import { EmailProvider, SmsProvider, WhatsAppProvider, TemplateType, TemplateCategory, MessageStatus, NotificationType, NotificationChannel } from '@prisma/client'

export interface EmailConfig {
  provider: EmailProvider
  config: any
  fromName: string
  fromEmail: string
  replyToEmail?: string
  logoUrl?: string
  brandColor?: string
  footerText?: string
  isDefault?: boolean
}

export interface SmsConfig {
  provider: SmsProvider
  config: any
  senderId: string
  isDefault?: boolean
}

export interface WhatsAppConfig {
  provider: WhatsAppProvider
  config: any
  businessNumber: string
  businessName: string
  isDefault?: boolean
}

export interface SendEmailData {
  to: string
  subject: string
  content: string
  htmlContent?: string
  templateId?: string
  memberId?: string
  userId?: string
  metadata?: any
}

export interface SendSmsData {
  to: string
  content: string
  templateId?: string
  memberId?: string
  userId?: string
  metadata?: any
}

export interface SendWhatsAppData {
  to: string
  content: string
  messageType?: string
  mediaUrl?: string
  templateId?: string
  memberId?: string
  userId?: string
  metadata?: any
}

export interface CreateTemplateData {
  tenantId: string
  branchId?: string
  name: string
  description?: string
  templateType: TemplateType
  category: TemplateCategory
  subject?: string
  content: string
  htmlContent?: string
  placeholders?: string[]
}

export class CommunicationService {
  // Email Configuration
  static async saveEmailConfig(tenantId: string, branchId: string | null, config: EmailConfig) {
    // Deactivate other configs if this is set as default
    if (config.isDefault) {
      await prisma.emailSetting.updateMany({
        where: { tenantId, branchId },
        data: { isDefault: false },
      })
    }

    return await prisma.emailSetting.upsert({
      where: {
        tenantId_branchId_provider: {
          tenantId,
          branchId: branchId || '',
          provider: config.provider,
        },
      },
      update: {
        config: config.config,
        fromName: config.fromName,
        fromEmail: config.fromEmail,
        replyToEmail: config.replyToEmail,
        logoUrl: config.logoUrl,
        brandColor: config.brandColor,
        footerText: config.footerText,
        isActive: true,
      },
      create: {
        tenantId,
        branchId,
        provider: config.provider,
        config: config.config,
        fromName: config.fromName,
        fromEmail: config.fromEmail,
        replyToEmail: config.replyToEmail,
        logoUrl: config.logoUrl,
        brandColor: config.brandColor,
        footerText: config.footerText,
        isActive: true,
        isDefault: config.isDefault || true,
      },
    })
  }

  // SMS Configuration
  static async saveSmsConfig(tenantId: string, branchId: string | null, config: SmsConfig) {
    if (config.isDefault) {
      await prisma.smsSetting.updateMany({
        where: { tenantId, branchId },
        data: { isDefault: false },
      })
    }

    return await prisma.smsSetting.upsert({
      where: {
        tenantId_branchId_provider: {
          tenantId,
          branchId: branchId || '',
          provider: config.provider,
        },
      },
      update: {
        config: config.config,
        senderId: config.senderId,
        isActive: true,
      },
      create: {
        tenantId,
        branchId,
        provider: config.provider,
        config: config.config,
        senderId: config.senderId,
        isActive: true,
        isDefault: config.isDefault || true,
      },
    })
  }

  // WhatsApp Configuration
  static async saveWhatsAppConfig(tenantId: string, branchId: string | null, config: WhatsAppConfig) {
    if (config.isDefault) {
      await prisma.whatsAppSetting.updateMany({
        where: { tenantId, branchId },
        data: { isDefault: false },
      })
    }

    return await prisma.whatsAppSetting.upsert({
      where: {
        tenantId_branchId_provider: {
          tenantId,
          branchId: branchId || '',
          provider: config.provider,
        },
      },
      update: {
        config: config.config,
        businessNumber: config.businessNumber,
        businessName: config.businessName,
        isActive: true,
      },
      create: {
        tenantId,
        branchId,
        provider: config.provider,
        config: config.config,
        businessNumber: config.businessNumber,
        businessName: config.businessName,
        isActive: true,
        isDefault: config.isDefault || true,
      },
    })
  }

  // Template Management
  static async createTemplate(data: CreateTemplateData) {
    return await prisma.communicationTemplate.create({
      data: {
        ...data,
        placeholders: data.placeholders || [],
      },
    })
  }

  static async updateTemplate(id: string, data: Partial<CreateTemplateData>) {
    return await prisma.communicationTemplate.update({
      where: { id },
      data,
    })
  }

  static async getTemplates(tenantId: string, branchId?: string, templateType?: TemplateType) {
    return await prisma.communicationTemplate.findMany({
      where: {
        tenantId,
        ...(branchId && {
          OR: [
            { branchId },
            { branchId: null },
          ],
        }),
        ...(templateType && { templateType }),
        isActive: true,
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { isSystem: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    })
  }

  // Email Service
  static async sendEmail(tenantId: string, branchId: string, data: SendEmailData) {
    // Get email configuration
    const emailConfig = await prisma.emailSetting.findFirst({
      where: {
        tenantId,
        OR: [
          { branchId, isActive: true },
          { branchId: null, isActive: true },
        ],
      },
      orderBy: [
        { branchId: 'desc' }, // Prefer branch-specific config
        { isDefault: 'desc' },
      ],
    })

    if (!emailConfig) {
      throw new Error('No email configuration found')
    }

    // Create email log
    const emailLog = await prisma.emailLog.create({
      data: {
        tenantId,
        branchId,
        templateId: data.templateId,
        memberId: data.memberId,
        userId: data.userId,
        toEmail: data.to,
        fromEmail: emailConfig.fromEmail,
        subject: data.subject,
        content: data.content,
        htmlContent: data.htmlContent,
        metadata: data.metadata,
      },
    })

    try {
      // Create transporter based on provider
      const transporter = await this.createEmailTransporter(emailConfig)

      // Send email
      const result = await transporter.sendMail({
        from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
        to: data.to,
        replyTo: emailConfig.replyToEmail,
        subject: data.subject,
        text: data.content,
        html: data.htmlContent || data.content,
      })

      // Update log with success
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          messageId: result.messageId,
        },
      })

      // Update template usage
      if (data.templateId) {
        await prisma.communicationTemplate.update({
          where: { id: data.templateId },
          data: {
            usageCount: { increment: 1 },
            lastUsed: new Date(),
          },
        })
      }

      return { success: true, messageId: result.messageId }
    } catch (error: any) {
      // Update log with failure
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      })

      throw error
    }
  }

  // SMS Service
  static async sendSms(tenantId: string, branchId: string, data: SendSmsData) {
    // Get SMS configuration
    const smsConfig = await prisma.smsSetting.findFirst({
      where: {
        tenantId,
        OR: [
          { branchId, isActive: true },
          { branchId: null, isActive: true },
        ],
      },
      orderBy: [
        { branchId: 'desc' },
        { isDefault: 'desc' },
      ],
    })

    if (!smsConfig) {
      throw new Error('No SMS configuration found')
    }

    // Create SMS log
    const smsLog = await prisma.smsLog.create({
      data: {
        tenantId,
        branchId,
        templateId: data.templateId,
        memberId: data.memberId,
        userId: data.userId,
        toPhone: data.to,
        fromPhone: smsConfig.senderId,
        content: data.content,
        metadata: data.metadata,
      },
    })

    try {
      // Send SMS based on provider
      const result = await this.sendSmsViaProvider(smsConfig, data.to, data.content)

      // Update log with success
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          messageId: result.messageId,
        },
      })

      // Update template usage
      if (data.templateId) {
        await prisma.communicationTemplate.update({
          where: { id: data.templateId },
          data: {
            usageCount: { increment: 1 },
            lastUsed: new Date(),
          },
        })
      }

      return { success: true, messageId: result.messageId }
    } catch (error: any) {
      // Update log with failure
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      })

      throw error
    }
  }

  // WhatsApp Service
  static async sendWhatsApp(tenantId: string, branchId: string, data: SendWhatsAppData) {
    // Get WhatsApp configuration
    const whatsappConfig = await prisma.whatsAppSetting.findFirst({
      where: {
        tenantId,
        OR: [
          { branchId, isActive: true },
          { branchId: null, isActive: true },
        ],
      },
      orderBy: [
        { branchId: 'desc' },
        { isDefault: 'desc' },
      ],
    })

    if (!whatsappConfig) {
      throw new Error('No WhatsApp configuration found')
    }

    // Create WhatsApp log
    const whatsappLog = await prisma.whatsAppLog.create({
      data: {
        tenantId,
        branchId,
        templateId: data.templateId,
        memberId: data.memberId,
        userId: data.userId,
        toPhone: data.to,
        fromPhone: whatsappConfig.businessNumber,
        content: data.content,
        messageType: data.messageType || 'text',
        mediaUrl: data.mediaUrl,
        metadata: data.metadata,
      },
    })

    try {
      // Send WhatsApp message based on provider
      const result = await this.sendWhatsAppViaProvider(whatsappConfig, data)

      // Update log with success
      await prisma.whatsAppLog.update({
        where: { id: whatsappLog.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          messageId: result.messageId,
        },
      })

      // Update template usage
      if (data.templateId) {
        await prisma.communicationTemplate.update({
          where: { id: data.templateId },
          data: {
            usageCount: { increment: 1 },
            lastUsed: new Date(),
          },
        })
      }

      return { success: true, messageId: result.messageId }
    } catch (error: any) {
      // Update log with failure
      await prisma.whatsAppLog.update({
        where: { id: whatsappLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      })

      throw error
    }
  }

  // Template Processing
  static processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value || ''))
    })

    return processed
  }

  // Automated Notifications
  static async sendMembershipExpiryReminder(memberId: string, daysBeforeExpiry: number) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: {
          where: {
            status: 'ACTIVE',
            endDate: {
              gte: new Date(),
              lte: new Date(Date.now() + daysBeforeExpiry * 24 * 60 * 60 * 1000),
            },
          },
          include: { plan: true },
        },
        branch: true,
      },
    })

    if (!member || member.memberships.length === 0) return

    const membership = member.memberships[0]
    const template = await prisma.communicationTemplate.findFirst({
      where: {
        tenantId: member.tenantId,
        category: 'MEMBERSHIP_EXPIRY',
        templateType: 'EMAIL',
        isActive: true,
      },
    })

    if (!template) return

    const variables = {
      member_name: `${member.firstName} ${member.lastName}`,
      membership_plan: membership.plan.name,
      expiry_date: membership.endDate.toLocaleDateString(),
      days_remaining: daysBeforeExpiry,
      branch_name: member.branch.name,
    }

    const processedContent = this.processTemplate(template.content, variables)
    const processedSubject = this.processTemplate(template.subject || 'Membership Expiry Reminder', variables)

    if (member.email) {
      await this.sendEmail(member.tenantId, member.branchId, {
        to: member.email,
        subject: processedSubject,
        content: processedContent,
        htmlContent: template.htmlContent ? this.processTemplate(template.htmlContent, variables) : undefined,
        templateId: template.id,
        memberId: member.id,
      })
    }
  }

  static async sendBirthdayWish(memberId: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { branch: true },
    })

    if (!member || !member.dateOfBirth) return

    const template = await prisma.communicationTemplate.findFirst({
      where: {
        tenantId: member.tenantId,
        category: 'BIRTHDAY_WISH',
        templateType: 'EMAIL',
        isActive: true,
      },
    })

    if (!template) return

    const variables = {
      member_name: `${member.firstName} ${member.lastName}`,
      branch_name: member.branch.name,
      age: new Date().getFullYear() - member.dateOfBirth.getFullYear(),
    }

    const processedContent = this.processTemplate(template.content, variables)
    const processedSubject = this.processTemplate(template.subject || 'Happy Birthday!', variables)

    if (member.email) {
      await this.sendEmail(member.tenantId, member.branchId, {
        to: member.email,
        subject: processedSubject,
        content: processedContent,
        htmlContent: template.htmlContent ? this.processTemplate(template.htmlContent, variables) : undefined,
        templateId: template.id,
        memberId: member.id,
      })
    }
  }

  // Announcement Management
  static async createAnnouncement(data: {
    tenantId: string
    branchId?: string
    title: string
    content: string
    priority?: string
    targetRoles?: string[]
    publishAt?: Date
    expiresAt?: Date
    createdBy: string
  }) {
    return await prisma.announcement.create({
      data: {
        ...data,
        priority: data.priority || 'NORMAL',
        targetRoles: data.targetRoles || [],
        publishAt: data.publishAt || new Date(),
      },
    })
  }

  static async getAnnouncements(tenantId: string, branchId?: string, userRoles?: string[]) {
    return await prisma.announcement.findMany({
      where: {
        tenantId,
        ...(branchId && {
          OR: [
            { branchId },
            { branchId: null },
          ],
        }),
        isActive: true,
        publishAt: { lte: new Date() },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
        ...(userRoles && {
          OR: [
            { targetRoles: { isEmpty: true } },
            { targetRoles: { hasSome: userRoles } },
          ],
        }),
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { publishAt: 'desc' },
      ],
    })
  }

  // Feedback Management
  static async createFeedback(data: {
    tenantId: string
    branchId?: string
    memberId?: string
    userId?: string
    feedbackType: any
    rating?: number
    title?: string
    content: string
    isAnonymous?: boolean
    metadata?: any
  }) {
    return await prisma.feedback.create({
      data: {
        ...data,
        isAnonymous: data.isAnonymous || false,
      },
    })
  }

  static async getFeedbacks(tenantId: string, branchId?: string, feedbackType?: any) {
    return await prisma.feedback.findMany({
      where: {
        tenantId,
        ...(branchId && { branchId }),
        ...(feedbackType && { feedbackType }),
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            membershipId: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Test Functions
  static async sendTestEmail(tenantId: string, branchId: string, testEmail: string) {
    return await this.sendEmail(tenantId, branchId, {
      to: testEmail,
      subject: 'Test Email from GymPro',
      content: 'This is a test email to verify your email configuration is working correctly.',
      htmlContent: '<p>This is a test email to verify your email configuration is working correctly.</p>',
    })
  }

  static async sendTestSms(tenantId: string, branchId: string, testPhone: string) {
    return await this.sendSms(tenantId, branchId, {
      to: testPhone,
      content: 'Test SMS from GymPro. Your SMS configuration is working correctly.',
    })
  }

  // Private helper methods
  private static async createEmailTransporter(emailConfig: any) {
    const nodemailer = require('nodemailer')
    
    switch (emailConfig.provider) {
      case 'SMTP':
        return nodemailer.createTransporter({
          host: emailConfig.config.host,
          port: emailConfig.config.port,
          secure: emailConfig.config.secure,
          auth: {
            user: emailConfig.config.username,
            pass: emailConfig.config.password,
          },
        })

      case 'SENDGRID':
        return nodemailer.createTransporter({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: emailConfig.config.apiKey,
          },
        })

      case 'MAILGUN':
        return nodemailer.createTransporter({
          service: 'Mailgun',
          auth: {
            user: emailConfig.config.username,
            pass: emailConfig.config.password,
          },
        })

      default:
        throw new Error(`Unsupported email provider: ${emailConfig.provider}`)
    }
  }

  private static async sendSmsViaProvider(smsConfig: any, to: string, content: string) {
    switch (smsConfig.provider) {
      case 'TWILIO':
        // Mock Twilio implementation
        return { messageId: `twilio_${Date.now()}` }

      case 'MSG91':
        // Mock MSG91 implementation
        return { messageId: `msg91_${Date.now()}` }

      case 'TEXTLOCAL':
        // Mock TextLocal implementation
        return { messageId: `textlocal_${Date.now()}` }

      default:
        throw new Error(`Unsupported SMS provider: ${smsConfig.provider}`)
    }
  }

  private static async sendWhatsAppViaProvider(whatsappConfig: any, data: SendWhatsAppData) {
    switch (whatsappConfig.provider) {
      case 'WHATSAPP_BUSINESS':
        // Mock WhatsApp Business API implementation
        return { messageId: `whatsapp_${Date.now()}` }

      case 'TWILIO_WHATSAPP':
        // Mock Twilio WhatsApp implementation
        return { messageId: `twilio_wa_${Date.now()}` }

      default:
        throw new Error(`Unsupported WhatsApp provider: ${whatsappConfig.provider}`)
    }
  }

  // Campaign Management
  static async createCampaign(data: {
    tenantId: string
    branchId?: string
    name: string
    description?: string
    campaignType: any
    triggerType: any
    targetAudience: any
    templateIds: string[]
    scheduledAt?: Date
    createdBy: string
  }) {
    return await prisma.campaign.create({
      data,
    })
  }

  static async getCampaigns(tenantId: string, branchId?: string) {
    return await prisma.campaign.findMany({
      where: {
        tenantId,
        ...(branchId && { branchId }),
      },
      include: {
        recipients: {
          include: {
            member: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Notification Management
  static async createNotification(data: {
    tenantId: string
    memberId?: string
    userId?: string
    type: NotificationType
    channel: NotificationChannel
    title: string
    message: string
    actionUrl?: string
    scheduledAt?: Date
    metadata?: any
  }) {
    return await prisma.notification.create({
      data,
    })
  }

  static async getNotifications(userId: string, unreadOnly = false) {
    return await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  static async markNotificationAsRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  // Analytics
  static async getCommunicationStats(tenantId: string, branchId?: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId }
    if (branchId) where.branchId = branchId
    if (startDate && endDate) {
      where.createdAt = { gte: startDate, lte: endDate }
    }

    const [emailStats, smsStats, whatsappStats] = await Promise.all([
      prisma.emailLog.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.smsLog.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.whatsAppLog.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
    ])

    return {
      email: emailStats,
      sms: smsStats,
      whatsapp: whatsappStats,
    }
  }
}