import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMembershipPlans() {
  console.log('🌱 Seeding membership plans...')

  // Get the first tenant and branch for seeding
  const tenant = await prisma.tenant.findFirst()
  const branch = await prisma.branch.findFirst()

  if (!tenant || !branch) {
    console.log('❌ No tenant or branch found. Please run the main seed script first.')
    return
  }

  const membershipPlans = [
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Basic Plan',
      description: 'Perfect for beginners who want access to gym facilities',
      planType: 'MONTHLY',
      duration: 30,
      price: 2999,
      setupFee: 500,
      gymAccess: true,
      poolAccess: false,
      lockerAccess: true,
      personalTrainer: false,
      groupClasses: false,
      features: ['Gym Access', 'Locker Access', 'Basic Equipment'],
      status: 'ACTIVE',
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Standard Plan',
      description: 'Great value plan with group classes included',
      planType: 'QUARTERLY',
      duration: 90,
      price: 7999,
      setupFee: 1000,
      gymAccess: true,
      poolAccess: false,
      lockerAccess: true,
      personalTrainer: false,
      groupClasses: true,
      maxClasses: 10,
      features: ['Gym Access', 'Locker Access', '10 Group Classes', 'Nutrition Consultation'],
      status: 'ACTIVE',
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Premium Plan',
      description: 'Complete fitness package with all amenities',
      planType: 'HALF_YEARLY',
      duration: 180,
      price: 14999,
      setupFee: 2000,
      gymAccess: true,
      poolAccess: true,
      lockerAccess: true,
      personalTrainer: true,
      groupClasses: true,
      features: ['Gym Access', 'Pool Access', 'Locker Access', 'Unlimited Classes', 'Personal Trainer', 'Spa Access'],
      status: 'ACTIVE',
    },
    {
      tenantId: tenant.id,
      branchId: null, // Tenant-wide plan
      name: 'Student Plan',
      description: 'Special discounted plan for students',
      planType: 'MONTHLY',
      duration: 30,
      price: 1999,
      setupFee: 200,
      gymAccess: true,
      poolAccess: false,
      lockerAccess: false,
      personalTrainer: false,
      groupClasses: false,
      features: ['Gym Access', 'Student Discount', 'Basic Equipment'],
      status: 'ACTIVE',
    },
  ]

  for (const plan of membershipPlans) {
    await prisma.membershipPlan.upsert({
      where: {
        id: `${plan.name.toLowerCase().replace(/\s+/g, '-')}-${tenant.id}`,
      },
      update: {},
      create: {
        id: `${plan.name.toLowerCase().replace(/\s+/g, '-')}-${tenant.id}`,
        ...plan,
      },
    })
  }

  console.log('✅ Membership plans seeded successfully!')
}

seedMembershipPlans()
  .catch((e) => {
    console.error('❌ Seeding membership plans failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })