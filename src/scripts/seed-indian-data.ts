import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const INDIAN_FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharva', 'Advait', 'Rudra', 'Kabir', 'Dhruv', 'Ritvik', 'Aarush', 'Karthik', 'Rohan',
  'Ananya', 'Aadhya', 'Diya', 'Priya', 'Saanvi', 'Aanya', 'Isha', 'Kavya', 'Nisha', 'Pooja',
  'Riya', 'Shreya', 'Tanvi', 'Neha', 'Meera', 'Anjali', 'Divya', 'Simran', 'Aishwarya', 'Deepika'
]

const INDIAN_LAST_NAMES = [
  'Sharma', 'Patel', 'Verma', 'Singh', 'Kumar', 'Reddy', 'Nair', 'Menon', 'Iyer', 'Rao',
  'Gupta', 'Agarwal', 'Joshi', 'Tiwari', 'Pandey', 'Mishra', 'Saxena', 'Bansal', 'Kapoor', 'Malhotra',
  'Bhatt', 'Desai', 'Mehta', 'Shah', 'Jain', 'Bose', 'Mukherjee', 'Chatterjee', 'Das', 'Pillai'
]

const INDIAN_CITIES = {
  'Mumbai': { state: 'Maharashtra', areas: ['Andheri', 'Bandra', 'Powai', 'Worli', 'Juhu'] },
  'Delhi': { state: 'Delhi', areas: ['Connaught Place', 'South Extension', 'Rajouri Garden', 'Dwarka', 'Vasant Kunj'] },
  'Bangalore': { state: 'Karnataka', areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar'] },
  'Hyderabad': { state: 'Telangana', areas: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Hitech City'] },
  'Chennai': { state: 'Tamil Nadu', areas: ['T Nagar', 'Adyar', 'Anna Nagar', 'Velachery', 'OMR'] },
  'Pune': { state: 'Maharashtra', areas: ['Koregaon Park', 'Kothrud', 'Viman Nagar', 'Hinjewadi', 'Baner'] },
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generatePhone(): string {
  const prefixes = ['98', '99', '70', '80', '90', '91', '92', '93', '94', '95']
  return `+91 ${randomPick(prefixes)}${Math.floor(10000000 + Math.random() * 90000000)}`
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'rediffmail.com']
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${randomPick(domains)}`
}

function generateMembershipId(branchCode: string, index: number): string {
  const year = new Date().getFullYear().toString().slice(-2)
  return `${branchCode}${year}${(index + 1).toString().padStart(4, '0')}`
}

async function seedIndianData() {
  console.log('🇮🇳 Starting Indian gym data seed...')

  const existingTenant = await prisma.tenant.findFirst()
  if (!existingTenant) {
    console.log('❌ No tenant found. Please run the main seed first.')
    return
  }

  const existingBranch = await prisma.branch.findFirst({ where: { tenantId: existingTenant.id } })
  if (!existingBranch) {
    console.log('❌ No branch found. Please run the main seed first.')
    return
  }

  const tenantId = existingTenant.id
  const branchId = existingBranch.id

  console.log(`📍 Using tenant: ${existingTenant.name}, branch: ${existingBranch.name}`)

  const hashedPassword = await bcrypt.hash('member123', 10)

  console.log('\n👥 Creating Indian members...')
  const members = []
  const branchCode = 'INC'
  for (let i = 0; i < 25; i++) {
    const firstName = randomPick(INDIAN_FIRST_NAMES)
    const lastName = randomPick(INDIAN_LAST_NAMES)
    const city = randomPick(Object.keys(INDIAN_CITIES)) as keyof typeof INDIAN_CITIES
    const area = randomPick(INDIAN_CITIES[city].areas)

    const member = await prisma.member.create({
      data: {
        tenantId,
        branchId,
        membershipId: generateMembershipId(branchCode, i + 1000 + Math.floor(Math.random() * 1000)),
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        phone: generatePhone(),
        dateOfBirth: new Date(1985 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: i < 15 ? 'Male' : 'Female',
        address: `${Math.floor(Math.random() * 500) + 1}, ${area}, ${city}, ${INDIAN_CITIES[city].state} ${400000 + Math.floor(Math.random() * 99999)}`,
        emergencyContact: `${randomPick(INDIAN_FIRST_NAMES)} ${lastName}`,
        emergencyPhone: generatePhone(),
        status: i < 20 ? 'ACTIVE' : randomPick(['INACTIVE', 'PENDING']),
      }
    })
    members.push(member)
  }
  console.log(`✅ Created ${members.length} members`)

  console.log('\n🏋️ Creating Indian trainers...')
  const trainers = []
  const trainerNames = [
    { first: 'Rahul', last: 'Sharma', specialization: 'Weight Training' },
    { first: 'Priya', last: 'Iyer', specialization: 'Yoga & Meditation' },
    { first: 'Vikram', last: 'Singh', specialization: 'CrossFit' },
    { first: 'Sneha', last: 'Reddy', specialization: 'Zumba & Dance' },
    { first: 'Amit', last: 'Patel', specialization: 'HIIT & Cardio' },
    { first: 'Kavitha', last: 'Nair', specialization: 'Pilates' },
  ]

  for (const t of trainerNames) {
    const trainer = await prisma.trainer.create({
      data: {
        tenantId,
        branchId,
        firstName: t.first,
        lastName: t.last,
        email: generateEmail(t.first, t.last),
        phone: generatePhone(),
        specialization: t.specialization,
        certifications: ['ACE Certified', 'ISSA Certified', 'CPR/First Aid'],
        experience: Math.floor(Math.random() * 10) + 2,
        status: 'ACTIVE',
        bio: `Professional fitness trainer specializing in ${t.specialization} with over ${Math.floor(Math.random() * 10) + 2} years of experience.`,
        hourlyRate: 500 + Math.floor(Math.random() * 1000),
      }
    })
    trainers.push(trainer)
  }
  console.log(`✅ Created ${trainers.length} trainers`)

  console.log('\n👨‍💼 Creating Indian staff members...')
  const staffData = [
    { first: 'Suresh', last: 'Kumar', role: 'Manager', department: 'Operations' },
    { first: 'Lakshmi', last: 'Menon', role: 'Receptionist', department: 'Front Desk' },
    { first: 'Rajesh', last: 'Gupta', role: 'Maintenance', department: 'Facilities' },
    { first: 'Anita', last: 'Desai', role: 'Sales Executive', department: 'Sales' },
  ]

  for (const s of staffData) {
    await prisma.staffMember.create({
      data: {
        tenantId,
        branchId,
        firstName: s.first,
        lastName: s.last,
        email: generateEmail(s.first, s.last),
        phone: generatePhone(),
        role: s.role,
        department: s.department,
        status: 'ACTIVE',
        hireDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
        salary: 25000 + Math.floor(Math.random() * 50000),
      }
    })
  }
  console.log(`✅ Created ${staffData.length} staff members`)

  console.log('\n🔐 Creating lockers...')
  const lockerSections = ['A', 'B', 'C']
  for (let floor = 1; floor <= 2; floor++) {
    for (const section of lockerSections) {
      for (let num = 1; num <= 10; num++) {
        const lockerNumber = `${section}-${floor}${num.toString().padStart(2, '0')}`
        const isOccupied = Math.random() > 0.6
        const member = isOccupied ? randomPick(members) : null

        await prisma.locker.create({
          data: {
            tenantId,
            branchId,
            lockerNumber,
            floor,
            section,
            lockerType: Math.random() > 0.7 ? 'PAID' : 'FREE',
            status: isOccupied ? 'OCCUPIED' : (Math.random() > 0.9 ? 'MAINTENANCE' : 'AVAILABLE'),
            memberId: member?.id,
            monthlyFee: Math.random() > 0.7 ? 200 : null,
            assignedAt: isOccupied ? new Date() : null,
            expiresAt: isOccupied ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          }
        })
      }
    }
  }
  console.log('✅ Created 60 lockers')

  console.log('\n🛒 Creating products...')
  const products = [
    { name: 'MuscleBlaze Whey Protein 1kg', category: 'Supplements', price: 2499, stock: 50 },
    { name: 'ON Gold Standard Whey 2.27kg', category: 'Supplements', price: 5999, stock: 30 },
    { name: 'MyProtein Creatine 250g', category: 'Supplements', price: 899, stock: 75 },
    { name: 'Boldfit Resistance Bands Set', category: 'Accessories', price: 599, stock: 100 },
    { name: 'Fitbit Charge 5', category: 'Electronics', price: 14999, stock: 15 },
    { name: 'Nike Dri-FIT T-Shirt', category: 'Apparel', price: 1999, stock: 60 },
    { name: 'Adidas Training Shorts', category: 'Apparel', price: 1499, stock: 45 },
    { name: 'Yoga Mat Premium 6mm', category: 'Accessories', price: 799, stock: 80 },
    { name: 'Protein Shaker Bottle 700ml', category: 'Accessories', price: 299, stock: 150 },
    { name: 'Gym Gloves with Wrist Support', category: 'Accessories', price: 449, stock: 90 },
    { name: 'BCAA Powder - Watermelon', category: 'Supplements', price: 1299, stock: 40 },
    { name: 'Pre-Workout Energy Drink', category: 'Supplements', price: 1599, stock: 35 },
  ]

  for (const p of products) {
    await prisma.product.create({
      data: {
        tenantId,
        branchId,
        name: p.name,
        category: p.category,
        sellingPrice: p.price,
        costPrice: Math.floor(p.price * 0.6),
        stockQuantity: p.stock,
        sku: `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'ACTIVE',
        taxRate: 18,
      }
    })
  }
  console.log(`✅ Created ${products.length} products`)

  console.log('\n🏃 Creating equipment...')
  const equipmentList = [
    { name: 'Treadmill Pro 5000', type: 'CARDIO', brand: 'Technogym', qty: 8 },
    { name: 'Elliptical Cross Trainer', type: 'CARDIO', brand: 'Life Fitness', qty: 6 },
    { name: 'Spin Bike Pro', type: 'CARDIO', brand: 'Keiser', qty: 15 },
    { name: 'Rowing Machine', type: 'CARDIO', brand: 'Concept2', qty: 4 },
    { name: 'Smith Machine', type: 'STRENGTH', brand: 'Hammer Strength', qty: 3 },
    { name: 'Leg Press Machine', type: 'STRENGTH', brand: 'Technogym', qty: 2 },
    { name: 'Cable Crossover', type: 'STRENGTH', brand: 'Life Fitness', qty: 2 },
    { name: 'Lat Pulldown Machine', type: 'STRENGTH', brand: 'Precor', qty: 2 },
    { name: 'Adjustable Dumbbell Set', type: 'FREE_WEIGHTS', brand: 'Bowflex', qty: 10 },
    { name: 'Olympic Barbell 20kg', type: 'FREE_WEIGHTS', brand: 'Eleiko', qty: 8 },
    { name: 'Kettlebell Set (8-32kg)', type: 'FREE_WEIGHTS', brand: 'Rogue', qty: 6 },
    { name: 'Battle Ropes 15m', type: 'FUNCTIONAL', brand: 'Escape Fitness', qty: 4 },
  ]

  for (const e of equipmentList) {
    for (let i = 1; i <= e.qty; i++) {
      await prisma.equipment.create({
        data: {
          tenantId,
          branchId,
          name: `${e.name} #${i}`,
          type: e.type,
          brand: e.brand,
          model: `${e.brand.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          purchaseDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
          purchasePrice: 50000 + Math.floor(Math.random() * 200000),
          warrantyExpiry: new Date(2025 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), 1),
          status: Math.random() > 0.1 ? 'OPERATIONAL' : 'UNDER_MAINTENANCE',
          condition: randomPick(['EXCELLENT', 'GOOD', 'FAIR']),
          location: randomPick(['Main Floor', 'Cardio Zone', 'Weight Area', 'Functional Zone']),
        }
      })
    }
  }
  console.log('✅ Created equipment inventory')

  console.log('\n📋 Creating classes...')
  const classesData = [
    { name: 'Morning Yoga', type: 'YOGA', capacity: 20, duration: 60 },
    { name: 'Power Yoga', type: 'YOGA', capacity: 15, duration: 75 },
    { name: 'HIIT Blast', type: 'HIIT', capacity: 25, duration: 45 },
    { name: 'Zumba Fitness', type: 'DANCE', capacity: 30, duration: 60 },
    { name: 'Bollywood Dance', type: 'DANCE', capacity: 25, duration: 60 },
    { name: 'Spin Class', type: 'CARDIO', capacity: 15, duration: 45 },
    { name: 'CrossFit WOD', type: 'CROSSFIT', capacity: 12, duration: 60 },
    { name: 'Strength Training', type: 'STRENGTH', capacity: 10, duration: 60 },
    { name: 'Pilates Core', type: 'PILATES', capacity: 15, duration: 50 },
    { name: 'Boxing Fit', type: 'MARTIAL_ARTS', capacity: 20, duration: 60 },
  ]

  for (const c of classesData) {
    const trainer = randomPick(trainers)
    await prisma.class.create({
      data: {
        tenantId,
        branchId,
        name: c.name,
        description: `Join our ${c.name} class for an energizing workout experience!`,
        classType: c.type,
        duration: c.duration,
        capacity: c.capacity,
        trainerId: trainer.id,
        status: 'ACTIVE',
        price: 200 + Math.floor(Math.random() * 300),
      }
    })
  }
  console.log(`✅ Created ${classesData.length} classes`)

  console.log('\n🎯 Creating leads...')
  const leadSources = ['WALK_IN', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'GOOGLE_ADS', 'NEWSPAPER']
  const leadStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'TOUR_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION']

  for (let i = 0; i < 15; i++) {
    const firstName = randomPick(INDIAN_FIRST_NAMES)
    const lastName = randomPick(INDIAN_LAST_NAMES)

    await prisma.lead.create({
      data: {
        tenantId,
        branchId,
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        phone: generatePhone(),
        source: randomPick(leadSources),
        stage: randomPick(leadStages),
        score: Math.floor(Math.random() * 100),
        interestedIn: randomPick(['Monthly Membership', 'Annual Plan', 'Personal Training', 'Group Classes']),
        notes: 'Interested in joining the gym.',
        assignedToId: null,
      }
    })
  }
  console.log('✅ Created 15 leads')

  console.log('\n📊 Creating attendance records...')
  const today = new Date()
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)

    const dailyMembers = members.slice(0, 10 + Math.floor(Math.random() * 10))
    for (const member of dailyMembers) {
      const checkInHour = 5 + Math.floor(Math.random() * 12)
      const checkInTime = new Date(date)
      checkInTime.setHours(checkInHour, Math.floor(Math.random() * 60), 0, 0)

      const hasCheckedOut = Math.random() > 0.2
      let checkOutTime = null
      if (hasCheckedOut) {
        checkOutTime = new Date(checkInTime)
        checkOutTime.setHours(checkInTime.getHours() + 1 + Math.floor(Math.random() * 2))
      }

      await prisma.attendance.create({
        data: {
          tenantId,
          branchId,
          memberId: member.id,
          checkInTime,
          checkOutTime,
          notes: hasCheckedOut ? null : 'Currently in gym',
        }
      })
    }
  }
  console.log('✅ Created attendance records for last 7 days')

  console.log('\n🤝 Creating referrals...')
  for (let i = 0; i < 8; i++) {
    const referrer = members[i]
    const refereeFn = randomPick(INDIAN_FIRST_NAMES)
    const refereeLn = randomPick(INDIAN_LAST_NAMES)

    await prisma.referral.create({
      data: {
        tenantId,
        referrerId: referrer.id,
        refereeEmail: generateEmail(refereeFn, refereeLn),
        refereePhone: generatePhone(),
        status: randomPick(['PENDING', 'COMPLETED', 'REWARDED']),
        rewardType: '1 Month Free',
        rewardAmount: 500,
        completedAt: Math.random() > 0.5 ? new Date() : null,
      }
    })
  }
  console.log('✅ Created 8 referrals')

  console.log('\n🎉 Indian gym data seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - ${members.length} members`)
  console.log(`   - ${trainers.length} trainers`)
  console.log(`   - ${staffData.length} staff members`)
  console.log('   - 60 lockers')
  console.log(`   - ${products.length} products`)
  console.log('   - 72 equipment items')
  console.log(`   - ${classesData.length} classes`)
  console.log('   - 15 leads')
  console.log('   - 7 days of attendance records')
  console.log('   - 8 referrals')
}

seedIndianData()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export default seedIndianData
