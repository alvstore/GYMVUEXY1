import { prisma } from '@/lib/prisma'
import { ReportType } from '@prisma/client'

export interface ReportFilters {
  tenantId: string
  branchId?: string
  startDate?: Date
  endDate?: Date
  reportType?: ReportType
}

export interface CustomReportConfig {
  name: string
  description?: string
  metrics: string[]
  groupBy: string[]
  filters: any
  chartType?: string
}

export class ReportService {
  // Revenue Reports
  static async getRevenueReport(filters: ReportFilters) {
    const where: any = {
      tenantId: filters.tenantId,
      status: 'COMPLETED',
    }

    if (filters.branchId) where.branchId = filters.branchId
    if (filters.startDate && filters.endDate) {
      where.createdAt = { gte: filters.startDate, lte: filters.endDate }
    }

    const [
      totalRevenue,
      membershipRevenue,
      productRevenue,
      trainingRevenue,
      monthlyTrend,
      paymentMethodBreakdown,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          ...where,
          transactionType: { in: ['MEMBERSHIP', 'PRODUCT_SALE', 'TRAINING_SESSION'] },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, transactionType: 'MEMBERSHIP' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, transactionType: 'PRODUCT_SALE' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, transactionType: 'TRAINING_SESSION' },
        _sum: { amount: true },
      }),
      this.getMonthlyRevenueTrend(filters),
      this.getPaymentMethodBreakdown(filters),
    ])

    return {
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      membershipRevenue: Number(membershipRevenue._sum.amount || 0),
      productRevenue: Number(productRevenue._sum.amount || 0),
      trainingRevenue: Number(trainingRevenue._sum.amount || 0),
      monthlyTrend,
      paymentMethodBreakdown,
    }
  }

  // Membership Churn Analysis
  static async getChurnAnalysis(filters: ReportFilters) {
    const where: any = { tenantId: filters.tenantId }
    if (filters.branchId) where.branchId = filters.branchId

    const [
      totalMembers,
      activeMembers,
      expiredMembers,
      frozenMembers,
      newMembersThisMonth,
      churnedMembersThisMonth,
    ] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.member.count({ where: { ...where, status: 'EXPIRED' } }),
      prisma.memberMembership.count({ where: { ...where, isFrozen: true } }),
      this.getNewMembersCount(filters, 'month'),
      this.getChurnedMembersCount(filters, 'month'),
    ])

    const churnRate = totalMembers > 0 ? (churnedMembersThisMonth / totalMembers) * 100 : 0
    const growthRate = totalMembers > 0 ? (newMembersThisMonth / totalMembers) * 100 : 0

    return {
      totalMembers,
      activeMembers,
      expiredMembers,
      frozenMembers,
      newMembersThisMonth,
      churnedMembersThisMonth,
      churnRate,
      growthRate,
      retentionRate: 100 - churnRate,
    }
  }

  // Trainer Utilization Report
  static async getTrainerUtilizationReport(filters: ReportFilters) {
    const where: any = { tenantId: filters.tenantId }
    if (filters.branchId) where.branchId = filters.branchId

    const trainers = await prisma.trainerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        assignments: {
          where: { status: 'ACTIVE' },
        },
        sessions: {
          where: {
            status: 'COMPLETED',
            ...(filters.startDate && filters.endDate && {
              scheduledDate: {
                gte: filters.startDate,
                lte: filters.endDate,
              },
            }),
          },
        },
        _count: {
          select: {
            assignments: {
              where: { status: 'ACTIVE' },
            },
            sessions: {
              where: { status: 'COMPLETED' },
            },
          },
        },
      },
    })

    const utilization = trainers.map(trainer => {
      const totalSessions = trainer._count.sessions
      const activeClients = trainer._count.assignments
      const revenue = trainer.sessions.reduce((sum, session) => sum + Number(session.rate || 0), 0)

      return {
        trainerId: trainer.id,
        trainerName: trainer.user.name,
        activeClients,
        totalSessions,
        revenue,
        rating: trainer.rating || 0,
        utilizationScore: Math.min(100, (activeClients / 10) * 100), // Assuming max 10 clients per trainer
      }
    })

    return utilization.sort((a, b) => b.utilizationScore - a.utilizationScore)
  }

  // Attendance Analysis
  static async getAttendanceReport(filters: ReportFilters) {
    const where: any = { tenantId: filters.tenantId }
    if (filters.branchId) where.branchId = filters.branchId
    if (filters.startDate && filters.endDate) {
      where.checkInTime = { gte: filters.startDate, lte: filters.endDate }
    }

    const [
      totalVisits,
      uniqueMembers,
      averageDuration,
      peakHours,
      dailyTrend,
    ] = await Promise.all([
      prisma.attendanceRecord.count({ where }),
      prisma.attendanceRecord.findMany({
        where,
        select: { memberId: true },
        distinct: ['memberId'],
      }),
      prisma.attendanceRecord.aggregate({
        where: { ...where, duration: { not: null } },
        _avg: { duration: true },
      }),
      this.getPeakHours(filters),
      this.getDailyAttendanceTrend(filters),
    ])

    return {
      totalVisits,
      uniqueMembers: uniqueMembers.length,
      averageDuration: averageDuration._avg.duration || 0,
      peakHours,
      dailyTrend,
      averageVisitsPerMember: uniqueMembers.length > 0 ? totalVisits / uniqueMembers.length : 0,
    }
  }

  // Member Engagement Scoring
  static async calculateMemberEngagement(memberId: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    })

    if (!member) {
      throw new Error('Member not found')
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      attendanceCount,
      planCompliance,
      paymentHistory,
      feedbackCount,
      referralCount,
    ] = await Promise.all([
      prisma.attendanceRecord.count({
        where: {
          memberId,
          checkInTime: { gte: thirtyDaysAgo },
        },
      }),
      this.getPlanComplianceScore(memberId),
      this.getPaymentScore(memberId),
      prisma.feedback.count({
        where: { memberId, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.referralTracking.count({
        where: { referrerMemberId: memberId },
      }),
    ])

    // Calculate scores (0-100)
    const attendanceScore = Math.min(100, (attendanceCount / 20) * 100) // 20 visits = 100%
    const planComplianceScore = planCompliance
    const paymentScore = paymentHistory
    const feedbackScore = Math.min(100, feedbackCount * 25) // 4 feedback = 100%
    const referralScore = Math.min(100, referralCount * 20) // 5 referrals = 100%

    // Weighted average
    const overallScore = (
      attendanceScore * 0.3 +
      planComplianceScore * 0.25 +
      paymentScore * 0.25 +
      feedbackScore * 0.1 +
      referralScore * 0.1
    )

    const riskLevel = overallScore >= 70 ? 'LOW' : overallScore >= 40 ? 'MEDIUM' : 'HIGH'

    // Save engagement score
    await prisma.memberEngagement.upsert({
      where: {
        memberId_branchId: {
          memberId,
          branchId: member.branchId,
        },
      },
      update: {
        attendanceScore,
        planComplianceScore,
        paymentScore,
        feedbackScore,
        referralScore,
        overallScore,
        riskLevel,
        lastCalculated: new Date(),
      },
      create: {
        tenantId: member.tenantId,
        memberId,
        branchId: member.branchId,
        attendanceScore,
        planComplianceScore,
        paymentScore,
        feedbackScore,
        referralScore,
        overallScore,
        riskLevel,
      },
    })

    return {
      attendanceScore,
      planComplianceScore,
      paymentScore,
      feedbackScore,
      referralScore,
      overallScore,
      riskLevel,
    }
  }

  // Custom Report Builder
  static async createCustomReport(config: CustomReportConfig, tenantId: string, branchId?: string, createdBy?: string) {
    return await prisma.report.create({
      data: {
        tenantId,
        branchId,
        name: config.name,
        description: config.description,
        reportType: 'CUSTOM',
        category: 'custom',
        config: {
          metrics: config.metrics,
          groupBy: config.groupBy,
          filters: config.filters,
          chartType: config.chartType,
        },
        createdBy: createdBy || 'system',
      },
    })
  }

  static async executeCustomReport(reportId: string, dateRange?: { start: Date; end: Date }) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      throw new Error('Report not found')
    }

    // Execute custom report based on configuration
    // This is a simplified implementation - in production, you'd have a more sophisticated query builder
    const config = report.config as any
    const results = await this.buildCustomQuery(report.tenantId, report.branchId, config, dateRange)

    return {
      report,
      data: results,
      generatedAt: new Date(),
    }
  }

  // Helper methods
  private static async getMonthlyRevenueTrend(filters: ReportFilters) {
    const startDate = filters.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const endDate = filters.endDate || new Date()

    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId: filters.tenantId,
        ...(filters.branchId && { branchId: filters.branchId }),
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        createdAt: true,
        transactionType: true,
      },
    })

    // Group by month
    const monthlyData = transactions.reduce((acc, transaction) => {
      const month = transaction.createdAt.toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { membership: 0, products: 0, training: 0, total: 0 }
      }
      
      const amount = Number(transaction.amount)
      acc[month].total += amount
      
      switch (transaction.transactionType) {
        case 'MEMBERSHIP':
          acc[month].membership += amount
          break
        case 'PRODUCT_SALE':
          acc[month].products += amount
          break
        case 'TRAINING_SESSION':
          acc[month].training += amount
          break
      }
      
      return acc
    }, {} as Record<string, any>)

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }))
  }

  private static async getPaymentMethodBreakdown(filters: ReportFilters) {
    const where: any = {
      tenantId: filters.tenantId,
      status: 'COMPLETED',
    }

    if (filters.branchId) where.branchId = filters.branchId
    if (filters.startDate && filters.endDate) {
      where.createdAt = { gte: filters.startDate, lte: filters.endDate }
    }

    return await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: { amount: true },
      _count: { id: true },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    })
  }

  private static async getPeakHours(filters: ReportFilters) {
    const where: any = { tenantId: filters.tenantId }
    if (filters.branchId) where.branchId = filters.branchId
    if (filters.startDate && filters.endDate) {
      where.checkInTime = { gte: filters.startDate, lte: filters.endDate }
    }

    const attendance = await prisma.attendanceRecord.findMany({
      where,
      select: { checkInTime: true },
    })

    // Group by hour
    const hourlyData = attendance.reduce((acc, record) => {
      const hour = record.checkInTime.getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return Object.entries(hourlyData)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
  }

  private static async getDailyAttendanceTrend(filters: ReportFilters) {
    const where: any = { tenantId: filters.tenantId }
    if (filters.branchId) where.branchId = filters.branchId

    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const attendance = await prisma.attendanceRecord.findMany({
      where: {
        ...where,
        checkInTime: { gte: last30Days },
      },
      select: { checkInTime: true },
    })

    // Group by date
    const dailyData = attendance.reduce((acc, record) => {
      const date = record.checkInTime.toISOString().slice(0, 10) // YYYY-MM-DD
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private static async getNewMembersCount(filters: ReportFilters, period: 'month' | 'week') {
    const startDate = new Date()
    if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1)
    } else {
      startDate.setDate(startDate.getDate() - 7)
    }

    return await prisma.member.count({
      where: {
        tenantId: filters.tenantId,
        ...(filters.branchId && { branchId: filters.branchId }),
        createdAt: { gte: startDate },
      },
    })
  }

  private static async getChurnedMembersCount(filters: ReportFilters, period: 'month' | 'week') {
    const startDate = new Date()
    if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1)
    } else {
      startDate.setDate(startDate.getDate() - 7)
    }

    return await prisma.memberMembership.count({
      where: {
        tenantId: filters.tenantId,
        ...(filters.branchId && { branchId: filters.branchId }),
        status: 'EXPIRED',
        endDate: { gte: startDate },
      },
    })
  }

  private static async getPlanComplianceScore(memberId: string): Promise<number> {
    // Mock implementation - in production, this would analyze plan adherence
    return Math.random() * 100
  }

  private static async getPaymentScore(memberId: string): Promise<number> {
    const invoices = await prisma.invoice.findMany({
      where: { memberId },
      select: { status: true, dueDate: true },
    })

    if (invoices.length === 0) return 100

    const onTimePayments = invoices.filter(inv => 
      inv.status === 'PAID' || 
      (inv.status === 'PARTIALLY_PAID' && inv.dueDate > new Date())
    ).length

    return (onTimePayments / invoices.length) * 100
  }

  private static async buildCustomQuery(tenantId: string, branchId?: string, config?: any, dateRange?: { start: Date; end: Date }) {
    // Simplified custom query builder
    // In production, this would be much more sophisticated
    return {
      message: 'Custom report execution would be implemented here',
      config,
      dateRange,
    }
  }

  // Locker Usage Report
  static async getLockerUsageReport(filters: ReportFilters) {
    const where: any = { tenantId: filters.tenantId }
    if (filters.branchId) where.branchId = filters.branchId

    const [
      totalLockers,
      occupiedLockers,
      lockerRevenue,
      expiringAssignments,
    ] = await Promise.all([
      prisma.locker.count({ where: { ...where, isActive: true } }),
      prisma.locker.count({ where: { ...where, isActive: true, isOccupied: true } }),
      prisma.lockerAssignment.aggregate({
        where: { ...where, status: 'ACTIVE' },
        _sum: { monthlyRate: true },
      }),
      prisma.lockerAssignment.count({
        where: {
          ...where,
          status: 'ACTIVE',
          endDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          },
        },
      }),
    ])

    const occupancyRate = totalLockers > 0 ? (occupiedLockers / totalLockers) * 100 : 0

    return {
      totalLockers,
      occupiedLockers,
      availableLockers: totalLockers - occupiedLockers,
      occupancyRate,
      monthlyRevenue: Number(lockerRevenue._sum.monthlyRate || 0),
      expiringAssignments,
    }
  }

  // Export functionality
  static async exportReportToCSV(reportData: any, reportName: string) {
    // Mock CSV export - implement actual CSV generation
    return {
      filename: `${reportName}_${new Date().toISOString().slice(0, 10)}.csv`,
      url: '/api/v1/reports/export/csv',
      data: reportData,
    }
  }

  static async exportReportToPDF(reportData: any, reportName: string) {
    // Mock PDF export - implement actual PDF generation
    return {
      filename: `${reportName}_${new Date().toISOString().slice(0, 10)}.pdf`,
      url: '/api/v1/reports/export/pdf',
      data: reportData,
    }
  }
}