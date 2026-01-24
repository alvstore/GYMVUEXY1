'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions } from '@fullcalendar/core'
import 'bootstrap-icons/font/bootstrap-icons.css'

interface FacilityCalendarProps {
  bookings: any[]
  calendarApi: any
  setCalendarApi: (val: any) => void
  handleLeftSidebarToggle: () => void
  onBookingClick: (booking: any) => void
  facilityColors: Record<string, string>
}

const FacilityCalendar = (props: FacilityCalendarProps) => {
  const { bookings, calendarApi, setCalendarApi, handleLeftSidebarToggle, onBookingClick, facilityColors } = props

  const calendarRef = useRef<any>()
  const theme = useTheme()

  useEffect(() => {
    if (calendarRef.current) {
      setCalendarApi(calendarRef.current.getApi())
    }
  }, [setCalendarApi])

  const calendarEvents = bookings.map(booking => ({
    id: booking.id,
    title: booking.title,
    start: booking.start,
    end: booking.end,
    backgroundColor: facilityColors[booking.facilityType] || '#95A5A6',
    borderColor: facilityColors[booking.facilityType] || '#95A5A6',
    extendedProps: {
      ...booking.extendedProps,
      facilityId: booking.facilityId,
      facilityName: booking.facilityName,
      facilityType: booking.facilityType,
      memberId: booking.memberId,
      memberName: booking.memberName,
      memberPhone: booking.memberPhone,
      status: booking.status,
    },
  }))

  const calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      start: 'sidebarToggle, prev, next, title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    },
    events: calendarEvents,
    editable: false,
    eventResizableFromStart: false,
    dragScroll: false,
    dayMaxEvents: 3,
    navLinks: true,
    eventClassNames({ event }) {
      const status = event.extendedProps.status
      return status === 'ATTENDED' ? ['event-attended'] : status === 'NO_SHOW' ? ['event-no-show'] : []
    },
    eventClick({ event }) {
      onBookingClick({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        ...event.extendedProps,
      })
    },
    customButtons: {
      sidebarToggle: {
        icon: 'bi bi-list',
        click() {
          handleLeftSidebarToggle()
        },
      },
    },
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    allDaySlot: false,
    slotDuration: '00:15:00',
    slotLabelInterval: '01:00:00',
    height: 'auto',
    nowIndicator: true,
    direction: theme.direction,
    rerenderDelay: 10,
  }

  return <FullCalendar {...calendarOptions} ref={calendarRef} />
}

export default FacilityCalendar
