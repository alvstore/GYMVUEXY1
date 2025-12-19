// Component Imports
import ChatWrapper from '@views/apps/chat'
import { requirePermission } from '@/libs/serverAuth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chat',
  description: 'Send and receive messages',
}

const ChatApp = async () => {
  // Require permission to access chat
  await requirePermission('communications.view')

  return <ChatWrapper />
}

export default ChatApp
