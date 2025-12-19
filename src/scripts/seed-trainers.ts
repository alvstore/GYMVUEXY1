import { PrismaClient } from '@prisma/client'
import { AuthService } from '../lib/auth'

const prisma = new PrismaClient()

async function seedTrainers() {
  console.log('🌱 Seeding trainers...')

  // Get the first tenant and branch for seeding
  const tenant = await prisma.tenant.findFirst()
  const branch = await prisma.branch.findFirst()

  if (!tenant || !branch) {
    console.log('❌ No tenant or branch found. Please run the main seed script first.')
    return
  }

  // Get trainer role
  const trainerRole = await prisma.role.findUnique({
    where: { name: 'trainer' },
  })

  if (!trainerRole) {
    console.log('❌ Trainer role not found. Please run the RBAC seed script first.')
    return
  }

  // Create trainer users
  const trainerUsers = [
    {
      email: 'john.trainer@gym.com',
      password: 'trainer123',
      name: 'John Smith',
      phone: '+91 98765 43220',
    },
    {
      email: 'sarah.trainer@gym.com',
      password: 'trainer123',
      name: 'Sarah Johnson',
      phone: '+91 98765 43221',
    },
    {
      email: 'mike.trainer@gym.com',
      password: 'trainer123',
      name: 'Mike Chen',
      phone: '+91 98765 43222',
    },
  ]

  const createdTrainers = []

  for (const userData of trainerUsers) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    let user = existingUser

    if (!existingUser) {
      // Create user
      const passwordHash = await AuthService.hashPassword(userData.password)
      user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          email: userData.email,
          passwordHash,
          name: userData.name,
          phone: userData.phone,
        },
      })

      // Assign trainer role
      await prisma.userRoleAssignment.create({
        data: {
          userId: user.id,
          roleId: trainerRole.id,
          branchId: branch.id,
        },
      })
    }

    if (user) {
      // Create trainer profile
      const trainerProfile = await prisma.trainerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          tenantId: tenant.id,
          branchId: branch.id,
          userId: user.id,
          bio: `Experienced fitness trainer specializing in ${userData.name.includes('John') ? 'weight training and bodybuilding' : userData.name.includes('Sarah') ? 'yoga and pilates' : 'functional training and HIIT'}.`,
          experience: Math.floor(Math.random() * 8) + 2, // 2-10 years
          certifications: [
            'Certified Personal Trainer',
            'First Aid Certified',
            userData.name.includes('Sarah') ? 'Yoga Alliance RYT-200' : 'Strength & Conditioning Specialist',
          ],
          specializations: userData.name.includes('John') 
            ? ['WEIGHT_TRAINING', 'BODYBUILDING']
            : userData.name.includes('Sarah')
            ? ['YOGA', 'PILATES']
            : ['FUNCTIONAL_TRAINING', 'CARDIO'],
          languages: ['English', 'Hindi'],
          rating: 4.0 + Math.random() * 1, // 4.0-5.0 rating
          totalSessions: Math.floor(Math.random() * 500) + 100,
          status: 'ACTIVE',
        },
      })

      // Set availability (Monday to Saturday)
      const availability = [
        { dayOfWeek: 'MONDAY', startTime: '06:00', endTime: '14:00' },
        { dayOfWeek: 'TUESDAY', startTime: '06:00', endTime: '14:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '06:00', endTime: '14:00' },
        { dayOfWeek: 'THURSDAY', startTime: '06:00', endTime: '14:00' },
        { dayOfWeek: 'FRIDAY', startTime: '06:00', endTime: '14:00' },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '16:00' },
      ]

      for (const slot of availability) {
        await prisma.trainerAvailability.upsert({
          where: {
            trainerId_dayOfWeek_startTime: {
              trainerId: trainerProfile.id,
              dayOfWeek: slot.dayOfWeek as any,
              startTime: slot.startTime,
            },
          },
          update: {},
          create: {
            trainerId: trainerProfile.id,
            ...slot,
          },
        })
      }

      // Set rates
      const rates = [
        { sessionType: 'PERSONAL_TRAINING', duration: 60, rate: 1500 },
        { sessionType: 'PERSONAL_TRAINING', duration: 90, rate: 2000 },
        { sessionType: 'GROUP_CLASS', duration: 60, rate: 500 },
        { sessionType: 'CONSULTATION', duration: 30, rate: 800 },
      ]

      for (const rate of rates) {
        await prisma.trainerRate.upsert({
          where: {
            trainerId_sessionType_duration: {
              trainerId: trainerProfile.id,
              sessionType: rate.sessionType as any,
              duration: rate.duration,
            },
          },
          update: {},
          create: {
            trainerId: trainerProfile.id,
            ...rate,
          },
        })
      }

      createdTrainers.push(trainerProfile)
    }
  }

  console.log(`✅ Created ${createdTrainers.length} trainer profiles with availability and rates!`)
}

seedTrainers()
  .catch((e) => {
    console.error('❌ Seeding trainers failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })