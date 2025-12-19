import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding default super admin...');

  // Check if super admin already exists
  const existingUser = await prisma.user.findFirst({
    where: { email: 'admin@gympro.com' }
  });

  if (existingUser) {
    console.log('ℹ️  Super admin already exists, skipping...');
    return;
  }

  // Create default tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Gym Organization',
      slug: 'demo-gym',
      email: 'info@demo-gym.com',
      phone: '+91 98765 43210',
      address: '123 Fitness Street, Demo City, India',
      isActive: true,
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create default branch
  const branch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Main Branch',
      code: 'MAIN-001',
      address: '123 Fitness Street',
      city: 'Demo City',
      state: 'Demo State',
      pincode: '123456',
      phone: '+91 98765 43210',
      email: 'main@gympro.com',
      isActive: true,
    },
  });

  console.log('✅ Created branch:', branch.name);

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create super admin user
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@gympro.com',
      name: 'Super Admin',
      phone: '+91 98765 43210',
      isActive: true,
      passwordHash: hashedPassword,
    },
  });

  console.log('✅ Created user:', user.email);

  // Get super_admin role
  const superAdminRole = await prisma.role.findFirst({
    where: { name: 'super_admin' },
  });

  if (!superAdminRole) {
    console.error('❌ Super admin role not found. Please run seed.ts first.');
    return;
  }

  // Assign super admin role
  await prisma.userRoleAssignment.create({
    data: {
      userId: user.id,
      roleId: superAdminRole.id,
      branchId: branch.id,
    },
  });

  console.log('✅ Assigned super_admin role to user');

  console.log('\n🎉 Default super admin created successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('   Email: admin@gympro.com');
  console.log('   Password: admin123');
  console.log('\n⚠️  IMPORTANT: Change this password after first login in production!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
