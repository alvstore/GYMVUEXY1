'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { BranchService } from '@/libs/services/branchService'
import { RBACService } from '@/libs/rbac'

export async function getBranches() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = session.user as any
  const userId = user.id || user.sub
  const tenantId = user.tenantId || 'tenant-demo-001'
  const permissions = user.permissions || ['*']

  if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'branches.view')) {
    throw new Error('You do not have permission to view branches')
  }

  try {
    const result = await BranchService.getBranches(
      { tenantId, isActive: true },
      1,
      100
    )

    return { branches: result.branches, total: result.total }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch branches'
    console.error('Get branches error:', errorMessage)
    throw new Error(errorMessage)
  }
}

export async function createBranch(data: {
  name: string
  code: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  country?: string | null
  phone?: string
  email?: string
  currency: string
  timezone: string
  logo?: string
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = session.user as any
  const userId = user.id || user.sub
  const tenantId = user.tenantId || 'tenant-demo-001'
  const permissions = user.permissions || ['*']

  if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'branches.create')) {
    throw new Error('You do not have permission to create branches')
  }

  try {
    const isUnique = await BranchService.isCodeUnique(tenantId, data.code)
    if (!isUnique) {
      throw new Error('Branch code already exists')
    }

    const branch = await BranchService.createBranch({
      tenantId,
      name: data.name,
      code: data.code,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      country: data.country || undefined,
      phone: data.phone,
      email: data.email,
      currency: data.currency,
      timezone: data.timezone,
      logo: data.logo,
    })

    return branch
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create branch'
    console.error('Create branch error:', errorMessage)
    throw new Error(errorMessage)
  }
}

export async function updateBranch(
  id: string,
  data: {
    name?: string
    code?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    country?: string | null
    phone?: string
    email?: string
    currency?: string
    timezone?: string
    logo?: string
    isActive?: boolean
  }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = session.user as any
  const userId = user.id || user.sub
  const tenantId = user.tenantId || 'tenant-demo-001'
  const permissions = user.permissions || ['*']

  if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'branches.update')) {
    throw new Error('You do not have permission to update branches')
  }

  try {
    if (data.code) {
      const isUnique = await BranchService.isCodeUnique(tenantId, data.code, id)
      if (!isUnique) {
        throw new Error('Branch code already exists')
      }
    }

    const updateData: any = { id, ...data }
    if (data.country === null) {
      updateData.country = undefined
    }

    const branch = await BranchService.updateBranch(updateData)
    return branch
  } catch (error: any) {
    console.error('Update branch error:', error)
    throw new Error(error.message || 'Failed to update branch')
  }
}

export async function deleteBranch(id: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const user = session.user as any
  const userId = user.id || user.sub
  const tenantId = user.tenantId || 'tenant-demo-001'
  const permissions = user.permissions || ['*']

  if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'branches.delete')) {
    throw new Error('You do not have permission to delete branches')
  }

  try {
    await BranchService.deleteBranch(id)
    return { success: true }
  } catch (error: any) {
    console.error('Delete branch error:', error)
    throw new Error(error.message || 'Failed to delete branch')
  }
}
