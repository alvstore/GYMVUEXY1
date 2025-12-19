import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedRooms() {
  console.log('🌱 Seeding rooms and access control...')

  // Get the first tenant and branch for seeding
  const tenant = await prisma.tenant.findFirst()
  const branch = await prisma.branch.findFirst()

  if (!tenant || !branch) {
    console.log('❌ No tenant or branch found. Please run the main seed script first.')
    return
  }

  // Create rooms
  const rooms = [
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Main Gym Floor',
      code: 'GYM-01',
      roomType: 'GYM_FLOOR',
      capacity: 50,
      description: 'Main workout area with cardio and weight equipment',
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Yoga Studio',
      code: 'YOGA-01',
      roomType: 'YOGA_STUDIO',
      capacity: 20,
      description: 'Dedicated space for yoga and meditation classes',
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Pool Area',
      code: 'POOL-01',
      roomType: 'POOL',
      capacity: 30,
      description: 'Swimming pool and aqua fitness area',
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Reception',
      code: 'REC-01',
      roomType: 'RECEPTION',
      capacity: 10,
      description: 'Front desk and waiting area',
    },
  ]

  const createdRooms = []
  for (const room of rooms) {
    const createdRoom = await prisma.room.upsert({
      where: {
        branchId_code: {
          branchId: room.branchId,
          code: room.code,
        },
      },
      update: {},
      create: room,
    })
    createdRooms.push(createdRoom)
  }

  // Create access devices
  const devices = [
    {
      tenantId: tenant.id,
      branchId: branch.id,
      roomId: createdRooms[0].id, // Main Gym Floor
      name: 'Main Entrance RFID',
      deviceId: 'RFID-001',
      deviceType: 'RFID_READER',
      ipAddress: '192.168.1.101',
      isOnline: true,
      lastPing: new Date(),
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      roomId: createdRooms[1].id, // Yoga Studio
      name: 'Yoga Studio Biometric',
      deviceId: 'BIO-002',
      deviceType: 'BIOMETRIC_SCANNER',
      ipAddress: '192.168.1.102',
      isOnline: true,
      lastPing: new Date(),
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      roomId: createdRooms[2].id, // Pool Area
      name: 'Pool QR Scanner',
      deviceId: 'QR-003',
      deviceType: 'QR_SCANNER',
      ipAddress: '192.168.1.103',
      isOnline: true,
      lastPing: new Date(),
    },
  ]

  for (const device of devices) {
    await prisma.accessDevice.upsert({
      where: { deviceId: device.deviceId },
      update: {},
      create: device,
    })
  }

  // Get membership plans for room permissions
  const membershipPlans = await prisma.membershipPlan.findMany({
    where: { tenantId: tenant.id },
  })

  // Create room permissions for membership plans
  if (membershipPlans.length > 0) {
    const roomPermissions = [
      // Basic Plan - Main Gym only
      {
        tenantId: tenant.id,
        branchId: branch.id,
        roomId: createdRooms[0].id, // Main Gym Floor
        membershipPlanId: membershipPlans.find(p => p.name.includes('Basic'))?.id,
        accessLevel: 'BASIC',
      },
      // Standard Plan - Main Gym + Yoga
      {
        tenantId: tenant.id,
        branchId: branch.id,
        roomId: createdRooms[0].id, // Main Gym Floor
        membershipPlanId: membershipPlans.find(p => p.name.includes('Standard'))?.id,
        accessLevel: 'BASIC',
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        roomId: createdRooms[1].id, // Yoga Studio
        membershipPlanId: membershipPlans.find(p => p.name.includes('Standard'))?.id,
        accessLevel: 'BASIC',
      },
      // Premium Plan - All areas
      {
        tenantId: tenant.id,
        branchId: branch.id,
        roomId: createdRooms[0].id, // Main Gym Floor
        membershipPlanId: membershipPlans.find(p => p.name.includes('Premium'))?.id,
        accessLevel: 'FULL',
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        roomId: createdRooms[1].id, // Yoga Studio
        membershipPlanId: membershipPlans.find(p => p.name.includes('Premium'))?.id,
        accessLevel: 'FULL',
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        roomId: createdRooms[2].id, // Pool Area
        membershipPlanId: membershipPlans.find(p => p.name.includes('Premium'))?.id,
        accessLevel: 'FULL',
      },
    ]

    for (const permission of roomPermissions) {
      if (permission.membershipPlanId) {
        await prisma.roomPermission.create({
          data: permission,
        })
      }
    }
  }

  console.log('✅ Rooms and access control seeded successfully!')
}

seedRooms()
  .catch((e) => {
    console.error('❌ Seeding rooms failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })