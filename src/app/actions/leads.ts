'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission, getAuthContext } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

export async function getLeads(filters?: {
  status?: string
  source?: string
  branchId?: string
  assignedTo?: string
  page?: number
  limit?: number
}) {
  const context = await requirePermission('leads.view')

  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const skip = (page - 1) * limit

  const where: any = {
    tenantId: context.tenantId,
    ...(context.branchId && { branchId: context.branchId }),
    ...(filters?.status && { stage: filters.status }),
    ...(filters?.source && { source: filters.source }),
    ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { activities: { take: 1, orderBy: { createdAt: 'desc' } } },
    }),
    prisma.lead.count({ where }),
  ])

  return { leads, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getLeadById(id: string) {
  const context = await requirePermission('leads.view')
  
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: 'desc' }, take: 20 } },
  })
  
  return lead
}

export async function createLead(data: {
  firstName: string
  lastName: string
  email?: string
  phone: string
  source?: string
  interestedIn?: string
  notes?: string
}) {
  const context = await requirePermission('leads.create')

  const lead = await prisma.lead.create({
    data: {
      tenantId: context.tenantId!,
      branchId: context.branchId!,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      source: (data.source as any) || 'WALK_IN',
      stage: 'NEW',
      score: 0,
      interestedIn: data.interestedIn,
      notes: data.notes,
    },
  })

  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: 'NOTE',
      title: 'Lead Created',
      description: `New lead from ${data.source || 'WALK_IN'}`,
      performedBy: context.userId,
    },
  })

  await AuditLogger.logCreate(context.userId!, context.tenantId!, 'Lead', lead.id, lead as any)

  return lead
}

export async function updateLead(id: string, data: {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  stage?: string
  score?: number
  interestedIn?: string
  notes?: string
  assignedTo?: string
  nextFollowUp?: Date
  lostReason?: string
}) {
  const context = await requirePermission('leads.update')

  const lead = await prisma.lead.update({
    where: { id },
    data: data as any,
  })

  return lead
}

export async function updateLeadStage(id: string, stage: string, notes?: string) {
  const context = await requirePermission('leads.update')

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      stage: stage as any,
      ...(stage === 'WON' ? { convertedAt: new Date() } : {}),
    },
  })

  await prisma.leadActivity.create({
    data: {
      leadId: id,
      type: 'NOTE',
      title: `Stage Updated to ${stage}`,
      description: notes,
      performedBy: context.userId,
      completedAt: new Date(),
    },
  })

  await AuditLogger.log({
    userId: context.userId!,
    tenantId: context.tenantId!,
    action: 'UPDATE',
    entity: 'Lead',
    entityId: id,
    metadata: { action: 'move_stage', newStage: stage },
  })

  return lead
}

export async function addLeadActivity(leadId: string, data: {
  type: string
  title: string
  description?: string
  scheduledAt?: Date
  outcome?: string
}) {
  const context = await requirePermission('leads.update')

  const activity = await prisma.leadActivity.create({
    data: {
      leadId,
      type: data.type as any,
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt,
      outcome: data.outcome,
      performedBy: context.userId,
      completedAt: data.outcome ? new Date() : null,
    },
  })

  const scoreIncrement = data.outcome ? 5 : 2
  await prisma.lead.update({
    where: { id: leadId },
    data: { score: { increment: scoreIncrement } },
  })

  return activity
}

export async function deleteLead(id: string) {
  const context = await requirePermission('leads.delete')
  await prisma.lead.delete({ where: { id } })
}

export async function getLeadStats(branchId?: string) {
  const context = await requirePermission('leads.view')
  
  const whereClause = branchId ? { branchId } : { tenantId: context.tenantId! }

  const [total, newLeads, contacted, qualified, tourScheduled, won, lost] = await Promise.all([
    prisma.lead.count({ where: whereClause }),
    prisma.lead.count({ where: { ...whereClause, stage: 'NEW' } }),
    prisma.lead.count({ where: { ...whereClause, stage: 'CONTACTED' } }),
    prisma.lead.count({ where: { ...whereClause, stage: 'QUALIFIED' } }),
    prisma.lead.count({ where: { ...whereClause, stage: 'TOUR_SCHEDULED' } }),
    prisma.lead.count({ where: { ...whereClause, stage: 'WON' } }),
    prisma.lead.count({ where: { ...whereClause, stage: 'LOST' } }),
  ])

  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const conversionsThisMonth = await prisma.lead.count({
    where: { ...whereClause, stage: 'WON', convertedAt: { gte: thisMonth } },
  })

  const followUpsDue = await prisma.lead.count({
    where: {
      ...whereClause,
      nextFollowUp: { lte: new Date() },
      stage: { notIn: ['WON', 'LOST'] },
    },
  })

  return {
    total,
    newLeads,
    contacted,
    qualified,
    tourScheduled,
    won,
    lost,
    conversionsThisMonth,
    followUpsDue,
    conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
  }
}

export async function getLeadsByStage(branchId?: string) {
  const context = await requirePermission('leads.view')
  
  const whereClause = branchId ? { branchId } : { tenantId: context.tenantId! }

  const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'TOUR_SCHEDULED', 'TOUR_COMPLETED', 'PROPOSAL_SENT', 'NEGOTIATION']
  
  const pipeline: { stage: string; leads: any[] }[] = []

  for (const stage of stages) {
    const leads = await prisma.lead.findMany({
      where: { ...whereClause, stage: stage as any },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    pipeline.push({ stage, leads })
  }

  return pipeline
}

export async function convertLeadToMember(id: string, membershipPlanId: string) {
  const context = await requirePermission('leads.update')

  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) throw new Error('Lead not found')

  const member = await prisma.member.create({
    data: {
      tenantId: lead.tenantId,
      branchId: lead.branchId,
      membershipNumber: `MEM${Date.now().toString().slice(-8)}`,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      memberStatus: 'ACTIVE',
      source: lead.source,
    },
  })

  await prisma.lead.update({
    where: { id },
    data: {
      stage: 'WON',
      convertedAt: new Date(),
      convertedToMemberId: member.id,
    },
  })

  await prisma.leadActivity.create({
    data: {
      leadId: id,
      type: 'NOTE',
      title: 'Converted to Member',
      description: `Lead converted to member ${member.id}`,
      performedBy: context.userId,
      completedAt: new Date(),
    },
  })

  await AuditLogger.log({
    userId: context.userId!,
    tenantId: context.tenantId!,
    action: 'CREATE',
    entity: 'Member',
    entityId: member.id,
    metadata: { action: 'convert_from_lead', leadId: id, planId: membershipPlanId },
  })

  return member
}

export async function moveLead(id: string, stage: string) {
  return updateLeadStage(id, stage)
}
