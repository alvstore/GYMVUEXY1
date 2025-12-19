'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

export async function getLockers(filters?: {
  status?: string
  branchId?: string
}) {
  const context = await requirePermission('lockers.view')

  const branchFilter = context.branchId || filters?.branchId

  const lockers = await prisma.locker.findMany({
    where: {
      tenantId: context.tenantId,
      ...(branchFilter && { branchId: branchFilter }),
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      lockerAssignments: {
        where: { isActive: true },
        include: { member: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: { lockerNumber: 'asc' },
  })

  return lockers
}

export async function rentLocker(data: {
  lockerId: string
  memberId: string
  startDate: Date
  endDate: Date
  amount: number
}) {
  const context = await requirePermission('lockers.rent')

  const locker = await prisma.locker.findFirst({
    where: {
      id: data.lockerId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
      status: 'available',
    },
  })

  if (!locker) throw new Error('Locker not available')

  const assignment = await prisma.$transaction(async (tx) => {
    await tx.locker.update({
      where: {
        id: data.lockerId,
        tenantId: context.tenantId,
      },
      data: { status: 'occupied' },
    })

    const newAssignment = await tx.lockerAssignment.create({
      data: {
        lockerId: data.lockerId,
        memberId: data.memberId,
        startDate: data.startDate,
        endDate: data.endDate,
        amount: data.amount,
        status: 'active',
        isActive: true,
      },
    })

    return newAssignment
  })

  await AuditLogger.logCreate(
    context.userId,
    context.tenantId,
    'LockerAssignment',
    assignment.id,
    assignment as any
  )

  return assignment
}

export async function returnLocker(assignmentId: string) {
  const context = await requirePermission('lockers.return')

  const assignment = await prisma.lockerAssignment.findFirst({
    where: { id: assignmentId, isActive: true },
    include: {
      locker: {
        where: {
          tenantId: context.tenantId,
          ...(context.branchId && { branchId: context.branchId }),
        },
      },
    },
  })

  if (!assignment || !assignment.locker) throw new Error('Assignment not found')
  
  if (assignment.locker.tenantId !== context.tenantId) {
    throw new Error('Unauthorized access to locker assignment')
  }

  await prisma.$transaction(async (tx) => {
    await tx.lockerAssignment.update({
      where: {
        id: assignmentId,
      },
      data: { isActive: false, status: 'returned', returnedAt: new Date() },
    })

    await tx.locker.update({
      where: {
        id: assignment.lockerId,
        tenantId: context.tenantId,
      },
      data: { status: 'available' },
    })
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'UPDATE',
    entity: 'LockerAssignment',
    entityId: assignmentId,
    metadata: { action: 'return' },
  })

  return { success: true }
}

export async function createEquipmentTicket(data: {
  equipmentName: string
  issueType: string
  description: string
  priority: string
}) {
  const context = await requirePermission('equipment.create')

  const ticket = await prisma.accessAlert.create({
    data: {
      tenantId: context.tenantId,
      branchId: context.branchId || '',
      deviceId: data.equipmentName,
      alertType: data.issueType,
      severity: data.priority,
      message: data.description,
      status: 'open',
      createdAt: new Date(),
    },
  })

  await AuditLogger.logCreate(
    context.userId,
    context.tenantId,
    'EquipmentTicket',
    ticket.id,
    ticket as any
  )

  return ticket
}

export async function updateEquipmentTicket(id: string, status: string) {
  const context = await requirePermission('equipment.update')

  const ticket = await prisma.accessAlert.update({
    where: {
      id,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    data: { status, resolvedAt: status === 'resolved' ? new Date() : undefined },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'UPDATE',
    entity: 'EquipmentTicket',
    entityId: id,
    metadata: { newStatus: status },
  })

  return ticket
}
