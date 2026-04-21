'use client'

import { CalendarDayData } from '@/actions/calendar/get-calendar-data'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X, Plus, Trash2, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventChip } from './calendar-event-chip'
import { useState } from 'react'
import { toggleCalendarTask, deleteCalendarTask } from '@/actions/calendar/task-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

const CATEGORY_LABEL: Record<string, string> = {
  CLEANING: '사육장 청소', RACK_SETUP: '렉사 설치', FEEDING_PREP: '먹이 준비', HEALTH_CHECK: '건강 체크', OTHER: '기타',
}

interface DayDetailPanelProps {
  date: string
  data: CalendarDayData | undefined
  onClose: () => void
  onAddTask: (date: string) => void
  onRefresh: () => void
}

export function DayDetailPanel({ date, data, onClose, onAddTask, onRefresh }: DayDetailPanelProps) {
  const router = useRouter()
  const [loadingTask, setLoadingTask] = useState<string | null>(null)

  const d = new Date(date + 'T00:00:00')
  const hasData = data && (
    data.newAnimals.length + data.sales.length + data.deaths.length +
    data.matings.length + data.layings.length + data.hatchings.length +
    data.expectedHatchings.length + data.tasks.length > 0
  )

  const handleToggle = async (id: string, completed: boolean) => {
    setLoadingTask(id)
    await toggleCalendarTask(id, !completed)
    setLoadingTask(null)
    onRefresh()
  }

  const handleDelete = async (id: string) => {
    setLoadingTask(id)
    const res = await deleteCalendarTask(id)
    if (res.success) toast.success('태스크가 삭제됐어요.')
    else toast.error(res.error)
    setLoadingTask(null)
    onRefresh()
  }

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col h-full overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="font-semibold text-sm">{format(d, 'M월 d일 (EEEE)', { locale: ko })}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {!hasData && (
          <p className="text-sm text-muted-foreground text-center py-8">이 날의 기록이 없습니다.</p>
        )}

        {/* 신규 등록 */}
        {data && data.newAnimals.length > 0 && (
          <Section title="신규 등록">
            {data.newAnimals.map(a => (
              <Item key={a.id}>
                <EventChip type={a.acquisitionType === 'ADOPTION' ? 'adoption' : 'hatching'} />
                <span className="text-sm">{a.name || a.uniqueId}</span>
                <button onClick={() => router.push(`/animals/${a.id}`)} className="ml-auto text-muted-foreground hover:text-foreground">
                  <ExternalLink className="size-3" />
                </button>
              </Item>
            ))}
          </Section>
        )}

        {/* 판매 */}
        {data && data.sales.length > 0 && (
          <Section title={`판매 (총 ${data.sales.reduce((s, i) => s + i.price, 0).toLocaleString()}원)`}>
            {data.sales.map(s => (
              <Item key={s.id}>
                <EventChip type="sale" />
                <span className="text-sm">{s.animalName || s.animalUniqueId}</span>
                <span className="ml-auto text-xs text-muted-foreground">{s.price.toLocaleString()}원</span>
              </Item>
            ))}
          </Section>
        )}

        {/* 폐사 */}
        {data && data.deaths.length > 0 && (
          <Section title="폐사">
            {data.deaths.map(d => (
              <Item key={d.id}>
                <EventChip type="death" />
                <span className="text-sm">{d.name || d.uniqueId}</span>
              </Item>
            ))}
          </Section>
        )}

        {/* 메이팅 */}
        {data && data.matings.length > 0 && (
          <Section title="메이팅">
            {data.matings.map(m => (
              <Item key={m.pairingId}>
                <EventChip type="mating" />
                <span className="text-sm">{m.femaleName || m.femaleUniqueId} × {m.maleName || m.maleUniqueId}</span>
                <button onClick={() => router.push(`/pairings`)} className="ml-auto text-muted-foreground hover:text-foreground">
                  <ExternalLink className="size-3" />
                </button>
              </Item>
            ))}
          </Section>
        )}

        {/* 산란 */}
        {data && data.layings.length > 0 && (
          <Section title="산란">
            {data.layings.map(l => (
              <Item key={l.eggId}>
                <EventChip type="laying" />
                <span className="text-sm">{l.femaleName || l.femaleUniqueId} × {l.maleName ?? '?'}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{l.count}개</Badge>
              </Item>
            ))}
          </Section>
        )}

        {/* 부화 */}
        {data && data.hatchings.length > 0 && (
          <Section title="부화">
            {data.hatchings.map(h => (
              <Item key={h.eggId}>
                <EventChip type="hatch" />
                <span className="text-sm">{h.femaleName || h.femaleUniqueId} × {h.maleName ?? '?'}</span>
                {h.hasAnimal && <Badge variant="secondary" className="ml-auto text-xs">개체등록됨</Badge>}
              </Item>
            ))}
          </Section>
        )}

        {/* 부화 예정 */}
        {data && data.expectedHatchings.length > 0 && (
          <Section title="부화 예정">
            {data.expectedHatchings.map(e => (
              <Item key={e.eggId}>
                <EventChip type="expected_hatch" dashed />
                <span className="text-sm">{e.femaleName || e.femaleUniqueId} × {e.maleName ?? '?'}</span>
                {e.googleEventId && <span className="ml-auto text-[10px] text-muted-foreground">구글 동기화됨</span>}
              </Item>
            ))}
          </Section>
        )}

        {/* 태스크 */}
        <Section title="태스크">
          {data?.tasks.map(t => (
            <div key={t.id} className={`flex items-center gap-2 py-1 ${t.completed ? 'opacity-50' : ''}`}>
              <button
                onClick={() => handleToggle(t.id, t.completed)}
                disabled={loadingTask === t.id}
                className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${t.completed ? 'bg-primary border-primary' : 'border-border'}`}
              >
                {t.completed && <Check className="size-2.5 text-primary-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${t.completed ? 'line-through' : ''}`}>{t.title}</p>
                <p className="text-[10px] text-muted-foreground">{CATEGORY_LABEL[t.category]}</p>
              </div>
              <button onClick={() => handleDelete(t.id)} disabled={loadingTask === t.id} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => onAddTask(date)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            <Plus className="size-3" />
            태스크 추가
          </button>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Item({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>
}
