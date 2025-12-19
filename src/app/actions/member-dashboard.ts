'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'

// Simplified member dashboard actions - diet, workout, products

export async function getMemberDashboardData(memberId: string) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      goals: { where: { status: 'ACTIVE' }, take: 5 },
      measurements: { orderBy: { measurementDate: 'desc' }, take: 3 },
    },
  })

  return member
}

export async function getShopProducts(limit = 12) {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    take: limit,
    orderBy: { name: 'asc' },
  })

  return products
}

export async function getProductsByCategory(category: string, limit = 10) {
  const products = await prisma.product.findMany({
    where: { category, status: 'ACTIVE' },
    take: limit,
  })
  return products
}

export async function recordMeasurement(memberId: string, weight?: number, chest?: number, waist?: number) {
  const context = await requirePermission('self.update')

  const measurement = await prisma.measurement.create({
    data: {
      memberId,
      measurementDate: new Date(),
      weight,
      chest,
      waist,
      notes: 'Self-recorded',
    },
  })

  return measurement
}

export async function getMeasurementHistory(memberId: string, limit = 6) {
  const measurements = await prisma.measurement.findMany({
    where: { memberId },
    orderBy: { measurementDate: 'desc' },
    take: limit,
  })

  return measurements
}
