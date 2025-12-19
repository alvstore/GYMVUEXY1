import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPlanTemplates() {
  console.log('🌱 Seeding plan templates...')

  // Get the first tenant, branch, and a trainer for seeding
  const tenant = await prisma.tenant.findFirst()
  const branch = await prisma.branch.findFirst()
  const trainer = await prisma.trainerProfile.findFirst({
    include: { user: true },
  })

  if (!tenant || !branch) {
    console.log('❌ No tenant or branch found. Please run the main seed script first.')
    return
  }

  const creatorId = trainer?.userId || (await prisma.user.findFirst())?.id

  if (!creatorId) {
    console.log('❌ No user found to assign as creator.')
    return
  }

  // Indian Diet Plan Templates
  const dietTemplates = [
    {
      tenantId: tenant.id,
      branchId: branch.id,
      createdBy: creatorId,
      name: 'South Indian Vegetarian Weight Loss',
      description: 'Traditional South Indian vegetarian meals optimized for healthy weight loss',
      planType: 'DIET',
      category: 'WEIGHT_LOSS',
      difficulty: 'BEGINNER',
      duration: 30,
      visibility: 'PUBLIC',
      tags: ['vegetarian', 'south indian', 'weight loss', 'traditional'],
      content: {
        title: 'South Indian Vegetarian Weight Loss Plan',
        description: '30-day traditional South Indian diet plan for healthy weight loss',
        totalCalories: 1400,
        macroSplit: { protein: 20, carbs: 55, fat: 25 },
        days: [
          {
            day: 1,
            meals: {
              breakfast: {
                time: '07:00',
                items: ['Idli (2 pieces)', 'Sambar (1 bowl)', 'Coconut chutney (2 tbsp)', 'Filter coffee'],
                calories: 320,
                protein: '12g',
                carbs: '58g',
                fat: '8g',
              },
              midMorning: {
                time: '10:00',
                items: ['Buttermilk (1 glass)', 'Roasted groundnuts (10-12)'],
                calories: 120,
                protein: '4g',
                carbs: '8g',
                fat: '6g',
              },
              lunch: {
                time: '13:00',
                items: ['Brown rice (1 cup)', 'Rasam (1 bowl)', 'Poriyal (mixed vegetables)', 'Curd (1 bowl)', 'Pickle (1 tsp)'],
                calories: 450,
                protein: '15g',
                carbs: '75g',
                fat: '12g',
              },
              evening: {
                time: '16:00',
                items: ['Green tea', 'Murukku (2 pieces)'],
                calories: 80,
                protein: '2g',
                carbs: '12g',
                fat: '3g',
              },
              dinner: {
                time: '19:30',
                items: ['Dosa (1 medium)', 'Sambar (1 bowl)', 'Tomato chutney', 'Steamed vegetables'],
                calories: 380,
                protein: '14g',
                carbs: '65g',
                fat: '10g',
              },
            },
            totalCalories: 1350,
            waterIntake: '3-4 liters',
            notes: 'Include curry leaves and turmeric in cooking for added nutrition',
          },
        ],
        guidelines: [
          'Use minimal oil in cooking (coconut oil preferred)',
          'Include fermented foods like idli, dosa for gut health',
          'Drink buttermilk instead of lassi for lower calories',
          'Use jaggery instead of sugar in moderation',
          'Include seasonal South Indian vegetables',
        ],
        supplements: ['Vitamin B12', 'Iron (if needed)', 'Calcium'],
      },
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      createdBy: creatorId,
      name: 'North Indian Protein Rich Muscle Building',
      description: 'High-protein North Indian cuisine plan for muscle building and strength',
      planType: 'DIET',
      category: 'MUSCLE_BUILDING',
      difficulty: 'INTERMEDIATE',
      duration: 45,
      visibility: 'PUBLIC',
      tags: ['high protein', 'north indian', 'muscle building', 'strength'],
      content: {
        title: 'North Indian Protein Rich Muscle Building Plan',
        description: '45-day high-protein North Indian diet for muscle building',
        totalCalories: 2200,
        macroSplit: { protein: 30, carbs: 45, fat: 25 },
        days: [
          {
            day: 1,
            meals: {
              breakfast: {
                time: '07:00',
                items: ['Paratha (2 medium)', 'Paneer bhurji (100g)', 'Curd (1 bowl)', 'Lassi (1 glass)'],
                calories: 520,
                protein: '25g',
                carbs: '45g',
                fat: '22g',
              },
              midMorning: {
                time: '10:00',
                items: ['Banana (1 large)', 'Almonds (10-12)', 'Milk (1 glass)'],
                calories: 280,
                protein: '12g',
                carbs: '35g',
                fat: '10g',
              },
              lunch: {
                time: '13:00',
                items: ['Roti (3 pieces)', 'Dal makhani (1 bowl)', 'Chicken curry (150g)', 'Rice (1 cup)', 'Salad'],
                calories: 650,
                protein: '40g',
                carbs: '65g',
                fat: '20g',
              },
              preworkout: {
                time: '16:00',
                items: ['Banana', 'Black coffee', 'Dates (3-4)'],
                calories: 150,
                protein: '3g',
                carbs: '35g',
                fat: '1g',
              },
              postworkout: {
                time: '18:00',
                items: ['Protein shake (whey + milk)', 'Apple (1 medium)'],
                calories: 200,
                protein: '25g',
                carbs: '20g',
                fat: '3g',
              },
              dinner: {
                time: '20:00',
                items: ['Roti (2 pieces)', 'Rajma (1 bowl)', 'Paneer tikka (100g)', 'Cucumber raita'],
                calories: 480,
                protein: '28g',
                carbs: '45g',
                fat: '18g',
              },
            },
            totalCalories: 2280,
            totalProtein: '133g',
            waterIntake: '4-5 liters',
            notes: 'Increase protein intake on workout days',
          },
        ],
        guidelines: [
          'Include protein in every meal',
          'Use ghee in moderation for healthy fats',
          'Time protein intake around workouts',
          'Include traditional fermented foods',
          'Stay hydrated throughout the day',
        ],
        supplements: ['Whey protein', 'Creatine', 'Multivitamin', 'Fish oil'],
      },
    },
  ]

  // Workout Plan Templates
  const workoutTemplates = [
    {
      tenantId: tenant.id,
      branchId: branch.id,
      createdBy: creatorId,
      name: 'Beginner Full Body Strength',
      description: 'Perfect starter workout plan for building overall strength and fitness',
      planType: 'WORKOUT',
      category: 'STRENGTH_TRAINING',
      difficulty: 'BEGINNER',
      duration: 28,
      visibility: 'PUBLIC',
      tags: ['beginner', 'full body', 'strength', 'gym'],
      content: {
        title: 'Beginner Full Body Strength Training',
        description: '4-week progressive strength training program',
        daysPerWeek: 3,
        estimatedDuration: '45-60 minutes per session',
        equipment: ['Dumbbells', 'Barbell', 'Bench', 'Yoga mat'],
        days: [
          {
            day: 1,
            type: 'strength',
            title: 'Full Body Strength A',
            warmup: {
              duration: 10,
              exercises: [
                'Light cardio - 5 minutes',
                'Dynamic stretching - 5 minutes',
              ],
            },
            mainWorkout: {
              duration: 35,
              exercises: [
                { name: 'Goblet squats', sets: 3, reps: '12-15', rest: '90s', weight: 'Light dumbbell' },
                { name: 'Push-ups (modified if needed)', sets: 3, reps: '8-12', rest: '90s' },
                { name: 'Bent-over dumbbell rows', sets: 3, reps: '12-15', rest: '90s' },
                { name: 'Overhead press', sets: 3, reps: '10-12', rest: '90s' },
                { name: 'Plank hold', sets: 3, reps: '30-45s', rest: '60s' },
                { name: 'Glute bridges', sets: 3, reps: '15-20', rest: '60s' },
              ],
            },
            cooldown: {
              duration: 10,
              exercises: [
                'Walking - 3 minutes',
                'Static stretching - 7 minutes',
              ],
            },
            notes: 'Focus on proper form over heavy weights',
          },
          {
            day: 2,
            type: 'cardio',
            title: 'Active Recovery',
            warmup: {
              duration: 5,
              exercises: ['Light walking', 'Gentle stretching'],
            },
            mainWorkout: {
              duration: 25,
              exercises: [
                { name: 'Brisk walking', duration: '20 minutes', intensity: 'Moderate pace' },
                { name: 'Yoga flow', duration: '15 minutes' },
              ],
            },
            cooldown: {
              duration: 10,
              exercises: ['Relaxation stretches', 'Deep breathing'],
            },
            notes: 'Keep intensity low for recovery',
          },
        ],
        progressTracking: [
          'Record weights used for each exercise',
          'Track workout completion',
          'Note energy levels',
          'Take progress photos weekly',
        ],
        guidelines: [
          'Start with bodyweight or light weights',
          'Rest 48 hours between strength sessions',
          'Progress gradually each week',
          'Listen to your body',
          'Stay consistent',
        ],
      },
    },
    {
      tenantId: tenant.id,
      branchId: branch.id,
      createdBy: creatorId,
      name: 'HIIT Fat Burning Circuit',
      description: 'High-intensity interval training for maximum fat burning',
      planType: 'WORKOUT',
      category: 'WEIGHT_LOSS',
      difficulty: 'INTERMEDIATE',
      duration: 21,
      visibility: 'PUBLIC',
      tags: ['hiit', 'fat burning', 'cardio', 'circuit'],
      content: {
        title: 'HIIT Fat Burning Circuit',
        description: '3-week high-intensity fat burning program',
        daysPerWeek: 4,
        estimatedDuration: '30-40 minutes per session',
        equipment: ['Yoga mat', 'Dumbbells (optional)', 'Timer'],
        days: [
          {
            day: 1,
            type: 'hiit',
            title: 'Upper Body HIIT',
            warmup: {
              duration: 8,
              exercises: [
                'Arm circles - 1 minute',
                'Shoulder rolls - 1 minute',
                'Light jogging in place - 3 minutes',
                'Dynamic arm stretches - 3 minutes',
              ],
            },
            mainWorkout: {
              duration: 20,
              exercises: [
                { name: 'Burpees', work: '30s', rest: '30s', rounds: 4 },
                { name: 'Mountain climbers', work: '30s', rest: '30s', rounds: 4 },
                { name: 'Push-up to T', work: '30s', rest: '30s', rounds: 4 },
                { name: 'Plank jacks', work: '30s', rest: '30s', rounds: 4 },
                { name: 'Jump squats', work: '30s', rest: '30s', rounds: 4 },
              ],
            },
            cooldown: {
              duration: 10,
              exercises: [
                'Walking in place - 3 minutes',
                'Upper body stretches - 7 minutes',
              ],
            },
            notes: 'Maintain high intensity during work periods',
          },
        ],
        progressTracking: [
          'Track rounds completed',
          'Monitor heart rate',
          'Record perceived exertion',
          'Measure body composition weekly',
        ],
        guidelines: [
          'Work at 80-90% max effort during intervals',
          'Complete rest during recovery periods',
          'Stay hydrated throughout',
          'Modify exercises if needed',
          'Track progress weekly',
        ],
      },
    },
  ]

  // Create diet templates
  for (const template of dietTemplates) {
    await prisma.planTemplate.upsert({
      where: {
        id: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${tenant.id}`,
      },
      update: {},
      create: {
        id: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${tenant.id}`,
        ...template,
      },
    })
  }

  // Create workout templates
  for (const template of workoutTemplates) {
    await prisma.planTemplate.upsert({
      where: {
        id: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${tenant.id}`,
      },
      update: {},
      create: {
        id: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${tenant.id}`,
        ...template,
      },
    })
  }

  console.log('✅ Plan templates seeded successfully!')
}

seedPlanTemplates()
  .catch((e) => {
    console.error('❌ Seeding plan templates failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })