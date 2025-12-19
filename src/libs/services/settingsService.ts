import { prisma } from '@/libs/prisma'
import { Setting } from '@prisma/client'
// import { encrypt, decrypt } from '@/libs/encryption'

/**
 * ⚠️ SECURITY WARNING: Encryption not implemented
 * 
 * Settings marked with isEncrypted: true are currently stored in PLAINTEXT.
 * Before deploying to production, implement encryption in @/libs/encryption
 * and uncomment the import above.
 * 
 * See: src/libs/encryption.ts for implementation requirements
 */

export interface CreateSettingData {
  tenantId: string
  branchId?: string | null
  key: string
  value: any // Will be stored as JSON
  description?: string
  isEncrypted?: boolean
}

export interface UpdateSettingData {
  value: any
  description?: string
}

export interface SettingFilters {
  tenantId: string
  branchId?: string | null
  keyPrefix?: string // e.g., 'payment.', 'branding.'
  keys?: string[] // Filter by specific keys
}

export class SettingsService {
  /**
   * Get a single setting by key
   */
  static async getSetting(
    tenantId: string,
    key: string,
    branchId?: string | null
  ): Promise<Setting | null> {
    return await prisma.setting.findUnique({
      where: {
        tenantId_branchId_key: {
          tenantId,
          branchId: branchId || null,
          key,
        },
      },
    })
  }

  /**
   * Get multiple settings with filters
   */
  static async getSettings(filters: SettingFilters): Promise<Setting[]> {
    const where: any = {
      tenantId: filters.tenantId,
    }

    // Branch-specific or tenant-wide settings
    if (filters.branchId !== undefined) {
      where.branchId = filters.branchId
    }

    // Filter by key prefix (e.g., all payment.* settings)
    if (filters.keyPrefix) {
      where.key = {
        startsWith: filters.keyPrefix,
      }
    }

    // Filter by specific keys
    if (filters.keys && filters.keys.length > 0) {
      where.key = {
        in: filters.keys,
      }
    }

    return await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    })
  }

  /**
   * Create or update a setting (upsert)
   */
  static async upsertSetting(data: CreateSettingData): Promise<Setting> {
    const { tenantId, branchId, key, ...settingData } = data

    return await prisma.setting.upsert({
      where: {
        tenantId_branchId_key: {
          tenantId,
          branchId: branchId || null,
          key,
        },
      },
      update: {
        value: settingData.value,
        description: settingData.description,
        isEncrypted: settingData.isEncrypted,
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        branchId: branchId || null,
        key,
        value: settingData.value,
        description: settingData.description,
        isEncrypted: settingData.isEncrypted || false,
      },
    })
  }

  /**
   * Update an existing setting
   */
  static async updateSetting(
    tenantId: string,
    key: string,
    branchId: string | null | undefined,
    data: UpdateSettingData
  ): Promise<Setting> {
    return await prisma.setting.update({
      where: {
        tenantId_branchId_key: {
          tenantId,
          branchId: branchId || null,
          key,
        },
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Delete a setting
   */
  static async deleteSetting(
    tenantId: string,
    key: string,
    branchId?: string | null
  ): Promise<void> {
    await prisma.setting.delete({
      where: {
        tenantId_branchId_key: {
          tenantId,
          branchId: branchId || null,
          key,
        },
      },
    })
  }

  /**
   * Bulk upsert multiple settings
   */
  static async bulkUpsertSettings(settings: CreateSettingData[]): Promise<Setting[]> {
    const results: Setting[] = []

    for (const setting of settings) {
      const result = await this.upsertSetting(setting)
      results.push(result)
    }

    return results
  }

  /**
   * Get all payment gateway settings
   */
  static async getPaymentSettings(
    tenantId: string,
    branchId?: string | null
  ): Promise<Setting[]> {
    return await this.getSettings({
      tenantId,
      branchId,
      keyPrefix: 'payment.',
    })
  }

  /**
   * Get all branding settings
   */
  static async getBrandingSettings(
    tenantId: string,
    branchId?: string | null
  ): Promise<Setting[]> {
    return await this.getSettings({
      tenantId,
      branchId,
      keyPrefix: 'branding.',
    })
  }

  /**
   * Get backup settings
   */
  static async getBackupSettings(tenantId: string): Promise<Setting | null> {
    return await this.getSetting(tenantId, 'backup.config', null)
  }

  /**
   * Get communication template settings
   */
  static async getTemplateSettings(
    tenantId: string,
    branchId?: string | null
  ): Promise<Setting[]> {
    return await this.getSettings({
      tenantId,
      branchId,
      keyPrefix: 'template.',
    })
  }

  /**
   * Get settings grouped by category
   */
  static async getSettingsByCategory(
    tenantId: string,
    branchId?: string | null
  ): Promise<{
    payment: Setting[]
    branding: Setting[]
    templates: Setting[]
    backup: Setting[]
    other: Setting[]
  }> {
    const allSettings = await this.getSettings({ tenantId, branchId })

    const categorized = {
      payment: [] as Setting[],
      branding: [] as Setting[],
      templates: [] as Setting[],
      backup: [] as Setting[],
      other: [] as Setting[],
    }

    for (const setting of allSettings) {
      if (setting.key.startsWith('payment.')) {
        categorized.payment.push(setting)
      } else if (setting.key.startsWith('branding.')) {
        categorized.branding.push(setting)
      } else if (setting.key.startsWith('template.')) {
        categorized.templates.push(setting)
      } else if (setting.key.startsWith('backup.')) {
        categorized.backup.push(setting)
      } else {
        categorized.other.push(setting)
      }
    }

    return categorized
  }
}
