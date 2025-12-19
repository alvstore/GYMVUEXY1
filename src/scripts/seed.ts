import { PrismaClient } from '@prisma/client';
import { RBACService } from '../lib/rbac';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Define the order of seed scripts to respect data dependencies
const SEED_SCRIPTS_ORDER = [
  // Core setup (roles, permissions, super admin)
  'seed-roles-permissions',  // Handled by RBACService.seedRolesAndPermissions()
  'seed-superadmin',
  
  // Reference data
  'seed-rooms',
  'seed-trainers',
  'seed-membership-plans',
  'seed-plan-templates',
  'seed-lockers-inventory',
  'seed-communication-templates',
  
  // Indian test data (members, trainers, staff, products, equipment, etc.)
  'seed-indian-data',
];

async function runSeedScript(scriptName: string) {
  try {
    console.log(`\n🌱 Running ${scriptName}...`);
    const scriptPath = path.join(__dirname, `${scriptName}.ts`);
    
    // Check if the script exists
    try {
      await fs.access(scriptPath);
    } catch {
      console.log(`ℹ️  ${scriptName} not found, skipping...`);
      return;
    }

    // Import and run the script
    const module = await import(`./${scriptName}.js`);
    if (module.default) {
      await module.default();
    } else if (module.seed) {
      await module.seed();
    } else if (module.main) {
      await module.main();
    }
    console.log(`✅ ${scriptName} completed successfully`);
  } catch (error) {
    console.error(`❌ Error in ${scriptName}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database seeding process...');

  try {
    // Seed roles and permissions first
    console.log('\n🌱 Seeding roles and permissions...');
    await RBACService.seedRolesAndPermissions();
    console.log('✅ Roles and permissions seeded');

    // Run other seed scripts in order
    for (const scriptName of SEED_SCRIPTS_ORDER) {
      if (scriptName === 'seed-roles-permissions') continue; // Already handled above
      await runSeedScript(scriptName);
    }

    console.log('\n🎉 All seed scripts completed successfully!');
    console.log('\n💡 You can now log in with the super admin account:');
    console.log('   Email: admin@gympro.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error in seeding process:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });