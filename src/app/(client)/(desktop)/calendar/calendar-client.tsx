'use client'

import { CalendarView } from '@/components/calendar/calendar-view'
import { getCalendarData, CalendarDataResult } from '@/actions/calendar/get-calendar-data'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface CalendarClientProps {
  initialData: CalendarDataResult
  googleConnected: boolean
}

export function CalendarClient({ initialData, googleConnected }: CalendarClientProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const google = searchParams.get('google')
    if (google === 'connected') toast.success('Google Calendar가 연동됐어요.')
    if (google === 'error') toast.error('Google Calendar 연동 중 오류가 발생했어요.')
  }, [searchParams])

  const handleRangeChange = async (from: Date, to: Date): Promise<CalendarDataResult> => {
    const result = await getCalendarData(from, to)
    return result.success && result.data ? result.data : { days: {}, unfedAnimals: [] }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <CalendarView
        initialData={initialData}
        googleConnected={googleConnected}
        onRangeChange={handleRangeChange}
      />
    </div>
  )
}
