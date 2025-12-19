import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/services/reportService'
import { RBACService } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    const permissions = JSON.parse(request.headers.get('x-user-permissions') || '[]')

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!RBACService.hasPermission({ id: userId, tenantId, permissions }, 'reports.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType')
    const branchId = searchParams.get('branchId') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const filters = { tenantId, branchId, startDate, endDate }

    let reportData

    switch (reportType) {
      case 'REVENUE':
        reportData = await ReportService.getRevenueReport(filters)
        break
      case 'MEMBERSHIP':
        reportData = await ReportService.getChurnAnalysis(filters)
        break
      case 'ATTENDANCE':
        reportData = await ReportService.getAttendanceReport(filters)
        break
      case 'TRAINER_UTILIZATION':
        reportData = await ReportService.getTrainerUtilizationReport(filters)
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    return NextResponse.json({
      reportType,
      filters,
      data: reportData,
      generatedAt: new Date(),
    })
  } catch (error: any) {
    console.error('Generate report error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    )
  }
}