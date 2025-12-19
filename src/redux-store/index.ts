// Third-party Imports
import { configureStore, createSlice } from '@reduxjs/toolkit'

// Slice Imports
import kanbanReducer from './slices/kanban'
import calendarReducer from './slices/calendar'
import chatReducer from './slices/chat'
import emailReducer from './slices/email'

// Placeholder slice to prevent empty reducer error
const appSlice = createSlice({
  name: 'app',
  initialState: {},
  reducers: {}
})

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    kanban: kanbanReducer,
    calendarReducer,
    chatReducer,
    emailReducer
    // Gym-specific reducers will be added here as needed
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
