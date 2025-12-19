'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission, getAuthContext } from '@/libs/serverAuth'

export async function getEquipmentList(branchId?: string) {
  const context = await requirePermission('equipment.view')

  const equipment = await prisma.equipment.findMany({
    where: branchId ? { branchId } : { tenantId: context.tenantId },
    include: { maintenance: { take: 1, orderBy: { performedAt: 'desc' } } },
    orderBy: { name: 'asc' },
  })

  return equipment
}

export async function getEquipmentById(id: string) {
  const context = await requirePermission('equipment.view')
  
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: { maintenance: { orderBy: { performedAt: 'desc' }, take: 10 } },
  })
  
  return equipment
}

export async function createEquipment(data: {
  name: string
  category: 'CARDIO' | 'STRENGTH' | 'FREE_WEIGHTS' | 'FUNCTIONAL' | 'STRETCHING' | 'STUDIO' | 'ACCESSORIES' | 'OTHER'
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate?: Date
  purchasePrice?: number
  warrantyExpiry?: Date
  location?: string
  notes?: string
}) {
  const context = await requirePermission('equipment.create')

  const equipment = await prisma.equipment.create({
    data: {
      tenantId: context.tenantId!,
      branchId: context.branchId!,
      ...data,
    },
  })

  return equipment
}

export async function updateEquipment(id: string, data: {
  name?: string
  category?: 'CARDIO' | 'STRENGTH' | 'FREE_WEIGHTS' | 'FUNCTIONAL' | 'STRETCHING' | 'STUDIO' | 'ACCESSORIES' | 'OTHER'
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'NEEDS_REPAIR'
  status?: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER' | 'RETIRED'
  location?: string
  notes?: string
}) {
  const context = await requirePermission('equipment.update')

  const equipment = await prisma.equipment.update({
    where: { id },
    data,
  })

  return equipment
}

export async function deleteEquipment(id: string) {
  const context = await requirePermission('equipment.delete')
  await prisma.equipment.delete({ where: { id } })
}

export async function scheduleMaintenanceAction(equipmentId: string, data: {
  maintenanceType: 'ROUTINE' | 'REPAIR' | 'INSPECTION' | 'REPLACEMENT' | 'CLEANING'
  description: string
  performedBy?: string
  cost?: number
  vendorName?: string
  nextDueDate?: Date
}) {
  const context = await requirePermission('equipment.update')

  const maintenance = await prisma.equipmentMaintenance.create({
    data: {
      equipmentId,
      ...data,
      status: 'COMPLETED',
    },
  })

  await prisma.equipment.update({
    where: { id: equipmentId },
    data: {
      lastMaintenance: new Date(),
      nextMaintenance: data.nextDueDate,
    },
  })

  return maintenance
}

export async function getMaintenanceHistory(equipmentId: string) {
  const maintenance = await prisma.equipmentMaintenance.findMany({
    where: { equipmentId },
    orderBy: { performedAt: 'desc' },
  })
  return maintenance
}

export async function getEquipmentStats(branchId?: string) {
  const context = await requirePermission('equipment.view')
  
  const whereClause = branchId ? { branchId } : { tenantId: context.tenantId }

  const [total, operational, underMaintenance, outOfOrder, needsRepair] = await Promise.all([
    prisma.equipment.count({ where: whereClause }),
    prisma.equipment.count({ where: { ...whereClause, status: 'OPERATIONAL' } }),
    prisma.equipment.count({ where: { ...whereClause, status: 'UNDER_MAINTENANCE' } }),
    prisma.equipment.count({ where: { ...whereClause, status: 'OUT_OF_ORDER' } }),
    prisma.equipment.count({ where: { ...whereClause, condition: 'NEEDS_REPAIR' } }),
  ])

  const upcomingMaintenance = await prisma.equipment.count({
    where: {
      ...whereClause,
      nextMaintenance: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    },
  })

  return {
    total,
    operational,
    underMaintenance,
    outOfOrder,
    needsRepair,
    upcomingMaintenance,
  }
}

export async function getEquipmentDueForMaintenance(branchId?: string) {
  const context = await requirePermission('equipment.view')
  
  const equipment = await prisma.equipment.findMany({
    where: {
      ...(branchId ? { branchId } : { tenantId: context.tenantId }),
      nextMaintenance: { lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { nextMaintenance: 'asc' },
    take: 10,
  })

  return equipment
}
