'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'
import { ValidationHelper } from '@/libs/validation'

export async function updateMemberKYC(memberId: string, data: {
  idProofType?: string
  idProofNumber?: string
  idProofFrontUrl?: string
  idProofBackUrl?: string
  avatarUrl?: string
}) {
  const context = await requirePermission('members.update')

  if (data.idProofType && data.idProofNumber) {
    if (!ValidationHelper.validateIdProof(data.idProofType, data.idProofNumber)) {
      throw new Error('Invalid ID proof number format')
    }
  }

  const oldMember = await prisma.member.findFirst({
    where: {
      id: memberId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!oldMember) {
    throw new Error('Member not found')
  }

  const member = await prisma.member.update({
    where: { id: memberId },
    data: {
      idProofType: data.idProofType,
      idProofNumber: data.idProofNumber,
      idProofFrontUrl: data.idProofFrontUrl,
      idProofBackUrl: data.idProofBackUrl,
      avatarUrl: data.avatarUrl,
    },
  })

  await AuditLogger.logUpdate(
    context.userId,
    context.tenantId,
    'Member',
    member.id,
    { kycBefore: { idProofType: oldMember.idProofType } } as any,
    { kycAfter: { idProofType: member.idProofType } } as any,
    member.branchId
  )

  return {
    ...member,
    idProofNumber: member.idProofNumber ? ValidationHelper.maskIdProof(member.idProofNumber) : null,
  }
}

export async function verifyMemberKYC(memberId: string, verified: boolean, verificationNotes?: string) {
  const context = await requirePermission('members.verify_kyc')

  const oldMember = await prisma.member.findFirst({
    where: {
      id: memberId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
  })

  if (!oldMember) {
    throw new Error('Member not found')
  }

  const updatedMember = await prisma.member.update({
    where: { id: memberId },
    data: {
      notes: verificationNotes
        ? `${oldMember.notes || ''}\n[KYC ${verified ? 'VERIFIED' : 'REJECTED'}]: ${verificationNotes}`.trim()
        : oldMember.notes,
    },
  })

  await AuditLogger.logUpdate(
    context.userId,
    context.tenantId,
    'Member',
    updatedMember.id,
    oldMember as any,
    { ...updatedMember, kycVerified: verified } as any,
    updatedMember.branchId
  )

  return {
    success: true,
    verified,
    notes: verificationNotes,
    member: updatedMember,
  }
}

export async function getMemberKYC(memberId: string) {
  const context = await requirePermission('members.view')

  const member = await prisma.member.findFirst({
    where: {
      id: memberId,
      tenantId: context.tenantId,
      ...(context.branchId && { branchId: context.branchId }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      idProofType: true,
      idProofNumber: true,
      idProofFrontUrl: true,
      idProofBackUrl: true,
    },
  })

  if (!member) {
    throw new Error('Member not found')
  }

  return {
    ...member,
    idProofNumber: member.idProofNumber ? ValidationHelper.maskIdProof(member.idProofNumber) : null,
  }
}
