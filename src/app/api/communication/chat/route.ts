import { NextRequest, NextResponse } from 'next/server'
import { getUserConversations, getConversationById, sendMessage, markMessagesAsRead, createOrGetConversation } from '@/app/actions/communication/chat'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const conversationId = searchParams.get('id')

    if (conversationId) {
      const limit = parseInt(searchParams.get('limit') || '50')
      const conversation = await getConversationById(conversationId, limit)
      return NextResponse.json(conversation)
    }

    const conversations = await getUserConversations()
    return NextResponse.json({ conversations, total: conversations.length })
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (data.action === 'send-message') {
      const result = await sendMessage(data.conversationId, data.message, data.attachmentUrl)
      return NextResponse.json(result)
    }

    if (data.action === 'mark-read') {
      const result = await markMessagesAsRead(data.conversationId)
      return NextResponse.json(result)
    }

    if (data.action === 'create-conversation') {
      const result = await createOrGetConversation(
        data.participantIds,
        data.isGroupChat,
        data.groupName
      )
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json({ error: 'Failed to process chat action' }, { status: 500 })
  }
}
