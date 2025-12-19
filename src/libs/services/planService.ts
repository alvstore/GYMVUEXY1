import { prisma } from '@/lib/prisma'
import { PlanTemplate, PlanType, PlanCategory, PlanDifficulty, PlanVisibility, MemberPlan, MemberPlanStatus, HistoryAction } from '@prisma/client'

export interface CreatePlanTemplateData {
  tenantId: string
  branchId?: string
  createdBy: string
  name: string
  description?: string
  planType: PlanType
  category: PlanCategory
  difficulty: PlanDifficulty
  duration: number
  visibility?: PlanVisibility
  content: any
  tags?: string[]
  isAiGenerated?: boolean
}

export interface UpdatePlanTemplateData extends Partial<CreatePlanTemplateData> {
  id: string
}

export interface CreateMemberPlanData {
  memberId: string
  templateId?: string
  trainerId?: string
  name: string
  planType: PlanType
  category: PlanCategory
  difficulty: PlanDifficulty
  content: any
  startDate: Date
  endDate?: Date
  customNotes?: string
}

export interface PlanFilters {
  tenantId?: string
  branchId?: string
  planType?: PlanType
  category?: PlanCategory
  difficulty?: PlanDifficulty
  visibility?: PlanVisibility
  search?: string
  createdBy?: string
  isAiGenerated?: boolean
  isFeatured?: boolean
}

export interface AIGenerationRequest {
  memberId: string
  planType: PlanType
  category: PlanCategory
  duration: number
  preferences?: {
    dietaryRestrictions?: string[]
    allergies?: string[]
    foodPreference?: string
    activityLevel?: string
    fitnessGoals?: string[]
    availableEquipment?: string[]
    timeConstraints?: string
  }
}

export class PlanService {
  // Template Management
  static async createTemplate(data: CreatePlanTemplateData): Promise<PlanTemplate> {
    return await prisma.planTemplate.create({
      data: {
        ...data,
        tags: data.tags || [],
        visibility: data.visibility || 'PUBLIC',
        isAiGenerated: data.isAiGenerated || false,
      },
    })
  }

  static async updateTemplate(data: UpdatePlanTemplateData): Promise<PlanTemplate> {
    const { id, ...updateData } = data
    return await prisma.planTemplate.update({
      where: { id },
      data: updateData,
    })
  }

  static async deleteTemplate(id: string): Promise<void> {
    await prisma.planTemplate.update({
      where: { id },
      data: { isActive: false },
    })
  }

