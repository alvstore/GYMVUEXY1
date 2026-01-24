import { PrismaClient, FacilityType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed() {
  console.log('🏊 Seeding facilities and booking slots...');

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('❌ No tenant found. Please run seed-indian-data first.');
    return;
  }

  const branch = await prisma.branch.findFirst({
    where: { tenantId: tenant.id },
  });
  if (!branch) {
    console.log('❌ No branch found. Please run seed-indian-data first.');
    return;
  }

  const facilities = [
    {
      name: 'Infrared Sauna',
      facilityType: FacilityType.SAUNA,
      description: 'Full-spectrum infrared sauna session for detox and relaxation',
      maxCapacity: 4,
      durationMinutes: 30,
      linkedBenefitName: 'Infrared Sauna',
    },
    {
      name: 'Ice Bath',
      facilityType: FacilityType.ICE_BATH,
      description: 'Cold plunge therapy for muscle recovery and improved circulation',
      maxCapacity: 2,
      durationMinutes: 15,
      linkedBenefitName: 'Ice Bath',
    },
    {
      name: 'Steam Room',
      facilityType: FacilityType.STEAM_ROOM,
      description: 'Traditional steam room for relaxation and respiratory benefits',
      maxCapacity: 6,
      durationMinutes: 20,
      linkedBenefitName: 'Steam Room',
    },
  ];

  for (const facilityData of facilities) {
    const facility = await prisma.facility.upsert({
      where: {
        branchId_name: {
          branchId: branch.id,
          name: facilityData.name,
        },
      },
      update: facilityData,
      create: {
        ...facilityData,
        tenantId: tenant.id,
        branchId: branch.id,
      },
    });

    console.log(`✅ Created/Updated facility: ${facility.name}`);

    const timeSlots = generateTimeSlots(facilityData.durationMinutes);
    
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      for (const slot of timeSlots) {
        await prisma.bookingSlot.upsert({
          where: {
            facilityId_dayOfWeek_startTime: {
              facilityId: facility.id,
              dayOfWeek,
              startTime: slot.startTime,
            },
          },
          update: {
            endTime: slot.endTime,
            isActive: true,
          },
          create: {
            facilityId: facility.id,
            dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: true,
          },
        });
      }
    }
    
    console.log(`  📅 Created ${timeSlots.length * 7} booking slots for ${facility.name}`);
  }

  console.log('✅ Facility seeding complete!');
}

function generateTimeSlots(durationMinutes: number): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];
  const startHour = 6;
  const endHour = 21;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += durationMinutes) {
      const endMinutes = minute + durationMinutes;
      const endHourAdjusted = hour + Math.floor(endMinutes / 60);
      const endMinuteAdjusted = endMinutes % 60;

      if (endHourAdjusted > endHour || (endHourAdjusted === endHour && endMinuteAdjusted > 0)) {
        continue;
      }

      const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const endTime = `${String(endHourAdjusted).padStart(2, '0')}:${String(endMinuteAdjusted).padStart(2, '0')}`;

      slots.push({ startTime, endTime });
    }
  }

  return slots;
}

export default seed;

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error seeding facilities:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
