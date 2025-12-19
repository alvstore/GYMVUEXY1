import { prisma } from '@/lib/prisma'
import { Room, RoomType, AccessLevel, RoomPermission } from '@prisma/client'

export interface CreateRoomData {
  branchId: string
  name: string
  code: string
  roomType: RoomType
  capacity?: number
  description?: string
}

export interface UpdateRoomData extends Partial<CreateRoomData> {
  id: string
  isActive?: boolean
}

export interface CreateRoomPermissionData {
  roomId: string
  branchId: string
  membershipPlanId?: string
  userId?: string
  accessLevel: AccessLevel
  timeRestrictions?: {
    days?: string[]
    startTime?: string
    endTime?: string
  }
}

export class RoomService {
  static async createRoom(data: CreateRoomData, tenantId: string): Promise<Room> {
    return await prisma.room.create({
      data: {
        ...data,
        tenantId,
        isActive: true,
      },
    })
  }

  static async updateRoom(data: UpdateRoomData): Promise<Room> {
    const { id, ...updateData } = data
    return await prisma.room.update({
      where: { id },
      data: updateData,
    })
  }

  static async deleteRoom(id: string): Promise<void> {
    await prisma.room.update({
      where: { id },
      data: { isActive: false },
    })
  }

  static async getRoom(id: string) {
    return await prisma.room.findUnique({
      where: { id },
      include: {
        branch: true,
        devices: {
          where: { isActive: true },
        },
        roomPermissions: {
          where: { isActive: true },
          include: {
            membershipPlan: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            accessLogs: {
              where: {
                accessResult: 'GRANTED',
                exitTime: null,
              },
            },
          },
        },
      },
    })
  }

  static async getRooms(branchId: string) {
    return await prisma.room.findMany({
      where: { branchId, isActive: true },
      include: {
        devices: {
          where: { isActive: true },
        },
        _count: {
          select: {
            accessLogs: {
              where: {
                accessResult: 'GRANTED',
                exitTime: null,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  static async createRoomPermission(data: CreateRoomPermissionData, tenantId: string): Promise<RoomPermission> {
    return await prisma.roomPermission.create({
      data: {
        ...data,
        tenantId,
        timeRestrictions: data.timeRestrictions || {},
        isActive: true,
      },
    })
  }

  static async updateRoomPermission(id: string, data: Partial<CreateRoomPermissionData>): Promise<RoomPermission> {
    return await prisma.roomPermission.update({
      where: { id },
      data,
    })
  }

  static async deleteRoomPermission(id: string): Promise<void> {
    await prisma.roomPermission.update({
      where: { id },
      data: { isActive: false },
    })
  }

  static async getRoomPermissions(roomId: string) {
    return await prisma.roomPermission.findMany({
      where: { roomId, isActive: true },
      include: {
        membershipPlan: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async getRoomOccupancy(roomId: string) {
    const currentOccupancy = await prisma.accessLog.count({
      where: {
        roomId,
        accessResult: 'GRANTED',
        exitTime: null,
      },
    })

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { capacity: true },
    })

    return {
      currentOccupancy,
      capacity: room?.capacity || 0,
      occupancyRate: room?.capacity ? (currentOccupancy / room.capacity) * 100 : 0,
    }
  }
}