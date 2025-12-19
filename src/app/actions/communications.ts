'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

export async function getTemplates(type?: string) {
  const context = await requirePermission('communications.view')

  const templates = await prisma.communicationTemplate.findMany({
    where: {
      tenantId: context.tenantId,
      ...(type && { type }),
    },
    orderBy: { createdAt: 'desc' },
  })

  return templates
}

export async function createTemplate(data: {
  name: string
  type: string
  channel: string
  subject?: string
  body: string
  variables?: string[]
  dltTemplateId?: string
}) {
  const context = await requirePermission('communications.create')

  const template = await prisma.communicationTemplate.create({
    data: {
      tenantId: context.tenantId,
      name: data.name,
      type: data.type,
      channel: data.channel,
      subject: data.subject,
      body: data.body,
      variables: data.variables || [],
      dltTemplateId: data.dltTemplateId,
      isActive: true,
    },
  })

  await AuditLogger.logCreate(
    context.userId,
    context.tenantId,
    'CommunicationTemplate',
    template.id,
    template as any
  )

  return template
}

export async function createCampaign(data: {
  name: string
  templateId: string
  targetAudience: string
  scheduledAt?: Date
  memberIds?: string[]
}) {
  const context = await requirePermission('communications.campaign')

  const template = await prisma.communicationTemplate.findFirst({
    where: { id: data.templateId, tenantId: context.tenantId },
  })

  if (!template) throw new Error('Template not found')

  let memberIds = data.memberIds || []

  if (memberIds.length > 0 && context.branchId) {
    const validMembers = await prisma.member.findMany({
      where: {
        id: { in: memberIds },
        tenantId: context.tenantId,
        branchId: context.branchId,
        isActive: true,
      },
      select: { id: true },
    })
    
    if (validMembers.length !== memberIds.length) {
      throw new Error('Some members are not accessible in your branch')
    }
  }

  if (!memberIds.length && data.targetAudience === 'all') {
    const members = await prisma.member.findMany({
      where: {
        tenantId: context.tenantId,
        isActive: true,
        ...(context.branchId && { branchId: context.branchId }),
      },
      select: { id: true },
    })
    memberIds = members.map((m) => m.id)
  }

  const campaign = await prisma.$transaction(async (tx) => {
    const newCampaign = await tx.campaign.create({
      data: {
        tenantId: context.tenantId,
        name: data.name,
        templateId: data.templateId,
        targetAudience: data.targetAudience,
        scheduledAt: data.scheduledAt || new Date(),
        status: 'scheduled',
        totalRecipients: memberIds.length,
      },
    })

    await tx.campaignRecipient.createMany({
      data: memberIds.map((memberId) => ({
        campaignId: newCampaign.id,
        memberId,
        status: 'pending',
      })),
    })

    return newCampaign
  })

  await AuditLogger.logCreate(
    context.userId,
    context.tenantId,
    'Campaign',
    campaign.id,
    campaign as any
  )

  return campaign
}

export async function sendTransactionalMessage(data: {
  memberId: string
  templateId: string
  channel: string
  variables?: Record<string, string>
  event: string
}) {
  const context = await requirePermission('communications.send')

  const [template, member] = await Promise.all([
    prisma.communicationTemplate.findFirst({
      where: { id: data.templateId, tenantId: context.tenantId },
    }),
    prisma.member.findFirst({
      where: {
        id: data.memberId,
        tenantId: context.tenantId,
        ...(context.branchId && { branchId: context.branchId }),
      },
    }),
  ])

  if (!template || !member) {
    throw new Error('Template or member not found')
  }

  let body = template.body
  if (data.variables) {
    Object.entries(data.variables).forEach(([key, value]) => {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })
  }

  const message = {
    to: data.channel === 'email' ? member.email : member.phone,
    subject: template.subject,
    body,
    channel: data.channel,
  }

  if (data.channel === 'email') {
    await prisma.emailLog.create({
      data: {
        tenantId: context.tenantId,
        recipient: member.email,
        subject: template.subject || '',
        body,
        status: 'sent',
        sentAt: new Date(),
      },
    })
  } else if (data.channel === 'sms') {
    await prisma.smsLog.create({
      data: {
        tenantId: context.tenantId,
        recipient: member.phone,
        message: body,
        status: 'sent',
        sentAt: new Date(),
      },
    })
  } else if (data.channel === 'whatsapp') {
    await prisma.whatsappLog.create({
      data: {
        tenantId: context.tenantId,
        recipient: member.phone,
        message: body,
        status: 'sent',
        sentAt: new Date(),
      },
    })
  }

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'CREATE',
    entity: 'TransactionalMessage',
    entityId: member.id,
    metadata: { event: data.event, channel: data.channel },
  })

  return message
}
