import { prisma } from '@/lib/prisma'
import { Measurement } from '@prisma/client'

export interface CreateMeasurementData {
  memberId: string
  branchId: string
  height?: number
  weight?: number
  bodyFat?: number
  muscleMass?: number
  chest?: number
  waist?: number
  hips?: number
  biceps?: number
  thighs?: number
  neck?: number
  notes?: string
  takenBy: string
}

export interface MeasurementFilters {
  memberId?: string
  branchId?: string
  startDate?: Date
  endDate?: Date
}

export class MeasurementService {
  static async createMeasurement(data: CreateMeasurementData, tenantId: string): Promise<Measurement> {
    // Calculate BMI if height and weight are provided
    let bmi: number | undefined
    let bodyFatMass: number | undefined
    let leanBodyMass: number | undefined

    if (data.height && data.weight) {
      const heightInMeters = data.height / 100
      bmi = data.weight / (heightInMeters * heightInMeters)
    }

    if (data.weight && data.bodyFat) {
      bodyFatMass = (data.weight * data.bodyFat) / 100
      leanBodyMass = data.weight - bodyFatMass
    }

    return await prisma.measurement.create({
      data: {
        ...data,
        tenantId,
        bmi,
        bodyFatMass,
        leanBodyMass,
      },
    })
  }

  static async getMeasurements(filters: MeasurementFilters = {}, page = 1, limit = 20) {
    const where: any = {}

    if (filters.memberId) {
      where.memberId = filters.memberId
    }

    if (filters.branchId) {
      where.branchId = filters.branchId
    }

    if (filters.startDate && filters.endDate) {
      where.measurementDate = {
        gte: filters.startDate,
        lte: filters.endDate,
      }
    }

    const [measurements, total] = await Promise.all([
      prisma.measurement.findMany({
        where,
        include: {
          member: {
            select: {
              firstName: true,
              lastName: true,
              membershipId: true,
            },
          },
          takenByUser: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { measurementDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.measurement.count({ where }),
    ])

    return {
      measurements,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  static async getMemberMeasurements(memberId: string) {
    return await prisma.measurement.findMany({
      where: { memberId },
      include: {
        takenByUser: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { measurementDate: 'desc' },
    })
  }

  static async getProgressData(memberId: string) {
    const measurements = await this.getMemberMeasurements(memberId)
    
    if (measurements.length === 0) {
      return null
    }

    const latest = measurements[0]
    const previous = measurements[1]

    const changes = previous ? {
      weight: latest.weight && previous.weight ? latest.weight - previous.weight : null,
      bodyFat: latest.bodyFat && previous.bodyFat ? latest.bodyFat - previous.bodyFat : null,
      muscleMass: latest.muscleMass && previous.muscleMass ? latest.muscleMass - previous.muscleMass : null,
      waist: latest.waist && previous.waist ? latest.waist - previous.waist : null,
      chest: latest.chest && previous.chest ? latest.chest - previous.chest : null,
    } : null

    return {
      latest,
      previous,
      changes,
      totalMeasurements: measurements.length,
      measurementHistory: measurements,
    }
  }

  static async addProgressPhoto(data: {
    memberId: string
    branchId: string
    memberPlanId?: string
    imageUrl: string
    caption?: string
    photoType?: string
  }, tenantId: string) {
    return await prisma.progressPhoto.create({
      data: {
        ...data,
        tenantId,
      },
    })
  }

  static async getProgressPhotos(memberId: string) {
    return await prisma.progressPhoto.findMany({
      where: { memberId },
      orderBy: { measurementDate: 'desc' },
    })
  }
}