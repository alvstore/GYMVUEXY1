'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

export async function getSettings() {
  const context = await requirePermission('settings.view')

  const settings = await prisma.setting.findFirst({
    where: { tenantId: context.tenantId },
  })

  return settings || {}
}

export async function updateSettings(data: {
  logo?: string
  currency?: string
  timezone?: string
  locale?: string
  gstNumber?: string
  gstRate?: number
  emailFrom?: string
  emailReplyTo?: string
  smsProvider?: string
  smsApiKey?: string
  whatsappProvider?: string
  whatsappApiKey?: string
  paymentGateway?: string
  paymentWebhookSecret?: string
  backupFrequency?: string
  backupTime?: string
}) {
  const context = await requirePermission('settings.update')

  const settings = await prisma.setting.upsert({
    where: {
      tenantId: context.tenantId,
    },
    update: {
      ...data,
      updatedAt: new Date(),
    },
    create: {
      tenantId: context.tenantId,
      ...data,
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'UPDATE',
    entity: 'Settings',
    entityId: settings.id,
    changes: { new: data },
  })

  return settings
}

export async function uploadLogo(file: FormData) {
  const context = await requirePermission('settings.update')

  return { url: '/uploads/logo.png' }
}

export async function recordBackupJob(data: {
  type: string
  status: string
  size?: number
  duration?: number
  error?: string
}) {
  const context = await requirePermission('settings.backup')

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    action: 'CREATE',
    entity: 'BackupJob',
    entityId: `backup-${Date.now()}`,
    metadata: data,
  })

  return { success: true }
}

export async function testWebhook(webhookUrl: string, event: string) {
  const context = await requirePermission('settings.webhook')

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        tenantId: context.tenantId,
        timestamp: new Date().toISOString(),
        data: { test: true },
      }),
    })

    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'Webhook test successful' : 'Webhook test failed',
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send webhook',
    }
  }
}
