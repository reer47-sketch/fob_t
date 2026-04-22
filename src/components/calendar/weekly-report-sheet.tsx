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
    <div className="mb-6">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 pb-1.5 border-b border-border">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({
  label, sub, badge, right,
}: {
  label: string
  sub?: string | null
  badge?: string
  right?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-semibold leading-snug truncate">{label}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {badge}
          </span>
        )}
        {right && <span className="text-sm text-foreground">{right}</span>}
      </div>
    </div>
  )
}

function Empty() {
  return <p className="text-sm text-muted-foreground">해당 사항 없음</p>
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
      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col p-0">
        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-1">
            <SheetTitle className="text-base">주간 브리딩 리포트</SheetTitle>
            <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7"
              onClick={() => window.open('/weekly-report', '_blank')}>
              <Printer className="size-3" />PDF
            </Button>
          </div>
          {data && (
            <p className="text-xs text-muted-foreground">
              {fmtDate(data.weekStart)} ~ {fmtDate(data.weekEnd)}
            </p>
          )}
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && !data && (
            <p className="text-sm text-muted-foreground text-center py-16">리포트를 불러오지 못했습니다.</p>
          )}

          {!loading && data && (
            <>
              <Section title="이번 주 부화 예정">
                {data.expectedHatchings.length === 0 ? <Empty /> : data.expectedHatchings.map(e => (
                  <Row
                    key={e.eggId}
                    label={`${e.femaleName || e.femaleUniqueId}${e.maleName ? ' × ' + e.maleName : ''}`}
                    right={fmtDate(e.expectedDate)}
                  />
                ))}
              </Section>

              <Section title="산란 임박">
                {data.layingSoon.length === 0 ? <Empty /> : data.layingSoon.map(p => (
                  <Row
                    key={p.pairingId}
                    label={p.femaleName || p.femaleUniqueId}
                    sub={p.maleName ? `수컷: ${p.maleName}` : undefined}
                    badge="산란 임박"
                    right={fmtDate(p.matingDate)}
                  />
                ))}
              </Section>

              <Section title="메이팅 진행 중">
                {data.activeMating.length === 0 ? <Empty /> : data.activeMating.map(p => (
                  <Row
                    key={p.pairingId}
                    label={p.femaleName || p.femaleUniqueId}
                    sub={p.maleName ? `수컷: ${p.maleName}` : undefined}
                    badge={p.status}
                    right={fmtDate(p.matingDate)}
                  />
                ))}
              </Section>

              <Section title="이번 주 할 일">
                {data.tasks.length === 0 ? <Empty /> : data.tasks.map(t => (
                  <Row
                    key={t.id}
                    label={t.title}
                    sub={t.memo ?? undefined}
                    badge={t.category}
                    right={fmtDate(t.date)}
                  />
                ))}
              </Section>

              {data.unfedAnimals.length > 0 && (
                <Section title="미피딩 주의 (7일 이상)">
                  {data.unfedAnimals.map(a => (
                    <Row
                      key={a.id}
                      label={a.name || a.uniqueId}
                      right={a.daysSinceFeeding === 999 ? '기록 없음' : `${a.daysSinceFeeding}일 경과`}
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
