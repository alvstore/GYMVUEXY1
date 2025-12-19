import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ChatDataType, ContactType, ChatType, UserChatType } from '@/types/apps/chatTypes'

const initialState: ChatDataType = {
  profileUser: {
    id: 0,
    role: '',
    about: '',
    avatar: '',
    fullName: '',
    status: 'offline',
    settings: {
      isNotificationsOn: false,
      isTwoStepAuthVerificationEnabled: false
    }
  },
  contacts: [],
  chats: [],
  activeUser: undefined
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setProfileUser: (state, action: PayloadAction<ChatDataType['profileUser']>) => {
      state.profileUser = action.payload
    },
    setContacts: (state, action: PayloadAction<ContactType[]>) => {
      state.contacts = action.payload
    },
    setChats: (state, action: PayloadAction<ChatType[]>) => {
      state.chats = action.payload
    },
    getActiveUserData: (state, action: PayloadAction<number>) => {
      const activeUser = state.contacts.find(contact => contact.id === action.payload)
      state.activeUser = activeUser
    },
    sendMessage: (state, action: PayloadAction<{ userId: number; message: UserChatType }>) => {
      const chat = state.chats.find(c => c.userId === action.payload.userId)
      if (chat) {
        chat.chat.push(action.payload.message)
      } else {
        state.chats.push({
          id: state.chats.length + 1,
          userId: action.payload.userId,
          unseenMsgs: 0,
          chat: [action.payload.message]
        })
      }
    },
    markAsRead: (state, action: PayloadAction<number>) => {
      const chat = state.chats.find(c => c.userId === action.payload)
      if (chat) {
        chat.unseenMsgs = 0
      }
    },
    resetActiveUser: (state) => {
      state.activeUser = undefined
    }
  }
})

export const {
  setProfileUser,
  setContacts,
  setChats,
  getActiveUserData,
  sendMessage,
  markAsRead,
  resetActiveUser
} = chatSlice.actions

export default chatSlice.reducer
