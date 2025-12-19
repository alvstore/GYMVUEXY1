'use server'

import { prisma } from '@/libs/prisma'
import { requirePermission } from '@/libs/serverAuth'
import { AuditLogger } from '@/libs/auditLogger'

// Get user's conversations
export async function getUserConversations() {
  const context = await requirePermission('chat.view')

  const conversations = await prisma.chatConversation.findMany({
    where: {
      tenantId: context.tenantId,
      participants: {
        some: {
          userId: context.userId,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  })

  // Calculate unread message count for each conversation
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const participant = conv.participants.find(p => p.userId === context.userId)
      
      const unreadCount = await prisma.chatMessage.count({
        where: {
          conversationId: conv.id,
          senderId: {
            not: context.userId,
          },
          createdAt: {
            gt: participant?.lastReadAt || new Date(0),
          },
        },
      })

      return {
        ...conv,
        unreadCount,
      }
    })
  )

  return conversationsWithUnread
}

// Get conversation by ID with messages
export async function getConversationById(conversationId: string, limit = 50) {
  const context = await requirePermission('chat.view')

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      participants: {
        some: {
          userId: context.userId,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
  })

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  // Update last read timestamp
  await prisma.chatParticipant.updateMany({
    where: {
      conversationId,
      userId: context.userId,
    },
    data: {
      lastReadAt: new Date(),
    },
  })

  return conversation
}

// Create or get existing conversation
export async function createOrGetConversation(participantIds: string[], isGroupChat = false, groupName?: string) {
  const context = await requirePermission('chat.send')

  // Add current user to participants if not included
  if (!participantIds.includes(context.userId)) {
    participantIds.push(context.userId)
  }

  // For 1-on-1 chats, check if conversation already exists
  if (!isGroupChat && participantIds.length === 2) {
    const existingConversation = await prisma.chatConversation.findFirst({
      where: {
        isGroupChat: false,
        participants: {
          every: {
            userId: {
              in: participantIds,
            },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    if (existingConversation) {
      return existingConversation
    }
  }

  // Create new conversation
  const conversation = await prisma.chatConversation.create({
    data: {
      tenantId: context.tenantId,
      branchId: context.branchId,
      isGroupChat,
      groupName,
      participants: {
        create: participantIds.map(userId => ({
          userId,
        })),
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: context.branchId,
    action: 'Chat.conversation_created',
    resource: 'ChatConversation',
    resourceId: conversation.id,
    newValues: { isGroupChat, participantCount: participantIds.length },
  })

  return conversation
}

// Send message
export async function sendMessage(conversationId: string, message: string, attachmentUrl?: string) {
  const context = await requirePermission('chat.send')

  // Verify user is participant
  const participant = await prisma.chatParticipant.findFirst({
    where: {
      conversationId,
      userId: context.userId,
    },
  })

  if (!participant) {
    throw new Error('You are not a participant in this conversation')
  }

  const chatMessage = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId: context.userId,
      message,
      attachmentUrl,
      isSent: true,
      isDelivered: true,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })

  // Update conversation's last message timestamp
  await prisma.chatConversation.update({
    where: {
      id: conversationId,
    },
    data: {
      lastMessageAt: new Date(),
    },
  })

  return chatMessage
}

// Mark messages as read
export async function markMessagesAsRead(conversationId: string) {
  const context = await requirePermission('chat.view')

  await prisma.chatMessage.updateMany({
    where: {
      conversationId,
      senderId: {
        not: context.userId,
      },
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })

  // Update participant's last read timestamp
  await prisma.chatParticipant.updateMany({
    where: {
      conversationId,
      userId: context.userId,
    },
    data: {
      lastReadAt: new Date(),
    },
  })

  return { success: true }
}

// Add participants to group chat
export async function addParticipants(conversationId: string, userIds: string[]) {
  const context = await requirePermission('chat.manage')

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      isGroupChat: true,
      participants: {
        some: {
          userId: context.userId,
        },
      },
    },
  })

  if (!conversation) {
    throw new Error('Conversation not found or not a group chat')
  }

  // Add new participants
  await prisma.chatParticipant.createMany({
    data: userIds.map(userId => ({
      conversationId,
      userId,
    })),
    skipDuplicates: true,
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: context.branchId,
    action: 'Chat.participants_added',
    resource: 'ChatConversation',
    resourceId: conversationId,
    newValues: { addedUserIds: userIds },
  })

  return { success: true }
}

// Remove participant from group chat
export async function removeParticipant(conversationId: string, userId: string) {
  const context = await requirePermission('chat.manage')

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      isGroupChat: true,
      participants: {
        some: {
          userId: context.userId,
        },
      },
    },
  })

  if (!conversation) {
    throw new Error('Conversation not found or not a group chat')
  }

  await prisma.chatParticipant.deleteMany({
    where: {
      conversationId,
      userId,
    },
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: context.branchId,
    action: 'Chat.participant_removed',
    resource: 'ChatConversation',
    resourceId: conversationId,
    newValues: { removedUserId: userId },
  })

  return { success: true }
}

// Update group chat details
export async function updateGroupChat(conversationId: string, data: { groupName?: string; groupAvatar?: string }) {
  const context = await requirePermission('chat.manage')

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      isGroupChat: true,
      participants: {
        some: {
          userId: context.userId,
        },
      },
    },
  })

  if (!conversation) {
    throw new Error('Conversation not found or not a group chat')
  }

  const updated = await prisma.chatConversation.update({
    where: {
      id: conversationId,
    },
    data,
  })

  await AuditLogger.log({
    userId: context.userId,
    tenantId: context.tenantId,
    branchId: context.branchId,
    action: 'Chat.group_updated',
    resource: 'ChatConversation',
    resourceId: conversationId,
    newValues: data,
  })

  return updated
}
