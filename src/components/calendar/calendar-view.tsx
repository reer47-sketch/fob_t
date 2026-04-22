'use client'

import { useState, useCallback, useTransition } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, addWeeks, subWeeks,
  isSameMonth, isToday, isSameDay, parseISO,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, RefreshCw, AlertTriangle, Link2, Link2Off, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { EventChip, EventType } from './calendar-event-chip'
import { DayDetailPanel } from './day-detail-panel'
import { TaskDialog } from './task-dialog'
import { CalendarDataResult } from '@/actions/calendar/get-calendar-data'
import { syncToGoogleCalendar, disconnectGoogleCalendar } from '@/actions/calendar/google-calendar'
import { toast } from 'sonner'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

type ViewMode = 'month' | 'week'

interface CalendarViewProps {
  initialData: CalendarDataResult
  googleConnected: boolean
  onRangeChange: (from: Date, to: Date) => Promise<CalendarDataResult>
}

export function CalendarView({ initialData, googleConnected, onRangeChange }: CalendarViewProps) {
  const [view, setView] = useState<ViewMode>('month')
  const [current, setCurrent] = useState(new Date())
  const [data, setData] = useState<CalendarDataResult>(initialData)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskDefaultDate, setTaskDefaultDate] = useState<string | undefined>()
  const [isConnected, setIsConnected] = useState(googleConnected)
  const [isPending, startTransition] = useTransition()

  const getRange = useCallback((base: Date, v: ViewMode) => {
    if (v === 'month') return { from: startOfMonth(base), to: endOfMonth(base) }
    const weekStart = startOfWeek(base, { weekStartsOn: 0 })
    return { from: weekStart, to: endOfWeek(base, { weekStartsOn: 0 }) }
  }, [])

  const navigate = (dir: 1 | -1) => {
    const next = view === 'month'
      ? (dir === 1 ? addMonths(current, 1) : subMonths(current, 1))
      : (dir === 1 ? addWeeks(current, 1) : subWeeks(current, 1))
    setCurrent(next)
    const { from, to } = getRange(next, view)
    startTransition(async () => {
      const result = await onRangeChange(from, to)
      setData(result)
    })
  }

  const handleViewChange = (v: string) => {
    const newView = v as ViewMode
    setView(newView)
    const { from, to } = getRange(current, newView)
    startTransition(async () => {
      const result = await onRangeChange(from, to)
      setData(result)
    })
  }

  const refresh = () => {
    const { from, to } = getRange(current, view)
    startTransition(async () => {
      const result = await onRangeChange(from, to)
      setData(result)
    })
  }

  const handleGoogleSync = async () => {
    const { from, to } = getRange(current, view)
    const result = await syncToGoogleCalendar({ from, to })
    if (result.success) toast.success(`Google Calendar에 ${result.synced}개 이벤트를 동기화했어요.`)
    else toast.error(result.error)
  }

  const handleDisconnect = async () => {
    await disconnectGoogleCalendar()
    setIsConnected(false)
    toast.success('Google Calendar 연동이 해제됐어요.')
  }

  const handleAddTask = (date: string) => {
    setTaskDefaultDate(date)
    setTaskDialogOpen(true)
  }

  const days = data.days

  // ── 월 뷰 그리드 생성 ──
  const buildMonthDays = () => {
    const monthStart = startOfMonth(current)
    const monthEnd = endOfMonth(current)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const cells: Date[] = []
    let d = gridStart
    while (d <= gridEnd) { cells.push(d); d = addDays(d, 1) }
    return cells
  }

  const buildWeekDays = () => {
    const weekStart = startOfWeek(current, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }

  const renderChips = (dateStr: string, maxVisible = 3) => {
    const day = days[dateStr]
    if (!day) return null
    const chips: { type: EventType; count?: number; label?: string }[] = []

    const adoptions = day.newAnimals.filter(a => a.acquisitionType === 'ADOPTION')
    const hatchings = day.newAnimals.filter(a => a.acquisitionType === 'HATCHING')
    if (adoptions.length) chips.push({ type: 'adoption', count: adoptions.length })
    if (hatchings.length) chips.push({ type: 'hatching', count: hatchings.length })
    if (day.sales.length) chips.push({ type: 'sale', count: day.sales.length })
    if (day.deaths.length) chips.push({ type: 'death', count: day.deaths.length })
    if (day.matings.length) chips.push({ type: 'mating', count: day.matings.length })
    if (day.layings.length) chips.push({ type: 'laying', count: day.layings.length })
    if (day.hatchings.length) chips.push({ type: 'hatch', count: day.hatchings.length })
    if (day.expectedHatchings.length) chips.push({ type: 'expected_hatch', count: day.expectedHatchings.length, dashed: true } as never)
    if (day.tasks.length) chips.push({ type: 'task', count: day.tasks.length })

    const visible = chips.slice(0, maxVisible)
    const overflow = chips.length - maxVisible

    return (
      <div className="flex flex-wrap gap-0.5 mt-1">
        {visible.map((c, i) => (
          <EventChip key={i} type={c.type} count={c.count} label={c.label} dashed={(c as never as {dashed?: boolean}).dashed} />
        ))}
        {overflow > 0 && <span className="text-[10px] text-muted-foreground leading-none pt-0.5">+{overflow}</span>}
      </div>
    )
  }

  const monthDays = buildMonthDays()
  const weekDays = buildWeekDays()

  return (
    <div className="flex h-full overflow-hidden">
      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} disabled={isPending}>
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-base font-semibold min-w-32 text-center">
              {view === 'month'
                ? format(current, 'yyyy년 M월', { locale: ko })
                : `${format(startOfWeek(current, { weekStartsOn: 0 }), 'M월 d일', { locale: ko })} ~ ${format(endOfWeek(current, { weekStartsOn: 0 }), 'M월 d일', { locale: ko })}`
              }
            </h2>
            <Button variant="ghost" size="icon" onClick={() => navigate(1)} disabled={isPending}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setCurrent(new Date()); refresh() }} className="text-xs text-muted-foreground">오늘</Button>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={handleViewChange}>
              <TabsList>
                <TabsTrigger value="month"><CalendarDays className="size-3.5 mr-1" />월</TabsTrigger>
                <TabsTrigger value="week"><CalendarRange className="size-3.5 mr-1" />주</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="icon" onClick={refresh} disabled={isPending} title="새로고침">
              <RefreshCw className={cn('size-4', isPending && 'animate-spin')} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.open('/weekly-report', '_blank')} className="text-xs gap-1.5" title="주간 리포트">
              <FileText className="size-3.5" />주간 리포트
            </Button>
            {isConnected ? (
              <>
                <Button size="sm" variant="outline" onClick={handleGoogleSync} className="text-xs gap-1.5">
                  <Link2 className="size-3.5 text-blue-500" />구글 동기화
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDisconnect} className="text-xs gap-1.5 text-muted-foreground">
                  <Link2Off className="size-3.5" />연동 해제
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => window.location.href = '/api/google/auth'} className="text-xs gap-1.5">
                <Link2 className="size-3.5" />구글 캘린더 연동
              </Button>
            )}
          </div>
        </div>

        {/* 미피딩 경고 배너 */}
        {data.unfedAnimals.length > 0 && (
          <div className="mx-4 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-red-700">7일 이상 피딩 기록 없는 개체 ({data.unfedAnimals.length}마리)</p>
              <p className="text-xs text-red-600 mt-0.5 truncate">
                {data.unfedAnimals.slice(0, 5).map(a => `${a.name || a.uniqueId}(${a.daysSinceFeeding}일)`).join(', ')}
                {data.unfedAnimals.length > 5 && ` 외 ${data.unfedAnimals.length - 5}마리`}
              </p>
            </div>
          </div>
        )}

        {/* 캘린더 그리드 */}
        <div className="flex-1 overflow-auto p-4">
          {view === 'month' ? (
            <div className="h-full flex flex-col min-h-0">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d, i) => (
                  <div key={d} className={cn('text-xs font-medium text-center py-1', i === 0 && 'text-red-500', i === 6 && 'text-blue-500')}>
                    {d}
                  </div>
                ))}
              </div>
              {/* 날짜 셀 */}
              <div className="grid grid-cols-7 gap-px bg-border flex-1">
                {monthDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const isCurrentMonth = isSameMonth(day, current)
                  const isSelected = selectedDate === dateStr
                  const dayIndex = day.getDay()
                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={cn(
                        'bg-background p-1.5 min-h-20 cursor-pointer transition-colors',
                        !isCurrentMonth && 'bg-muted/30',
                        isSelected && 'ring-2 ring-inset ring-primary',
                        'hover:bg-accent/50',
                      )}
                    >
                      <span className={cn(
                        'text-xs font-medium inline-flex w-5 h-5 items-center justify-center rounded-full',
                        isToday(day) && 'bg-primary text-primary-foreground',
                        !isCurrentMonth && 'text-muted-foreground',
                        dayIndex === 0 && isCurrentMonth && 'text-red-500',
                        dayIndex === 6 && isCurrentMonth && 'text-blue-500',
                      )}>
                        {format(day, 'd')}
                      </span>
                      {renderChips(dateStr, 3)}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            // 주 뷰
            <div className="h-full flex flex-col min-h-0">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const isSelected = selectedDate === dateStr
                  const dayIndex = day.getDay()
                  const dayData = days[dateStr]
                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={cn(
                        'border border-border rounded-lg p-2 min-h-40 cursor-pointer transition-colors hover:bg-accent/50',
                        isSelected && 'ring-2 ring-primary',
                        isToday(day) && 'border-primary',
                      )}
                    >
                      <div className="mb-2 text-center">
                        <p className={cn('text-xs', dayIndex === 0 && 'text-red-500', dayIndex === 6 && 'text-blue-500')}>
                          {WEEKDAYS[dayIndex]}
                        </p>
                        <span className={cn(
                          'text-sm font-semibold inline-flex w-7 h-7 items-center justify-center rounded-full',
                          isToday(day) && 'bg-primary text-primary-foreground',
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      {dayData && (
                        <div className="space-y-0.5">
                          {dayData.newAnimals.filter(a => a.acquisitionType === 'ADOPTION').length > 0 && (
                            <EventChip type="adoption" count={dayData.newAnimals.filter(a => a.acquisitionType === 'ADOPTION').length} className="w-full justify-center" />
                          )}
                          {dayData.newAnimals.filter(a => a.acquisitionType === 'HATCHING').length > 0 && (
                            <EventChip type="hatching" count={dayData.newAnimals.filter(a => a.acquisitionType === 'HATCHING').length} className="w-full justify-center" />
                          )}
                          {dayData.sales.length > 0 && <EventChip type="sale" count={dayData.sales.length} className="w-full justify-center" />}
                          {dayData.deaths.length > 0 && <EventChip type="death" count={dayData.deaths.length} className="w-full justify-center" />}
                          {dayData.matings.map(m => (
                            <div key={m.pairingId} className="px-1 py-0.5 bg-pink-50 rounded text-[10px] text-pink-700 truncate">
                              {m.femaleName || m.femaleUniqueId} × {m.maleName || m.maleUniqueId}
                            </div>
                          ))}
                          {dayData.layings.map(l => (
                            <div key={l.eggId} className="px-1 py-0.5 bg-yellow-50 rounded text-[10px] text-yellow-700 truncate">
                              산란 {l.femaleName || l.femaleUniqueId} ({l.count}개)
                            </div>
                          ))}
                          {dayData.hatchings.map(h => (
                            <div key={h.eggId} className="px-1 py-0.5 bg-sky-50 rounded text-[10px] text-sky-700 truncate">
                              부화 {h.femaleName || h.femaleUniqueId}
                            </div>
                          ))}
                          {dayData.expectedHatchings.map(e => (
                            <div key={e.eggId} className="px-1 py-0.5 bg-violet-50 border border-dashed border-violet-300 rounded text-[10px] text-violet-700 truncate">
                              예정 {e.femaleName || e.femaleUniqueId}
                            </div>
                          ))}
                          {dayData.tasks.map(t => (
                            <div key={t.id} className={cn('px-1 py-0.5 bg-orange-50 rounded text-[10px] text-orange-700 truncate', t.completed && 'opacity-50 line-through')}>
                              {t.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 우측 상세 패널 */}
      {selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          data={days[selectedDate]}
          onClose={() => setSelectedDate(null)}
          onAddTask={handleAddTask}
          onRefresh={refresh}
        />
      )}

      <TaskDialog
        key={taskDialogOpen ? (taskDefaultDate ?? 'none') : 'closed'}
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        defaultDate={taskDefaultDate}
        onCreated={refresh}
      />
    </div>
  )
}
