import { startOfMonth, endOfMonth } from 'date-fns'
import { getCalendarData } from '@/actions/calendar/get-calendar-data'
import { getGoogleCalendarStatus } from '@/actions/calendar/google-calendar'
import { CalendarClient } from './calendar-client'

export const metadata = { title: '캘린더' }

export default async function CalendarPage() {
  const now = new Date()
  const from = startOfMonth(now)
  const to = endOfMonth(now)

  const [calendarResult, googleStatus] = await Promise.all([
    getCalendarData(from, to),
    getGoogleCalendarStatus(),
  ])

  const initialData = calendarResult.success && calendarResult.data
    ? calendarResult.data
    : { days: {}, unfedAnimals: [] }

  return (
    <CalendarClient
      initialData={initialData}
      googleConnected={googleStatus.connected}
    />
  )
}
