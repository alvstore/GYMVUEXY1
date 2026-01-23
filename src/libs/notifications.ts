'use server'

import { prisma } from '@/libs/prisma'

type NotificationContext = {
  tenantId: string
  branchId: string
  memberId?: string
  userId?: string
}

type EmailParams = {
  toEmail: string
  subject: string
  content: string
  htmlContent?: string
  templateId?: string
}

type SmsParams = {
  toPhone: string
  content: string
  templateId?: string
}

type WhatsAppParams = {
  toPhone: string
  content: string
  messageType?: string
  mediaUrl?: string
  templateId?: string
}

export async function sendEmail(
  context: NotificationContext,
  params: EmailParams
): Promise<{ success: boolean; logId: string }> {
  const log = await prisma.emailLog.create({
    data: {
      tenantId: context.tenantId,
      branchId: context.branchId,
      memberId: context.memberId,
      userId: context.userId,
      templateId: params.templateId,
      toEmail: params.toEmail,
      fromEmail: `noreply@incline.gym`,
      subject: params.subject,
      content: params.content,
      htmlContent: params.htmlContent,
      status: 'PENDING',
    },
  })

  try {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { 
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    return { success: true, logId: log.id }
  } catch (error: any) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { 
        status: 'FAILED',
        errorMessage: error.message,
      },
    })
    return { success: false, logId: log.id }
  }
}

