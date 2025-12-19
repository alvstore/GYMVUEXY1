import { PrismaClient, BenefitType, BenefitAccrualType } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMembershipPlans() {
  console.log('🌱 Seeding membership plans with benefits...')

  const tenant = await prisma.tenant.findFirst()
  const branch = await prisma.branch.findFirst()

  if (!tenant || !branch) {
    console.log('❌ No tenant or branch found. Please run the main seed script first.')
    return
  }

  const membershipPlans = [
    {
      id: `basic-plan-${tenant.id}`,
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Basic Plan',
      description: 'Perfect for beginners who want access to gym facilities',
      planType: 'WORKOUT' as const,
      duration: 30,
      price: 2999,
      setupFee: 500,
      gymAccess: true,
      poolAccess: false,
      lockerAccess: true,
      personalTrainer: false,
      groupClasses: false,
      features: ['Gym Access (6 AM - 10 PM)', 'Locker Access', 'Basic Equipment', 'Changing Rooms', 'Water Dispenser'],
      status: 'ACTIVE' as const,
      benefits: [
        { type: BenefitType.GUEST_PASS, name: 'Guest Passes', desc: 'Bring a friend to workout', qty: 1, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.FACILITY_ACCESS, name: 'Locker Access', desc: 'Standard locker for your belongings', qty: 1, accrual: BenefitAccrualType.ONE_TIME },
      ]
    },
    {
      id: `standard-plan-${tenant.id}`,
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Standard Plan',
      description: 'Great value plan with group classes included',
      planType: 'WORKOUT' as const,
      duration: 90,
      price: 7999,
      setupFee: 1000,
      gymAccess: true,
      poolAccess: false,
      lockerAccess: true,
      personalTrainer: false,
      groupClasses: true,
      maxClasses: 12,
      features: ['Gym Access (24/7)', 'Locker Access', 'Group Classes (12/month)', 'Nutrition Consultation', 'Steam Room', 'Towel Service'],
      status: 'ACTIVE' as const,
      benefits: [
        { type: BenefitType.GUEST_PASS, name: 'Guest Passes', desc: 'Bring friends to workout', qty: 2, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.CLASS_CREDIT, name: 'Group Classes', desc: 'Yoga, Zumba, Crossfit & more', qty: 12, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.FACILITY_ACCESS, name: 'Premium Locker', desc: 'Larger locker with lock provided', qty: 1, accrual: BenefitAccrualType.ONE_TIME },
        { type: BenefitType.SESSION_CREDIT, name: 'Nutrition Consultation', desc: 'Monthly diet planning session', qty: 1, accrual: BenefitAccrualType.MONTHLY },
      ]
    },
    {
      id: `premium-plan-${tenant.id}`,
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Premium Plan',
      description: 'Complete fitness package with all amenities',
      planType: 'COMBINED' as const,
      duration: 180,
      price: 14999,
      setupFee: 2000,
      gymAccess: true,
      poolAccess: true,
      lockerAccess: true,
      personalTrainer: true,
      groupClasses: true,
      features: ['Gym Access (24/7)', 'Pool Access', 'Personal Locker', 'Unlimited Classes', 'Personal Trainer (4 sessions)', 'Spa Access', 'Sauna & Steam', 'Towel Service', 'Priority Support'],
      status: 'ACTIVE' as const,
      benefits: [
        { type: BenefitType.GUEST_PASS, name: 'Guest Passes', desc: 'Bring friends to workout', qty: 4, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.CLASS_CREDIT, name: 'Unlimited Group Classes', desc: 'All classes included', qty: 999, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.SESSION_CREDIT, name: 'Personal Training', desc: 'One-on-one trainer sessions', qty: 4, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.FACILITY_ACCESS, name: 'VIP Locker', desc: 'Personal assigned locker', qty: 1, accrual: BenefitAccrualType.ONE_TIME },
        { type: BenefitType.FACILITY_ACCESS, name: 'Pool Access', desc: 'Unlimited swimming pool access', qty: 999, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.CUSTOM, name: 'Spa Sessions', desc: 'Monthly spa treatments', qty: 2, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.SESSION_CREDIT, name: 'Fitness Assessment', desc: 'Monthly body composition analysis', qty: 1, accrual: BenefitAccrualType.MONTHLY },
      ]
    },
    {
      id: `platinum-plan-${tenant.id}`,
      tenantId: tenant.id,
      branchId: null,
      name: 'Platinum Plan',
      description: 'Ultimate VIP experience with exclusive benefits',
      planType: 'COMBINED' as const,
      duration: 365,
      price: 49999,
      setupFee: 5000,
      gymAccess: true,
      poolAccess: true,
      lockerAccess: true,
      personalTrainer: true,
      groupClasses: true,
      features: ['All Branch Access', '24/7 Premium Access', 'Dedicated Personal Trainer', 'Unlimited Everything', 'VIP Lounge', 'Complimentary Supplements', 'Priority Booking', 'Free Parking', 'Annual Health Checkup'],
      status: 'ACTIVE' as const,
      benefits: [
        { type: BenefitType.GUEST_PASS, name: 'Unlimited Guest Passes', desc: 'Bring anyone anytime', qty: 10, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.CLASS_CREDIT, name: 'Unlimited Classes', desc: 'All classes at all branches', qty: 999, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.SESSION_CREDIT, name: 'Premium Personal Training', desc: 'Dedicated trainer support', qty: 8, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.FACILITY_ACCESS, name: 'Executive Locker Suite', desc: 'Private locker with amenities', qty: 1, accrual: BenefitAccrualType.ONE_TIME },
        { type: BenefitType.FACILITY_ACCESS, name: 'Unlimited Pool & Jacuzzi', desc: 'All water facilities', qty: 999, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.CUSTOM, name: 'Weekly Spa Treatment', desc: 'Full spa access', qty: 4, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.MERCHANDISE_CREDIT, name: 'Protein Supplements', desc: 'Monthly protein pack', qty: 1, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.SESSION_CREDIT, name: 'VIP Health Assessment', desc: 'Quarterly full health checkup', qty: 1, accrual: BenefitAccrualType.QUARTERLY },
        { type: BenefitType.CUSTOM, name: 'Membership Freeze', desc: 'Pause membership days', qty: 30, accrual: BenefitAccrualType.YEARLY },
      ]
    },
    {
      id: `student-plan-${tenant.id}`,
      tenantId: tenant.id,
      branchId: null,
      name: 'Student Plan',
      description: 'Special discounted plan for students with valid ID',
      planType: 'WORKOUT' as const,
      duration: 30,
      price: 1499,
      setupFee: 200,
      gymAccess: true,
      poolAccess: false,
      lockerAccess: false,
      personalTrainer: false,
      groupClasses: false,
      features: ['Gym Access (6 AM - 8 PM)', 'Basic Equipment', 'Student Discount', 'Flexible Timing'],
      status: 'ACTIVE' as const,
      benefits: [
        { type: BenefitType.GUEST_PASS, name: 'Study Buddy Pass', desc: 'Bring a fellow student', qty: 1, accrual: BenefitAccrualType.MONTHLY },
      ]
    },
    {
      id: `corporate-plan-${tenant.id}`,
      tenantId: tenant.id,
      branchId: null,
      name: 'Corporate Plan',
      description: 'Special rates for company employees',
      planType: 'COMBINED' as const,
      duration: 365,
      price: 24999,
      setupFee: 0,
      gymAccess: true,
      poolAccess: true,
      lockerAccess: true,
      personalTrainer: false,
      groupClasses: true,
      maxClasses: 20,
      features: ['All Branch Access', 'Gym & Pool Access', 'Group Classes (20/month)', 'Locker Access', 'Corporate Discount', 'Team Challenges'],
      status: 'ACTIVE' as const,
      benefits: [
        { type: BenefitType.GUEST_PASS, name: 'Colleague Passes', desc: 'Invite coworkers', qty: 2, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.CLASS_CREDIT, name: 'Group Classes', desc: 'All group fitness classes', qty: 20, accrual: BenefitAccrualType.MONTHLY },
        { type: BenefitType.FACILITY_ACCESS, name: 'Office Locker', desc: 'Dedicated locker space', qty: 1, accrual: BenefitAccrualType.ONE_TIME },
        { type: BenefitType.FACILITY_ACCESS, name: 'Pool Access', desc: 'Swimming pool access', qty: 999, accrual: BenefitAccrualType.MONTHLY },
      ]
    },
  ]

  for (const planData of membershipPlans) {
    const { benefits, ...plan } = planData
    
    const createdPlan = await prisma.membershipPlan.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        setupFee: plan.setupFee,
        features: plan.features,
        gymAccess: plan.gymAccess,
        poolAccess: plan.poolAccess,
        lockerAccess: plan.lockerAccess,
        personalTrainer: plan.personalTrainer,
        groupClasses: plan.groupClasses,
      },
      create: plan,
    })

    console.log(`  ✓ Created plan: ${createdPlan.name}`)

    let benefitIndex = 0
    for (const benefit of benefits) {
      const benefitId = `${plan.id}-benefit-${benefitIndex}`
      await prisma.planBenefit.upsert({
        where: { id: benefitId },
        update: {
          name: benefit.name,
          description: benefit.desc,
          accrualQuantity: benefit.qty,
        },
        create: {
          id: benefitId,
          tenantId: tenant.id,
          planId: createdPlan.id,
          benefitType: benefit.type,
          name: benefit.name,
          description: benefit.desc,
          accrualType: benefit.accrual,
          accrualQuantity: benefit.qty,
          maxBalance: benefit.qty > 100 ? null : benefit.qty * 3,
          rolloverAllowed: benefit.accrual === BenefitAccrualType.MONTHLY,
          isActive: true,
        },
      })
      console.log(`    ✓ Added benefit: ${benefit.name}`)
      benefitIndex++
    }
  }

  console.log('✅ Membership plans with benefits seeded successfully!')
}

seedMembershipPlans()
  .catch((e) => {
    console.error('❌ Seeding membership plans failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
