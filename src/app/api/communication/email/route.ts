import { NextRequest, NextResponse } from 'next/server'
import { getUserEmails, getEmailById, sendEmail, deleteEmail, toggleEmailStar, toggleEmailRead } from '@/app/actions/communication/email'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const emailId = searchParams.get('id')

    if (emailId) {
      const email = await getEmailById(emailId)
      return NextResponse.json(email)
    }

    const folder = searchParams.get('folder')
    const search = searchParams.get('search')

    const emails = await getUserEmails({
      folder: folder || undefined,
      search: search || undefined
    })

    return NextResponse.json({ emails, total: emails.length })
  } catch (error) {
    console.error('Email GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (data.action === 'send') {
      const result = await sendEmail({
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        message: data.message,
        attachments: data.attachments,
        replyToId: data.replyToId
      })
      return NextResponse.json(result)
    }

    if (data.action === 'toggle-star') {
      const result = await toggleEmailStar(data.emailId)
      return NextResponse.json(result)
    }

    if (data.action === 'toggle-read') {
      const result = await toggleEmailRead(data.emailId)
      return NextResponse.json(result)
    }

    if (data.action === 'delete') {
      const result = await deleteEmail(data.emailId)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Email POST error:', error)
    return NextResponse.json({ error: 'Failed to process email action' }, { status: 500 })
  }
}
