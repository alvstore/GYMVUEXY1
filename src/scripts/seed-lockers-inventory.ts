import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedLockersAndInventory() {
  console.log('🌱 Seeding lockers and inventory...')

  // Get the first tenant and branch for seeding
  const tenant = await prisma.tenant.findFirst()
  const branch = await prisma.branch.findFirst()

  if (!tenant || !branch) {
    console.log('❌ No tenant or branch found. Please run the main seed script first.')
    return
  }

  // Create lockers
  const lockers = [
    // Ground Floor - Standard Lockers
    ...Array.from({ length: 50 }, (_, i) => ({
      tenantId: tenant.id,
      branchId: branch.id,
      lockerNumber: `L${String(i + 1).padStart(3, '0')}`,
      lockerType: 'STANDARD',
      location: 'Ground Floor - Section A',
      size: 'MEDIUM',
      monthlyRate: 500,
      isActive: true,
      isOccupied: i < 30, // First 30 are occupied
    })),
    // First Floor - Premium Lockers
    ...Array.from({ length: 20 }, (_, i) => ({
      tenantId: tenant.id,
      branchId: branch.id,
      lockerNumber: `P${String(i + 1).padStart(3, '0')}`,
      lockerType: 'PREMIUM',
      location: 'First Floor - Premium Section',
      size: 'LARGE',
      monthlyRate: 800,
      isActive: true,
      isOccupied: i < 12, // First 12 are occupied
    })),
    // VIP Lockers
    ...Array.from({ length: 10 }, (_, i) => ({
      tenantId: tenant.id,
      branchId: branch.id,
      lockerNumber: `V${String(i + 1).padStart(2, '0')}`,
      lockerType: 'VIP',
      location: 'VIP Section',
      size: 'EXTRA_LARGE',
      monthlyRate: 1200,
      isActive: true,
      isOccupied: i < 5, // First 5 are occupied
    })),
  ]

  for (const locker of lockers) {
    await prisma.locker.upsert({
      where: {
        branchId_lockerNumber: {
          branchId: locker.branchId,
          lockerNumber: locker.lockerNumber,
        },
      },
      update: {},
      create: locker,
    })
  }

  // Create vendors
  const vendors = [
    {
      tenantId: tenant.id,
      name: 'MuscleBlaze India',
      contactPerson: 'Rajesh Kumar',
      email: 'sales@muscleblaze.com',
      phone: '+91 98765 43210',
      address: 'Mumbai, Maharashtra',
      gstin: '27AABCU9603R1ZX',
    },
    {
      tenantId: tenant.id,
      name: 'Nike India Pvt Ltd',
      contactPerson: 'Priya Sharma',
      email: 'wholesale@nike.co.in',
      phone: '+91 98765 43211',
      address: 'Gurgaon, Haryana',
      gstin: '06AABCU9603R1ZY',
    },
    {
      tenantId: tenant.id,
      name: 'Fitness Equipment Co.',
      contactPerson: 'Amit Patel',
      email: 'orders@fitnessequip.in',
      phone: '+91 98765 43212',
      address: 'Pune, Maharashtra',
      gstin: '27AABCU9603R1ZZ',
    },
  ]

  const createdVendors = []
  for (const vendor of vendors) {
    const createdVendor = await prisma.vendor.upsert({
      where: {
        id: `${vendor.name.toLowerCase().replace(/\s+/g, '-')}-${tenant.id}`,
      },
      update: {},
      create: {
        id: `${vendor.name.toLowerCase().replace(/\s+/g, '-')}-${tenant.id}`,
        ...vendor,
      },
    })
    createdVendors.push(createdVendor)
  }

  // Create products
  const products = [
    // Supplements
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Whey Protein Isolate - Chocolate',
      description: 'Premium whey protein isolate for muscle building',
      category: 'Supplements',
      subcategory: 'Protein',
      sku: 'SUP-PRO-001',
      brand: 'MuscleBlaze',
      costPrice: 1899,
      sellingPrice: 2499,
      mrp: 2999,
      taxRate: 18,
      stockQuantity: 45,
      minStockLevel: 10,
      reorderPoint: 15,
      unit: 'piece',
      weight: 2.0,
      vendorId: createdVendors[0].id,
      vendorName: createdVendors[0].name,
      status: 'ACTIVE',
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Pre-Workout - Fruit Punch',
      description: 'High-energy pre-workout supplement',
      category: 'Supplements',
      subcategory: 'Pre-Workout',
      sku: 'SUP-PRE-001',
      brand: 'Optimum Nutrition',
      costPrice: 1399,
      sellingPrice: 1899,
      mrp: 2199,
      taxRate: 18,
      stockQuantity: 25,
      minStockLevel: 8,
      reorderPoint: 12,
      unit: 'piece',
      weight: 0.6,
      vendorId: createdVendors[0].id,
      status: 'ACTIVE',
    },
    // Apparel
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Gym T-Shirt - Black (L)',
      description: 'Premium cotton gym t-shirt',
      category: 'Apparel',
      subcategory: 'T-Shirts',
      sku: 'APP-TSH-001',
      brand: 'Nike',
      costPrice: 899,
      sellingPrice: 1299,
      mrp: 1599,
      taxRate: 12,
      stockQuantity: 5,
      minStockLevel: 15,
      reorderPoint: 20,
      unit: 'piece',
      vendorId: createdVendors[1].id,
      status: 'ACTIVE',
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Gym Shorts - Navy (M)',
      description: 'Moisture-wicking gym shorts',
      category: 'Apparel',
      subcategory: 'Shorts',
      sku: 'APP-SHO-001',
      brand: 'Adidas',
      costPrice: 799,
      sellingPrice: 1199,
      mrp: 1499,
      taxRate: 12,
      stockQuantity: 18,
      minStockLevel: 12,
      reorderPoint: 18,
      unit: 'piece',
      vendorId: createdVendors[1].id,
      status: 'ACTIVE',
    },
    // Accessories
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Shaker Bottle - 600ml',
      description: 'BPA-free protein shaker bottle',
      category: 'Accessories',
      subcategory: 'Bottles',
      sku: 'ACC-BOT-001',
      brand: 'BlenderBottle',
      costPrice: 399,
      sellingPrice: 599,
      mrp: 799,
      taxRate: 18,
      stockQuantity: 0,
      minStockLevel: 20,
      reorderPoint: 30,
      unit: 'piece',
      vendorId: createdVendors[2].id,
      status: 'OUT_OF_STOCK',
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Gym Gloves - Medium',
      description: 'Anti-slip workout gloves',
      category: 'Accessories',
      subcategory: 'Gloves',
      sku: 'ACC-GLO-001',
      brand: 'Harbinger',
      costPrice: 699,
      sellingPrice: 999,
      mrp: 1299,
      taxRate: 18,
      stockQuantity: 40,
      minStockLevel: 15,
      reorderPoint: 25,
      unit: 'piece',
      vendorId: createdVendors[2].id,
      status: 'ACTIVE',
    },
    // Equipment
    {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Resistance Bands Set',
      description: 'Complete resistance bands set with handles',
      category: 'Equipment',
      subcategory: 'Resistance Training',
      sku: 'EQP-RES-001',
      brand: 'Bodylastics',
      costPrice: 1299,
      sellingPrice: 1899,
      mrp: 2299,
      taxRate: 18,
      stockQuantity: 15,
      minStockLevel: 8,
      reorderPoint: 12,
      unit: 'set',
      weight: 1.5,
      vendorId: createdVendors[2].id,
      status: 'ACTIVE',
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        branchId_sku: {
          branchId: product.branchId,
          sku: product.sku,
        },
      },
      update: {},
      create: product,
    })
  }

  console.log('✅ Lockers and inventory seeded successfully!')
  console.log(`   - Created ${lockers.length} lockers`)
  console.log(`   - Created ${vendors.length} vendors`)
  console.log(`   - Created ${products.length} products`)
}

seedLockersAndInventory()
  .catch((e) => {
    console.error('❌ Seeding lockers and inventory failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })