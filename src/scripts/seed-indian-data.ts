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

function generateEmail(firstName: string, lastName: string, suffix: string = ''): string {
  const domains = ['gmail.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'rediffmail.com']
  const random = Math.floor(Math.random() * 1000)
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}${random}@${randomPick(domains)}`
}

function generateMembershipId(branchCode: string, index: number): string {
  const year = new Date().getFullYear().toString().slice(-2)
  const random = Math.floor(Math.random() * 10000)
  return `${branchCode}${year}${(index + random).toString().padStart(5, '0')}`
}

function generateEmployeeId(prefix: string, index: number): string {
  const year = new Date().getFullYear().toString().slice(-2)
  const random = Math.floor(Math.random() * 10000)
  return `${prefix}${year}${(index + random).toString().padStart(4, '0')}`
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

  console.log('\n👥 Creating Indian members...')
  const members: any[] = []
  const branchCode = 'INC'
  
  for (let i = 0; i < 25; i++) {
    const firstName = randomPick(INDIAN_FIRST_NAMES)
    const lastName = randomPick(INDIAN_LAST_NAMES)
    const city = randomPick(Object.keys(INDIAN_CITIES)) as keyof typeof INDIAN_CITIES
    const area = randomPick(INDIAN_CITIES[city].areas)

    try {
      const member = await prisma.member.create({
        data: {
          tenantId,
          branchId,
          membershipId: generateMembershipId(branchCode, i),
          firstName,
          lastName,
          email: generateEmail(firstName, lastName, `m${i}`),
          phone: generatePhone(),
          dateOfBirth: new Date(1985 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: i < 15 ? 'MALE' : 'FEMALE',
          address: `${Math.floor(Math.random() * 500) + 1}, ${area}, ${city}, ${INDIAN_CITIES[city].state}`,
          emergencyContact: `${randomPick(INDIAN_FIRST_NAMES)} ${lastName}`,
          emergencyPhone: generatePhone(),
          status: i < 20 ? 'ACTIVE' : 'INACTIVE',
        }
      })
      members.push(member)
    } catch (e: any) {
      console.log(`  Skipping member ${firstName} ${lastName}: ${e.message?.substring(0, 50)}`)
    }
  }
  console.log(`✅ Created ${members.length} members`)

  console.log('\n👨‍💼 Creating Indian staff members...')
  const staffRoles = ['MANAGER', 'RECEPTIONIST', 'MAINTENANCE', 'SALES'] as const
  const staffData = [
    { first: 'Suresh', last: 'Kumar', role: 'MANAGER' as const, department: 'Operations' },
    { first: 'Lakshmi', last: 'Menon', role: 'RECEPTIONIST' as const, department: 'Front Desk' },
    { first: 'Rajesh', last: 'Gupta', role: 'MAINTENANCE' as const, department: 'Facilities' },
    { first: 'Anita', last: 'Desai', role: 'SALES' as const, department: 'Sales' },
    { first: 'Rahul', last: 'Sharma', role: 'TRAINER' as const, department: 'Fitness' },
    { first: 'Priya', last: 'Iyer', role: 'TRAINER' as const, department: 'Fitness' },
  ]

  for (let i = 0; i < staffData.length; i++) {
    const s = staffData[i]
    try {
      await prisma.staffMember.create({
        data: {
          tenantId,
          branchId,
          employeeId: generateEmployeeId('EMP', i),
          firstName: s.first,
          lastName: s.last,
          email: generateEmail(s.first, s.last, 'staff'),
          phone: generatePhone(),
          role: s.role,
          department: s.department,
          status: 'ACTIVE',
          joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
          salary: 25000 + Math.floor(Math.random() * 50000),
        }
      })
    } catch (e: any) {
      console.log(`  Skipping staff ${s.first} ${s.last}: ${e.message?.substring(0, 50)}`)
    }
  }
  console.log(`✅ Created staff members`)

  console.log('\n🔐 Creating lockers...')
  const lockerSections = ['A', 'B', 'C']
  let lockerCount = 0
  
  for (let floor = 1; floor <= 2; floor++) {
    for (const section of lockerSections) {
      for (let num = 1; num <= 8; num++) {
        const lockerNumber = `${section}${floor}${num.toString().padStart(2, '0')}`
        
        try {
          await prisma.locker.create({
            data: {
              tenantId,
              branchId,
              lockerNumber,
              lockerType: Math.random() > 0.7 ? 'PREMIUM' : 'STANDARD',
              location: `Floor ${floor}, Section ${section}`,
              size: randomPick(['SMALL', 'MEDIUM', 'LARGE']),
              monthlyRate: 200 + Math.floor(Math.random() * 300),
              status: Math.random() > 0.1 ? 'AVAILABLE' : 'MAINTENANCE',
            }
          })
          lockerCount++
        } catch (e: any) {
          // Skip duplicates
        }
      }
    }
  }
  console.log(`✅ Created ${lockerCount} lockers`)

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
    try {
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
    } catch (e: any) {
      console.log(`  Skipping product ${p.name}: ${e.message?.substring(0, 50)}`)
    }
  }
  console.log(`✅ Created ${products.length} products`)

  console.log('\n🏃 Creating equipment...')
  const equipmentList = [
    { name: 'Treadmill Pro 5000', type: 'CARDIO', brand: 'Technogym', qty: 5 },
    { name: 'Elliptical Cross Trainer', type: 'CARDIO', brand: 'Life Fitness', qty: 4 },
    { name: 'Spin Bike Pro', type: 'CARDIO', brand: 'Keiser', qty: 10 },
    { name: 'Rowing Machine', type: 'CARDIO', brand: 'Concept2', qty: 3 },
    { name: 'Smith Machine', type: 'STRENGTH', brand: 'Hammer Strength', qty: 2 },
    { name: 'Leg Press Machine', type: 'STRENGTH', brand: 'Technogym', qty: 2 },
    { name: 'Cable Crossover', type: 'STRENGTH', brand: 'Life Fitness', qty: 2 },
    { name: 'Adjustable Dumbbell Set', type: 'FREE_WEIGHTS', brand: 'Bowflex', qty: 6 },
    { name: 'Olympic Barbell 20kg', type: 'FREE_WEIGHTS', brand: 'Eleiko', qty: 5 },
    { name: 'Kettlebell Set', type: 'FREE_WEIGHTS', brand: 'Rogue', qty: 4 },
  ]

  let equipmentCount = 0
  for (const e of equipmentList) {
    for (let i = 1; i <= e.qty; i++) {
      try {
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
        equipmentCount++
      } catch (e: any) {
        // Skip errors
      }
    }
  }
  console.log(`✅ Created ${equipmentCount} equipment items`)

  console.log('\n🎯 Creating leads...')
  const leadSources = ['WALK_IN', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'GOOGLE_ADS', 'NEWSPAPER'] as const
  const leadStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'TOUR_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION'] as const
  let leadCount = 0

  for (let i = 0; i < 15; i++) {
    const firstName = randomPick(INDIAN_FIRST_NAMES)
    const lastName = randomPick(INDIAN_LAST_NAMES)

    try {
      await prisma.lead.create({
        data: {
          tenantId,
          branchId,
          firstName,
          lastName,
          email: generateEmail(firstName, lastName, `lead${i}`),
          phone: generatePhone(),
          source: randomPick(leadSources),
          stage: randomPick(leadStages),
          score: Math.floor(Math.random() * 100),
          interestedIn: randomPick(['Monthly Membership', 'Annual Plan', 'Personal Training', 'Group Classes']),
          notes: 'Interested in joining the gym.',
        }
      })
      leadCount++
    } catch (e: any) {
      console.log(`  Skipping lead: ${e.message?.substring(0, 50)}`)
    }
  }
  console.log(`✅ Created ${leadCount} leads`)

  console.log('\n📊 Creating attendance records...')
  const today = new Date()
  let attendanceCount = 0

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)

    const dailyMembers = members.slice(0, 8 + Math.floor(Math.random() * 10))
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

      try {
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
        attendanceCount++
      } catch (e: any) {
        // Skip errors
      }
    }
  }
  console.log(`✅ Created ${attendanceCount} attendance records`)

  console.log('\n🤝 Creating referrals...')
  let referralCount = 0
  
  for (let i = 0; i < Math.min(8, members.length); i++) {
    const referrer = members[i]
    const refereeFn = randomPick(INDIAN_FIRST_NAMES)
    const refereeLn = randomPick(INDIAN_LAST_NAMES)

    try {
      await prisma.referral.create({
        data: {
          tenantId,
          referrerId: referrer.id,
          refereeEmail: generateEmail(refereeFn, refereeLn, `ref${i}`),
          refereePhone: generatePhone(),
          status: randomPick(['PENDING', 'COMPLETED', 'REWARDED']),
          rewardType: '1 Month Free',
          rewardAmount: 500,
          completedAt: Math.random() > 0.5 ? new Date() : null,
        }
      })
      referralCount++
    } catch (e: any) {
      console.log(`  Skipping referral: ${e.message?.substring(0, 50)}`)
    }
  }
  console.log(`✅ Created ${referralCount} referrals`)

  console.log('\n🎉 Indian gym data seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - ${members.length} members`)
  console.log(`   - ${staffData.length} staff members`)
  console.log(`   - ${lockerCount} lockers`)
  console.log(`   - ${products.length} products`)
  console.log(`   - ${equipmentCount} equipment items`)
  console.log(`   - ${leadCount} leads`)
  console.log(`   - ${attendanceCount} attendance records`)
  console.log(`   - ${referralCount} referrals`)
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