export async function sendSms(
  context: NotificationContext,
  params: SmsParams
): Promise<{ success: boolean; logId: string }> {
  const log = await prisma.smsLog.create({
    data: {
      tenantId: context.tenantId,
      branchId: context.branchId,
      memberId: context.memberId,
      userId: context.userId,
      templateId: params.templateId,
      toPhone: params.toPhone,
      content: params.content,
      status: 'PENDING',
    },
  })

  try {
    await prisma.smsLog.update({
      where: { id: log.id },
      data: { 
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    return { success: true, logId: log.id }
  } catch (error: any) {
    await prisma.smsLog.update({
      where: { id: log.id },
      data: { 
        status: 'FAILED',
        errorMessage: error.message,
      },
    })
    return { success: false, logId: log.id }
  }
}

export async function sendWhatsApp(
  context: NotificationContext,
  params: WhatsAppParams
): Promise<{ success: boolean; logId: string }> {
  const log = await prisma.whatsAppLog.create({
    data: {
      tenantId: context.tenantId,
      branchId: context.branchId,
      memberId: context.memberId,
      userId: context.userId,
      templateId: params.templateId,
      toPhone: params.toPhone,
      fromPhone: '+919999999999',
      content: params.content,
      messageType: params.messageType || 'text',
      mediaUrl: params.mediaUrl,
      status: 'PENDING',
    },
  })

  try {
    await prisma.whatsAppLog.update({
      where: { id: log.id },
      data: { 
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    return { success: true, logId: log.id }
  } catch (error: any) {
    await prisma.whatsAppLog.update({
      where: { id: log.id },
      data: { 
        status: 'FAILED',
        errorMessage: error.message,
      },
    })
    return { success: false, logId: log.id }
  }
}

export async function sendPaymentConfirmation(
  context: NotificationContext,
  params: {
    memberName: string
    memberEmail?: string
    memberPhone: string
    invoiceNumber: string
    amount: number
    planName: string
    validUntil: Date
    channels?: ('email' | 'sms' | 'whatsapp')[]
  }
): Promise<{ emailSent: boolean; smsSent: boolean; whatsappSent: boolean }> {
  const channels = params.channels || ['email', 'sms', 'whatsapp']
  const results = { emailSent: false, smsSent: false, whatsappSent: false }

  const formattedDate = params.validUntil.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  if (channels.includes('email') && params.memberEmail) {
    const emailContent = `
Dear ${params.memberName},

Thank you for your payment!

Payment Details:
- Invoice: ${params.invoiceNumber}
- Amount: ₹${params.amount.toFixed(2)}
- Plan: ${params.planName}
- Valid Until: ${formattedDate}

Your membership is now active. Visit the gym anytime during operating hours.

Thank you for choosing Incline Gym!

Best regards,
Incline Gym Team
    `.trim()

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #7367F0; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .amount { font-size: 24px; color: #7367F0; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Confirmed!</h1>
    </div>
    <div class="content">
      <p>Dear ${params.memberName},</p>
      <p>Thank you for your payment! Your membership is now active.</p>
      <div class="details">
        <div class="detail-row"><span>Invoice</span><span>${params.invoiceNumber}</span></div>
        <div class="detail-row"><span>Amount Paid</span><span class="amount">₹${params.amount.toFixed(2)}</span></div>
        <div class="detail-row"><span>Plan</span><span>${params.planName}</span></div>
        <div class="detail-row"><span>Valid Until</span><span>${formattedDate}</span></div>
      </div>
      <p>Visit the gym anytime during operating hours. We look forward to seeing you!</p>
      <div class="footer">
        <p>Thank you for choosing Incline Gym!</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim()

    const result = await sendEmail(context, {
      toEmail: params.memberEmail,
      subject: `Payment Confirmed - ${params.invoiceNumber}`,
      content: emailContent,
      htmlContent,
    })
    results.emailSent = result.success
  }

  if (channels.includes('sms')) {
    const smsContent = `Incline Gym: Payment of ₹${params.amount.toFixed(2)} received. Invoice: ${params.invoiceNumber}. Plan: ${params.planName} valid until ${formattedDate}. Thank you!`
    
    const result = await sendSms(context, {
      toPhone: params.memberPhone,
      content: smsContent,
    })
    results.smsSent = result.success
  }

  if (channels.includes('whatsapp')) {
    const waContent = `✅ *Payment Confirmed!*

Thank you for your payment, ${params.memberName}!

📋 *Invoice:* ${params.invoiceNumber}
💰 *Amount:* ₹${params.amount.toFixed(2)}
🏋️ *Plan:* ${params.planName}
📅 *Valid Until:* ${formattedDate}

Your membership is now active. See you at the gym! 💪

_Incline Gym Team_`

    const result = await sendWhatsApp(context, {
      toPhone: params.memberPhone,
      content: waContent,
    })
    results.whatsappSent = result.success
  }

  return results
}

export async function sendMembershipRenewalReminder(
  context: NotificationContext,
  params: {
    memberName: string
    memberEmail?: string
    memberPhone: string
    planName: string
    expiryDate: Date
    daysRemaining: number
    channels?: ('email' | 'sms' | 'whatsapp')[]
  }
): Promise<{ emailSent: boolean; smsSent: boolean; whatsappSent: boolean }> {
  const channels = params.channels || ['email', 'sms', 'whatsapp']
  const results = { emailSent: false, smsSent: false, whatsappSent: false }

  const formattedDate = params.expiryDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  if (channels.includes('email') && params.memberEmail) {
    const emailContent = `
Dear ${params.memberName},

Your ${params.planName} membership is expiring in ${params.daysRemaining} days (${formattedDate}).

Renew now to continue enjoying uninterrupted access to all gym facilities!

Visit the gym or renew online to continue your fitness journey.

Best regards,
Incline Gym Team
    `.trim()

    const result = await sendEmail(context, {
      toEmail: params.memberEmail,
      subject: `Membership Renewal Reminder - ${params.daysRemaining} days left`,
      content: emailContent,
    })
    results.emailSent = result.success
  }

  if (channels.includes('sms')) {
    const smsContent = `Incline Gym: Your ${params.planName} membership expires on ${formattedDate} (${params.daysRemaining} days). Renew now!`
    
    const result = await sendSms(context, {
      toPhone: params.memberPhone,
      content: smsContent,
    })
    results.smsSent = result.success
  }

  if (channels.includes('whatsapp')) {
    const waContent = `⏰ *Renewal Reminder*

Hi ${params.memberName}!

Your *${params.planName}* membership expires in *${params.daysRemaining} days* (${formattedDate}).

Renew now to keep your fitness momentum going! 💪

Visit the gym or reply to renew online.

_Incline Gym Team_`

    const result = await sendWhatsApp(context, {
      toPhone: params.memberPhone,
      content: waContent,
    })
    results.whatsappSent = result.success
  }

  return results
}
