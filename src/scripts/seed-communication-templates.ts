import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCommunicationTemplates() {
  console.log('🌱 Seeding communication templates...')

  // Get the first tenant and branch for seeding
  const tenant = await prisma.tenant.findFirst()
  const branch = await prisma.branch.findFirst()

  if (!tenant || !branch) {
    console.log('❌ No tenant or branch found. Please run the main seed script first.')
    return
  }

  // Email Templates
  const emailTemplates = [
    {
      tenantId: tenant.id,
      branchId: null, // Tenant-wide template
      name: 'Welcome Email',
      description: 'Welcome new members to the gym',
      templateType: 'EMAIL',
      category: 'WELCOME',
      subject: 'Welcome to {{gym_name}}, {{member_name}}! 🏋️‍♂️',
      content: `Dear {{member_name}},

Welcome to {{gym_name}}! We are thrilled to have you as part of our fitness family.

Your membership details:
• Plan: {{membership_plan}}
• Start Date: {{start_date}}
• Expiry Date: {{expiry_date}}
• Branch: {{branch_name}}

What's next?
1. Download our mobile app for easy access
2. Book your complimentary fitness assessment
3. Join our WhatsApp group for updates
4. Follow us on social media for tips and motivation

Our team is here to support you on your fitness journey. Feel free to reach out if you have any questions!

Stay strong,
{{gym_name}} Team

---
{{gym_name}}
{{branch_address}}
Phone: {{branch_phone}}
Email: {{branch_email}}`,
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #FFD600, #FFC107); padding: 30px; text-align: center;">
    <h1 style="color: #000; margin: 0;">Welcome to {{gym_name}}! 🏋️‍♂️</h1>
  </div>
  
  <div style="padding: 30px; background: #fff;">
    <p style="font-size: 16px; color: #333;">Dear <strong>{{member_name}}</strong>,</p>
    
    <p style="font-size: 16px; color: #333;">We are thrilled to have you as part of our fitness family!</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Your Membership Details:</h3>
      <ul style="color: #666; line-height: 1.6;">
        <li><strong>Plan:</strong> {{membership_plan}}</li>
        <li><strong>Start Date:</strong> {{start_date}}</li>
        <li><strong>Expiry Date:</strong> {{expiry_date}}</li>
        <li><strong>Branch:</strong> {{branch_name}}</li>
      </ul>
    </div>
    
    <h3 style="color: #333;">What's next?</h3>
    <ol style="color: #666; line-height: 1.8;">
      <li>Download our mobile app for easy access</li>
      <li>Book your complimentary fitness assessment</li>
      <li>Join our WhatsApp group for updates</li>
      <li>Follow us on social media for tips and motivation</li>
    </ol>
    
    <p style="font-size: 16px; color: #333;">Our team is here to support you on your fitness journey. Feel free to reach out if you have any questions!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="font-size: 18px; color: #FFD600; font-weight: bold;">Stay Strong! 💪</p>
    </div>
  </div>
  
  <div style="background: #333; color: #fff; padding: 20px; text-align: center;">
    <p style="margin: 0; font-weight: bold;">{{gym_name}}</p>
    <p style="margin: 5px 0; font-size: 14px;">{{branch_address}}</p>
    <p style="margin: 5px 0; font-size: 14px;">Phone: {{branch_phone}} | Email: {{branch_email}}</p>
  </div>
</div>`,
      placeholders: ['member_name', 'gym_name', 'membership_plan', 'start_date', 'expiry_date', 'branch_name', 'branch_address', 'branch_phone', 'branch_email'],
      isSystem: true,
    },
    {
      tenantId: tenant.id,
      branchId: null,
      name: 'Membership Expiry Reminder',
      description: 'Remind members about upcoming membership expiry',
      templateType: 'EMAIL',
      category: 'MEMBERSHIP_EXPIRY',
      subject: 'Your {{gym_name}} membership expires in {{days_remaining}} days',
      content: `Dear {{member_name}},

This is a friendly reminder that your membership at {{gym_name}} will expire on {{expiry_date}} ({{days_remaining}} days from now).

Current Plan: {{membership_plan}}
Branch: {{branch_name}}

Don't let your fitness journey stop! Renew your membership today to continue enjoying:
✓ Access to all gym equipment
✓ Group fitness classes
✓ Personal training sessions
✓ Locker facilities
✓ Nutrition guidance

Renew now and get:
🎯 10% discount on annual plans
🎯 Free fitness assessment
🎯 Complimentary diet consultation

Contact us or visit the gym to renew your membership.

Stay fit,
{{gym_name}} Team`,
      placeholders: ['member_name', 'gym_name', 'expiry_date', 'days_remaining', 'membership_plan', 'branch_name'],
      isSystem: true,
    },
    {
      tenantId: tenant.id,
      branchId: null,
      name: 'Payment Receipt',
      description: 'Payment confirmation email',
      templateType: 'EMAIL',
      category: 'PAYMENT_RECEIPT',
      subject: 'Payment Receipt - {{receipt_number}}',
      content: `Dear {{member_name}},

Thank you for your payment! Here are your payment details:

Receipt Number: {{receipt_number}}
Amount Paid: ₹{{amount}}
Payment Method: {{payment_method}}
Date: {{payment_date}}
For: {{description}}

Your membership is now active until {{expiry_date}}.

If you have any questions about this payment, please contact us.

Best regards,
{{gym_name}} Team`,
      placeholders: ['member_name', 'receipt_number', 'amount', 'payment_method', 'payment_date', 'description', 'expiry_date', 'gym_name'],
      isSystem: true,
    },
  ]

  // SMS Templates
  const smsTemplates = [
    {
      tenantId: tenant.id,
      branchId: null,
      name: 'Payment Receipt SMS',
      description: 'Quick payment confirmation via SMS',
      templateType: 'SMS',
      category: 'PAYMENT_RECEIPT',
      content: 'Dear {{member_name}}, your payment of Rs.{{amount}} for {{gym_name}} has been received. Receipt: {{receipt_number}}. Thank you!',
      placeholders: ['member_name', 'amount', 'gym_name', 'receipt_number'],
      isSystem: true,
    },
    {
      tenantId: tenant.id,
      branchId: null,
      name: 'Membership Expiry SMS',
      description: 'SMS reminder for membership expiry',
      templateType: 'SMS',
      category: 'MEMBERSHIP_EXPIRY',
      content: 'Hi {{member_name}}! Your {{gym_name}} membership expires on {{expiry_date}}. Renew now to avoid interruption. Call {{branch_phone}} or visit us.',
      placeholders: ['member_name', 'gym_name', 'expiry_date', 'branch_phone'],
      isSystem: true,
    },
    {
      tenantId: tenant.id,
      branchId: null,
      name: 'Birthday Wish SMS',
      description: 'Birthday wishes for members',
      templateType: 'SMS',
      category: 'BIRTHDAY_WISH',
      content: '🎉 Happy Birthday {{member_name}}! Wishing you a year full of fitness achievements. Enjoy a special birthday workout at {{gym_name}}! 🎂💪',
      placeholders: ['member_name', 'gym_name'],
      isSystem: true,
    },
  ]

  // WhatsApp Templates
  const whatsappTemplates = [
    {
      tenantId: tenant.id,
      branchId: null,
      name: 'Membership Expiry WhatsApp',
      description: 'WhatsApp reminder for membership expiry',
      templateType: 'WHATSAPP',
      category: 'MEMBERSHIP_EXPIRY',
      content: `🏋️ Hi {{member_name}}!

Your membership at {{gym_name}} expires on {{expiry_date}} ({{days_remaining}} days remaining).

💪 Don't break your fitness streak!

Renew now and get:
🎯 10% discount on annual plans
🎯 Free fitness assessment
🎯 Complimentary diet consultation

Visit us or call {{branch_phone}} to renew.

Stay strong! 💪`,
      placeholders: ['member_name', 'gym_name', 'expiry_date', 'days_remaining', 'branch_phone'],
      isSystem: true,
    },
    {
      tenantId: tenant.id,
      branchId: null,
      name: 'Trainer Assignment WhatsApp',
      description: 'Notify member about trainer assignment',
      templateType: 'WHATSAPP',
      category: 'TRAINER_ASSIGNMENT',
      content: `🎯 Great news {{member_name}}!

Your personal trainer {{trainer_name}} has been assigned for your {{session_type}} sessions.

📅 Sessions: {{total_sessions}}
💰 Rate: ₹{{rate}} per session
📍 Branch: {{branch_name}}

Your trainer will contact you soon to schedule your first session.

Let's achieve your fitness goals together! 💪`,
      placeholders: ['member_name', 'trainer_name', 'session_type', 'total_sessions', 'rate', 'branch_name'],
      isSystem: true,
    },
  ]

  // Create email templates
  for (const template of emailTemplates) {
    await prisma.communicationTemplate.upsert({
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

  // Create SMS templates
  for (const template of smsTemplates) {
    await prisma.communicationTemplate.upsert({
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

  // Create WhatsApp templates
  for (const template of whatsappTemplates) {
    await prisma.communicationTemplate.upsert({
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

  console.log('✅ Communication templates seeded successfully!')
}

seedCommunicationTemplates()
  .catch((e) => {
    console.error('❌ Seeding communication templates failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })