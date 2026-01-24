import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'
import { prisma } from '@/libs/prisma'
import { MembershipStatus } from '@prisma/client'

async function checkAdminAccess(): Promise<{ authorized: boolean; tenantId?: string; error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized' }
  }

  const user = session.user as any
  
  if (!user.roles?.includes('ADMIN') && !user.permissions?.includes('*') && !user.permissions?.includes('export.*')) {
    return { authorized: false, error: 'Admin access required for data export' }
  }

  return { authorized: true, tenantId: user.tenantId }
}

function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [headers.join(',')]
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return String(value)
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}

async function exportRevenue(tenantId: string) {
  const memberships = await prisma.memberMembership.findMany({
    where: { 
      member: { tenantId },
    },
    include: {
      member: { select: { firstName: true, lastName: true, membershipId: true, phone: true } },
      plan: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = memberships.map(m => ({
    MembershipID: m.member.membershipId,
    MemberName: `${m.member.firstName} ${m.member.lastName}`,
    Phone: m.member.phone,
    PlanName: m.plan.name,
    Status: m.status,
    StartDate: m.startDate.toISOString().split('T')[0],
    EndDate: m.endDate.toISOString().split('T')[0],
    TotalPrice: Number(m.totalPrice || 0).toFixed(2),
    AmountPaid: Number(m.amountPaid || 0).toFixed(2),
    BalanceDue: Number(m.balanceDue || 0).toFixed(2),
  }))

  const headers = ['MembershipID', 'MemberName', 'Phone', 'PlanName', 'Status', 'StartDate', 'EndDate', 'TotalPrice', 'AmountPaid', 'BalanceDue']
  return convertToCSV(data, headers)
}

async function exportMembers(tenantId: string) {
  const members = await prisma.member.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      memberships: {
        where: { status: MembershipStatus.ACTIVE },
        include: { plan: true },
        take: 1,
      },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = members.map(m => ({
    MembershipID: m.membershipId,
    FirstName: m.firstName,
    LastName: m.lastName,
    Email: m.email || '',
    Phone: m.phone,
    Branch: m.branch?.name || '',
    Status: m.status,
    JoinDate: m.joinDate.toISOString().split('T')[0],
    CurrentPlan: m.memberships[0]?.plan?.name || 'None',
    PlanEndDate: m.memberships[0]?.endDate?.toISOString().split('T')[0] || '',
  }))

  const headers = ['MembershipID', 'FirstName', 'LastName', 'Email', 'Phone', 'Branch', 'Status', 'JoinDate', 'CurrentPlan', 'PlanEndDate']
  return convertToCSV(data, headers)
}

async function exportOutstandingDues(tenantId: string) {
  const memberships = await prisma.memberMembership.findMany({
    where: { 
      member: { tenantId },
      balanceDue: { gt: 0 },
    },
    include: {
      member: { select: { firstName: true, lastName: true, membershipId: true, phone: true, email: true } },
      plan: { select: { name: true } },
    },
    orderBy: { balanceDue: 'desc' },
  })

  const data = memberships.map(m => ({
    MembershipID: m.member.membershipId,
    MemberName: `${m.member.firstName} ${m.member.lastName}`,
    Phone: m.member.phone,
    Email: m.member.email || '',
    PlanName: m.plan.name,
    TotalPrice: Number(m.totalPrice || 0).toFixed(2),
    AmountPaid: Number(m.amountPaid || 0).toFixed(2),
    BalanceDue: Number(m.balanceDue || 0).toFixed(2),
    DueDate: m.endDate.toISOString().split('T')[0],
  }))

  const headers = ['MembershipID', 'MemberName', 'Phone', 'Email', 'PlanName', 'TotalPrice', 'AmountPaid', 'BalanceDue', 'DueDate']
  return convertToCSV(data, headers)
}

async function exportAll(tenantId: string) {
  const [revenue, members, dues] = await Promise.all([
    exportRevenue(tenantId),
    exportMembers(tenantId),
    exportOutstandingDues(tenantId),
  ])

  return `=== REVENUE DATA ===\n${revenue}\n\n=== MEMBER DATA ===\n${members}\n\n=== OUTSTANDING DUES ===\n${dues}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const { authorized, tenantId, error } = await checkAdminAccess()
  
  if (!authorized || !tenantId) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
  }

  const { type } = params
  const format = request.nextUrl.searchParams.get('format') || 'csv'

  try {
    let csvData: string

    switch (type) {
      case 'revenue':
        csvData = await exportRevenue(tenantId)
        break
      case 'members':
        csvData = await exportMembers(tenantId)
        break
      case 'dues':
        csvData = await exportOutstandingDues(tenantId)
        break
      case 'all':
        csvData = await exportAll(tenantId)
        break
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    const headers = new Headers()
    headers.set('Content-Type', 'text/csv')
    headers.set('Content-Disposition', `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.csv"`)

    return new NextResponse(csvData, { status: 200, headers })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
