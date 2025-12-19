'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

export async function createFeedback(data: {
  memberId?: string
  category: string
  rating: number
  comment: string
  isAnonymous?: boolean
}) {
  const context = await requirePermission('feedback.create')

  const feedback = await prisma.feedback.create({
    data: {
      tenantId: context.tenantId,
      memberId: data.isAnonymous ? null : data.memberId,
      category: data.category,
      rating: data.rating,
      comment: data.comment,
      isAnonymous: data.isAnonymous || false,
      status: 'submitted',
    },
  })

  await AuditLogger.logCreate(
    context.userId,
    context.tenantId,
    'Feedback',
    feedback.id,
    feedback as any
  )

  return feedback
}

export async function getFeedback(filters?: {
  category?: string
  rating?: number
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  const context = await requirePermission('feedback.view')

  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const skip = (page - 1) * limit

  const where: any = {
    tenantId: context.tenantId,
    ...(filters?.category && { category: filters.category }),
    ...(filters?.rating && { rating: filters.rating }),
    ...(filters?.startDate && {
      createdAt: {
        gte: filters.startDate,
        ...(filters?.endDate && { lte: filters.endDate }),
      },
    }),
  }

  const [feedback, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        member: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.feedback.count({ where }),
  ])

  return { feedback, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getFeedbackMetrics() {
  const context = await requirePermission('feedback.view')

  const feedback = await prisma.feedback.findMany({
    where: { tenantId: context.tenantId },
    select: { rating: true, category: true },
  })

  const totalFeedback = feedback.length
  const averageRating = feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback || 0
  
  const sentimentDistribution = {
    positive: feedback.filter((f) => f.rating >= 4).length,
    neutral: feedback.filter((f) => f.rating === 3).length,
    negative: feedback.filter((f) => f.rating <= 2).length,
  }

  const categoryBreakdown = feedback.reduce((acc: any, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1
    return acc
  }, {})

  return {
    totalFeedback,
    averageRating,
    sentimentDistribution,
    categoryBreakdown,
  }
}