  static async getTemplate(id: string) {
    return await prisma.planTemplate.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        reviews: {
          include: {
            member: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            memberPlans: true,
            favorites: true,
            reviews: true,
          },
        },
      },
    })
  }

  static async getTemplates(filters: PlanFilters = {}, page = 1, limit = 20) {
    const where: any = {
      isActive: true,
    }

    if (filters.tenantId) {
      where.tenantId = filters.tenantId
    }

    if (filters.branchId) {
      where.OR = [
        { branchId: filters.branchId },
        { branchId: null }, // Include tenant-wide templates
      ]
    }

    if (filters.planType) {
      where.planType = filters.planType
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty
    }

    if (filters.visibility) {
      where.visibility = filters.visibility
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ]
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy
    }

    if (filters.isAiGenerated !== undefined) {
      where.isAiGenerated = filters.isAiGenerated
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured
    }

    const [templates, total] = await Promise.all([
      prisma.planTemplate.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              memberPlans: true,
              favorites: true,
              reviews: true,
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { usageCount: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.planTemplate.count({ where }),
    ])

    return {
      templates,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  }

  // Member Plan Management
  static async createMemberPlan(data: CreateMemberPlanData): Promise<MemberPlan> {
    const result = await prisma.$transaction(async (tx) => {
      // Create member plan
      const memberPlan = await tx.memberPlan.create({
        data: {
          ...data,
          status: 'ACTIVE',
          progress: 0,
          isCustomized: !data.templateId,
        },
      })

      // Update template usage count if using a template
      if (data.templateId) {
        await tx.planTemplate.update({
          where: { id: data.templateId },
          data: {
            usageCount: { increment: 1 },
          },
        })
      }

      // Create history record
      await tx.planHistory.create({
        data: {
          memberPlanId: memberPlan.id,
          action: 'CREATED',
          description: `Plan created: ${memberPlan.name}`,
          newData: memberPlan,
          performedBy: data.trainerId || 'system',
        },
      })

      return memberPlan
    })

    return result
  }

  static async updateMemberPlan(id: string, data: Partial<CreateMemberPlanData>, performedBy: string): Promise<MemberPlan> {
    const existingPlan = await prisma.memberPlan.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      throw new Error('Member plan not found')
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedPlan = await tx.memberPlan.update({
        where: { id },
        data: {
          ...data,
          isCustomized: true,
          updatedAt: new Date(),
        },
      })

      // Create history record
      await tx.planHistory.create({
        data: {
          memberPlanId: id,
          action: 'MODIFIED',
          description: 'Plan content updated',
          oldData: existingPlan,
          newData: updatedPlan,
          performedBy,
        },
      })

      return updatedPlan
    })

    return result
  }

  static async updateMemberPlanProgress(id: string, progress: number, performedBy: string): Promise<MemberPlan> {
    const result = await prisma.$transaction(async (tx) => {
      const updatedPlan = await tx.memberPlan.update({
        where: { id },
        data: { progress },
      })

      // Create history record
      await tx.planHistory.create({
        data: {
          memberPlanId: id,
          action: 'PROGRESS_UPDATED',
          description: `Progress updated to ${progress}%`,
          newData: { progress },
          performedBy,
        },
      })

      return updatedPlan
    })

    return result
  }

  static async getMemberPlan(id: string) {
    return await prisma.memberPlan.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            membershipId: true,
            height: true,
            weight: true,
            dateOfBirth: true,
            gender: true,
            foodPreference: true,
            activityLevel: true,
            allergies: true,
            medicalConditions: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            difficulty: true,
          },
        },
        trainer: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        history: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        progressPhotos: {
          orderBy: { measurementDate: 'desc' },
        },
      },
    })
  }

  static async getMemberPlans(memberId: string, planType?: PlanType) {
    return await prisma.memberPlan.findMany({
      where: {
        memberId,
        ...(planType && { planType }),
      },
      include: {
        template: {
          select: {
            name: true,
            category: true,
            difficulty: true,
          },
        },
        trainer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Favorites Management
  static async addToFavorites(memberId: string, templateId: string) {
    return await prisma.planFavorite.create({
      data: {
        memberId,
        templateId,
      },
    })
  }

  static async removeFromFavorites(memberId: string, templateId: string) {
    return await prisma.planFavorite.delete({
      where: {
        memberId_templateId: {
          memberId,
          templateId,
        },
      },
    })
  }

  static async getMemberFavorites(memberId: string) {
    return await prisma.planFavorite.findMany({
      where: { memberId },
      include: {
        template: {
          include: {
            creator: {
              select: {
                name: true,
              },
            },
            _count: {
              select: {
                memberPlans: true,
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // AI Generation (Stub Implementation)
  static async generatePlan(request: AIGenerationRequest): Promise<any> {
    // Get member details for context
    const member = await prisma.member.findUnique({
      where: { id: request.memberId },
      include: {
        measurements: {
          orderBy: { measurementDate: 'desc' },
          take: 1,
        },
      },
    })

    if (!member) {
      throw new Error('Member not found')
    }

    // Mock AI generation - In production, this would call OpenAI/Claude API
    const mockPlanContent = this.generateMockPlan(request, member)

    return {
      success: true,
      planContent: mockPlanContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        memberMetrics: {
          height: member.height,
          weight: member.weight,
          activityLevel: member.activityLevel,
          foodPreference: member.foodPreference,
        },
        preferences: request.preferences,
      },
    }
  }

  private static generateMockPlan(request: AIGenerationRequest, member: any) {
    if (request.planType === 'DIET') {
      return this.generateMockDietPlan(request, member)
    } else if (request.planType === 'WORKOUT') {
      return this.generateMockWorkoutPlan(request, member)
    } else {
      return {
        diet: this.generateMockDietPlan(request, member),
        workout: this.generateMockWorkoutPlan(request, member),
      }
    }
  }

  private static generateMockDietPlan(request: AIGenerationRequest, member: any) {
    const isVegetarian = member.foodPreference === 'VEGETARIAN' || member.foodPreference === 'VEGAN'
    
    const days = []
    for (let i = 1; i <= Math.min(request.duration, 7); i++) {
      days.push({
        day: i,
        meals: {
          breakfast: {
            time: '07:00',
            items: isVegetarian 
              ? ['Oats with almonds and banana', 'Green tea', 'Mixed nuts (10-12)']
              : ['Scrambled eggs (2)', 'Whole wheat toast', 'Fresh fruit', 'Green tea'],
            calories: 350,
            protein: '15g',
            carbs: '45g',
            fat: '12g',
          },
          midMorning: {
            time: '10:00',
            items: ['Fresh fruit', 'Coconut water'],
            calories: 120,
            protein: '2g',
            carbs: '28g',
            fat: '1g',
          },
          lunch: {
            time: '13:00',
            items: isVegetarian
              ? ['Brown rice (1 cup)', 'Dal (1 bowl)', 'Mixed vegetables', 'Curd', 'Salad']
              : ['Grilled chicken (150g)', 'Brown rice (1 cup)', 'Mixed vegetables', 'Salad'],
            calories: 450,
            protein: '25g',
            carbs: '55g',
            fat: '15g',
          },
          evening: {
            time: '16:00',
            items: ['Herbal tea', 'Roasted chana (handful)'],
            calories: 100,
            protein: '6g',
            carbs: '15g',
            fat: '3g',
          },
          dinner: {
            time: '19:30',
            items: isVegetarian
              ? ['Quinoa (1 cup)', 'Paneer curry', 'Steamed broccoli', 'Cucumber raita']
              : ['Grilled fish (150g)', 'Quinoa (1 cup)', 'Steamed vegetables', 'Cucumber raita'],
            calories: 400,
            protein: '30g',
            carbs: '35g',
            fat: '18g',
          },
        },
        totalCalories: 1420,
        totalProtein: '78g',
        totalCarbs: '178g',
        totalFat: '49g',
        waterIntake: '3-4 liters',
        notes: 'Adjust portions based on hunger and energy levels',
      })
    }

    return {
      title: `${request.category.replace('_', ' ')} Diet Plan`,
      description: `Customized ${request.duration}-day diet plan for ${member.firstName}`,
      duration: request.duration,
      totalCalories: 1420,
      macroSplit: { protein: 22, carbs: 50, fat: 28 },
      days,
      guidelines: [
        'Drink water 30 minutes before meals',
        'Avoid processed foods and sugary drinks',
        'Include seasonal fruits and vegetables',
        'Maintain consistent meal timings',
        'Listen to your body and adjust portions',
      ],
      supplements: isVegetarian 
        ? ['Vitamin B12', 'Iron', 'Omega-3 (algae-based)']
        : ['Whey protein', 'Multivitamin'],
    }
  }

  private static generateMockWorkoutPlan(request: AIGenerationRequest, member: any) {
    const isBeginnerLevel = request.category === 'WEIGHT_LOSS' || member.activityLevel === 'SEDENTARY'
    
    const days = []
    const workoutDays = Math.min(request.duration, 7)
    
    for (let i = 1; i <= workoutDays; i++) {
      const dayType = i % 3 === 1 ? 'strength' : i % 3 === 2 ? 'cardio' : 'flexibility'
      
      days.push({
        day: i,
        type: dayType,
        title: dayType === 'strength' ? 'Strength Training' : 
               dayType === 'cardio' ? 'Cardio & Conditioning' : 'Flexibility & Recovery',
        warmup: {
          duration: 10,
          exercises: [
            'Light jogging in place - 3 minutes',
            'Arm circles - 1 minute each direction',
            'Leg swings - 1 minute each leg',
            'Dynamic stretching - 4 minutes',
          ],
        },
        mainWorkout: dayType === 'strength' ? {
          duration: 45,
          exercises: isBeginnerLevel ? [
            { name: 'Bodyweight squats', sets: 3, reps: '12-15', rest: '60s' },
            { name: 'Push-ups (modified if needed)', sets: 3, reps: '8-12', rest: '60s' },
            { name: 'Plank hold', sets: 3, reps: '30-45s', rest: '60s' },
            { name: 'Lunges', sets: 3, reps: '10 each leg', rest: '60s' },
            { name: 'Glute bridges', sets: 3, reps: '15-20', rest: '60s' },
          ] : [
            { name: 'Goblet squats', sets: 4, reps: '12-15', rest: '90s' },
            { name: 'Push-ups', sets: 4, reps: '12-20', rest: '90s' },
            { name: 'Dumbbell rows', sets: 4, reps: '12-15', rest: '90s' },
            { name: 'Overhead press', sets: 3, reps: '10-12', rest: '90s' },
            { name: 'Deadlifts', sets: 3, reps: '8-10', rest: '120s' },
          ],
        } : dayType === 'cardio' ? {
          duration: 30,
          exercises: [
            { name: 'High-intensity intervals', duration: '20 minutes', intensity: 'Alternate 1 min high, 2 min low' },
            { name: 'Core circuit', duration: '10 minutes', exercises: ['Mountain climbers', 'Bicycle crunches', 'Russian twists'] },
          ],
        } : {
          duration: 30,
          exercises: [
            { name: 'Full body stretching routine', duration: '20 minutes' },
            { name: 'Foam rolling', duration: '10 minutes' },
          ],
        },
        cooldown: {
          duration: 10,
          exercises: [
            'Walking - 3 minutes',
            'Static stretching - 7 minutes',
          ],
        },
        notes: dayType === 'strength' ? 'Focus on proper form over speed' :
               dayType === 'cardio' ? 'Monitor heart rate and stay hydrated' :
               'Hold each stretch for 30-60 seconds',
      })
    }

    return {
      title: `${request.category.replace('_', ' ')} Workout Plan`,
      description: `Customized ${request.duration}-day workout plan for ${member.firstName}`,
      duration: request.duration,
      difficulty: isBeginnerLevel ? 'BEGINNER' : 'INTERMEDIATE',
      daysPerWeek: Math.min(workoutDays, 5),
      estimatedDuration: '60-75 minutes per session',
      days,
      equipment: isBeginnerLevel 
        ? ['Yoga mat', 'Light dumbbells (optional)']
        : ['Dumbbells', 'Resistance bands', 'Yoga mat', 'Foam roller'],
      guidelines: [
        'Start with lighter weights and focus on form',
        'Rest 48 hours between strength training sessions',
        'Stay hydrated throughout the workout',
        'Stop if you feel pain or excessive fatigue',
        'Progress gradually by increasing intensity',
      ],
      progressTracking: [
        'Record weights used for each exercise',
        'Track workout completion time',
        'Note energy levels before/after',
        'Take progress photos weekly',
        'Monitor strength improvements',
      ],
    }
  }

  // Progress Tracking
  static async addProgressPhoto(data: {
    memberPlanId: string
    memberId: string
    imageUrl: string
    caption?: string
    photoType?: string
  }) {
    return await prisma.progressPhoto.create({
      data,
    })
  }

  static async getProgressPhotos(memberPlanId: string) {
    return await prisma.progressPhoto.findMany({
      where: { memberPlanId },
      orderBy: { measurementDate: 'desc' },
    })
  }

  // Reviews and Ratings
  static async addPlanReview(data: {
    templateId: string
    memberId: string
    rating: number
    review?: string
    isAnonymous?: boolean
  }) {
    const result = await prisma.$transaction(async (tx) => {
      // Create review
      const planReview = await tx.planReview.create({
        data,
      })

      // Update template rating
      const reviews = await tx.planReview.findMany({
        where: { templateId: data.templateId },
      })

      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

      await tx.planTemplate.update({
        where: { id: data.templateId },
        data: {
          rating: averageRating,
          reviewCount: reviews.length,
        },
      })

      return planReview
    })

    return result
  }

  // Statistics
  static async getPlanStats(tenantId: string, branchId?: string) {
    const where: any = { tenantId }
    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null },
      ]
    }

    const [
      totalTemplates,
      aiGeneratedTemplates,
      totalMemberPlans,
      activeMemberPlans,
      avgRating,
    ] = await Promise.all([
      prisma.planTemplate.count({ where: { ...where, isActive: true } }),
      prisma.planTemplate.count({ where: { ...where, isActive: true, isAiGenerated: true } }),
      prisma.memberPlan.count({
        where: {
          member: { tenantId },
          ...(branchId && { member: { branchId } }),
        },
      }),
      prisma.memberPlan.count({
        where: {
          member: { tenantId },
          ...(branchId && { member: { branchId } }),
          status: 'ACTIVE',
        },
      }),
      prisma.planTemplate.aggregate({
        where: { ...where, isActive: true },
        _avg: { rating: true },
      }),
    ])

    return {
      totalTemplates,
      aiGeneratedTemplates,
      totalMemberPlans,
      activeMemberPlans,
      averageRating: avgRating._avg.rating || 0,
    }
  }

  // Popular Templates
  static async getPopularTemplates(tenantId: string, branchId?: string, limit = 10) {
    const where: any = {
      tenantId,
      isActive: true,
      visibility: { in: ['PUBLIC', 'BRANCH_ONLY'] },
    }

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null },
      ]
    }

    return await prisma.planTemplate.findMany({
      where,
      include: {
        creator: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            memberPlans: true,
            favorites: true,
          },
        },
      },
      orderBy: [
        { usageCount: 'desc' },
        { rating: 'desc' },
      ],
      take: limit,
    })
  }
}