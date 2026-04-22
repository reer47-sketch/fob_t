'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { getWeeklyReport, WeeklyReportData } from '@/actions/calendar/get-weekly-report'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Loader2, Printer } from 'lucide-react'

interface WeeklyReportSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

function fmtDate(dateStr: string) {
  try { return format(parseISO(dateStr), 'M/d (EEE)', { locale: ko }) } catch { return dateStr }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 border-b pb-1">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ label, sub, badge, right }: { label: string; sub?: string | null; badge?: string; right?: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="truncate">{label}</span>
        {sub && <span className="text-xs text-muted-foreground shrink-0">{sub}</span>}
        {badge && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{badge}</span>}
      </div>
      {right && <span className="text-xs text-muted-foreground shrink-0 ml-2">{right}</span>}
    </div>
  )
}

function Empty() {
  return <p className="text-xs text-muted-foreground italic">해당 사항 없음</p>
}

export function WeeklyReportSheet({ open, onOpenChange }: WeeklyReportSheetProps) {
  const [data, setData] = useState<WeeklyReportData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getWeeklyReport().then(res => {
      setData(res.success && res.data ? res.data : null)
      setLoading(false)
    })
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>주간 브리딩 리포트</SheetTitle>
            <Button size="sm" variant="outline" className="text-xs gap-1.5 mr-6"
              onClick={() => window.open('/weekly-report', '_blank')}>
              <Printer className="size-3.5" />PDF 저장
            </Button>
          </div>
          {data && (
            <p className="text-xs text-muted-foreground">
              {fmtDate(data.weekStart)} ~ {fmtDate(data.weekEnd)}
            </p>
          )}
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && !data && (
          <p className="text-sm text-muted-foreground text-center py-16">리포트를 불러오지 못했습니다.</p>
        )}

        {!loading && data && (
          <div className="pr-2">
            <Section title="이번 주 부화 예정">
              {data.expectedHatchings.length === 0 ? <Empty /> : data.expectedHatchings.map(e => (
                <Row key={e.eggId}
                  label={`${e.femaleName || e.femaleUniqueId}${e.maleName ? ' × ' + e.maleName : ''}`}
                  right={fmtDate(e.expectedDate)} />
              ))}
            </Section>

            <Section title="산란 임박">
              {data.layingSoon.length === 0 ? <Empty /> : data.layingSoon.map(p => (
                <Row key={p.pairingId}
                  label={p.femaleName || p.femaleUniqueId}
                  sub={p.maleName ? `× ${p.maleName}` : undefined}
                  badge="산란 임박"
                  right={fmtDate(p.matingDate)} />
              ))}
            </Section>

            <Section title="메이팅 진행 중">
              {data.activeMating.length === 0 ? <Empty /> : data.activeMating.map(p => (
                <Row key={p.pairingId}
                  label={p.femaleName || p.femaleUniqueId}
                  sub={p.maleName ? `× ${p.maleName}` : undefined}
                  badge={p.status}
                  right={fmtDate(p.matingDate)} />
              ))}
            </Section>

            <Section title="이번 주 할 일">
              {data.tasks.length === 0 ? <Empty /> : data.tasks.map(t => (
                <Row key={t.id}
                  label={t.title}
                  badge={t.category}
                  right={fmtDate(t.date)} />
              ))}
            </Section>

            {data.unfedAnimals.length > 0 && (
              <Section title="미피딩 주의 (7일 이상)">
                {data.unfedAnimals.map(a => (
                  <Row key={a.id}
                    label={a.name || a.uniqueId}
                    right={a.daysSinceFeeding === 999 ? '기록 없음' : `${a.daysSinceFeeding}일 경과`} />
                ))}
              </Section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
