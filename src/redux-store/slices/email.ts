import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Email, EmailState } from '@/types/apps/emailTypes'

const initialState: EmailState = {
  emails: [],
  filteredEmails: [],
  currentEmailId: undefined
}

export const emailSlice = createSlice({
  name: 'email',
  initialState,
  reducers: {
    // Set all emails
    setEmails: (state, action: PayloadAction<Email[]>) => {
      state.emails = action.payload
      state.filteredEmails = action.payload
    },

    // Filter emails by folder or label
    filterEmails: (state, action: PayloadAction<{ folder?: string; label?: string }>) => {
      const { folder, label } = action.payload

      let filtered = state.emails

      if (folder) {
        filtered = filtered.filter(email => email.folder === folder)
      }

      if (label) {
        filtered = filtered.filter(email => email.labels.includes(label))
      }

      state.filteredEmails = filtered
    },

    // Move emails to a folder
    moveEmailsToFolder: (state, action: PayloadAction<{ emailIds: number[]; folder: string }>) => {
      const { emailIds, folder } = action.payload

      state.emails = state.emails.map(email =>
        emailIds.includes(email.id) ? { ...email, folder } : email
      )

      state.filteredEmails = state.filteredEmails.map(email =>
        emailIds.includes(email.id) ? { ...email, folder } : email
      )
    },

    // Delete trash emails permanently
    deleteTrashEmails: (state, action: PayloadAction<number[]>) => {
      const emailIds = action.payload

      state.emails = state.emails.filter(email => !emailIds.includes(email.id))
      state.filteredEmails = state.filteredEmails.filter(email => !emailIds.includes(email.id))
    },

    // Toggle read status
    toggleReadEmails: (state, action: PayloadAction<{ emailIds: number[]; isRead: boolean }>) => {
      const { emailIds, isRead } = action.payload

      state.emails = state.emails.map(email =>
        emailIds.includes(email.id) ? { ...email, isRead } : email
      )

      state.filteredEmails = state.filteredEmails.map(email =>
        emailIds.includes(email.id) ? { ...email, isRead } : email
      )
    },

    // Toggle star status
    toggleStarEmail: (state, action: PayloadAction<number>) => {
      const emailId = action.payload

      state.emails = state.emails.map(email =>
        email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
      )

      state.filteredEmails = state.filteredEmails.map(email =>
        email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
      )
    },

    // Toggle label
    toggleLabel: (state, action: PayloadAction<{ emailIds: number[]; label: string }>) => {
      const { emailIds, label } = action.payload

      state.emails = state.emails.map(email => {
        if (emailIds.includes(email.id)) {
          const labels = email.labels.includes(label)
            ? email.labels.filter(l => l !== label)
            : [...email.labels, label]
          return { ...email, labels }
        }
        return email
      })

      state.filteredEmails = state.filteredEmails.map(email => {
        if (emailIds.includes(email.id)) {
          const labels = email.labels.includes(label)
            ? email.labels.filter(l => l !== label)
            : [...email.labels, label]
          return { ...email, labels }
        }
        return email
      })
    },

    // Get current email by ID
    getCurrentEmail: (state, action: PayloadAction<number>) => {
      state.currentEmailId = action.payload
    },

    // Navigate between emails
    navigateEmails: (state, action: PayloadAction<'prev' | 'next'>) => {
      if (state.currentEmailId === undefined) return

      const currentIndex = state.filteredEmails.findIndex(email => email.id === state.currentEmailId)

      if (currentIndex === -1) return

      if (action.payload === 'next' && currentIndex < state.filteredEmails.length - 1) {
        state.currentEmailId = state.filteredEmails[currentIndex + 1].id
      } else if (action.payload === 'prev' && currentIndex > 0) {
        state.currentEmailId = state.filteredEmails[currentIndex - 1].id
      }
    }
  }
})

export const {
  setEmails,
  filterEmails,
  moveEmailsToFolder,
  deleteTrashEmails,
  toggleReadEmails,
  toggleStarEmail,
  toggleLabel,
  getCurrentEmail,
  navigateEmails
} = emailSlice.actions

export default emailSlice.reducer
