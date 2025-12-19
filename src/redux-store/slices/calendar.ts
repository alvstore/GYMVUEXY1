import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { EventInput } from '@fullcalendar/core'
import type { CalendarType, CalendarFiltersType } from '@/types/apps/calendarTypes'

const initialState: CalendarType = {
  events: [],
  filteredEvents: [],
  selectedEvent: null,
  selectedCalendars: ['Personal', 'Business', 'Family', 'Holiday', 'ETC']
}

export const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    addEvent: (state, action: PayloadAction<EventInput>) => {
      state.events.push(action.payload)
      state.filteredEvents.push(action.payload)
    },
    updateEvent: (state, action: PayloadAction<EventInput>) => {
      const eventIndex = state.events.findIndex(event => event.id === action.payload.id)
      if (eventIndex !== -1) {
        state.events[eventIndex] = action.payload
      }
      const filteredEventIndex = state.filteredEvents.findIndex(event => event.id === action.payload.id)
      if (filteredEventIndex !== -1) {
        state.filteredEvents[filteredEventIndex] = action.payload
      }
    },
    deleteEvent: (state, action: PayloadAction<string | number>) => {
      state.events = state.events.filter(event => event.id !== action.payload)
      state.filteredEvents = state.filteredEvents.filter(event => event.id !== action.payload)
    },
    selectedEvent: (state, action: PayloadAction<EventInput | null>) => {
      state.selectedEvent = action.payload
    },
    filterEvents: (state, action: PayloadAction<CalendarFiltersType[]>) => {
      state.selectedCalendars = action.payload
      if (action.payload.length === 0) {
        state.filteredEvents = []
      } else {
        state.filteredEvents = state.events.filter(event =>
          action.payload.includes(event.extendedProps?.calendar as CalendarFiltersType)
        )
      }
    },
    setEvents: (state, action: PayloadAction<EventInput[]>) => {
      state.events = action.payload
      state.filteredEvents = action.payload.filter(event =>
        state.selectedCalendars.includes(event.extendedProps?.calendar as CalendarFiltersType)
      )
    }
  }
})

export const {
  addEvent,
  updateEvent,
  deleteEvent,
  selectedEvent,
  filterEvents,
  setEvents
} = calendarSlice.actions

export default calendarSlice.reducer
