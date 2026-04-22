import { getWeeklyReport } from '@/actions/calendar/get-weekly-report'
import { getCurrentUserService } from '@/services/auth-service'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: '주간 브리딩 리포트' }

function fmtDate(dateStr: string) {
  try { return format(parseISO(dateStr), 'M월 d일 (EEEE)', { locale: ko }) } catch { return dateStr }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 break-inside-avoid">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1 mb-3">{title}</h2>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function Row({ label, sub, badge, right }: { label: string; sub?: string | null; badge?: string; right?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-dashed border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-800">{label}</span>
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
        {badge && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{badge}</span>}
      </div>
      {right && <span className="text-sm text-gray-500 shrink-0">{right}</span>}
    </div>
  )
}

function Empty() {
  return <p className="text-sm text-gray-400 italic">해당 사항 없음</p>
}

export default async function WeeklyReportPage() {
  const session = await getCurrentUserService()
  if (!session?.success || !session.data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        로그인이 필요합니다. 이 창을 닫고 앱에서 로그인 후 다시 시도해주세요.
      </div>
    )
  }

  let data = null
  try {
    const result = await getWeeklyReport()
    if (result.success) data = result.data
  } catch (e) {
    console.error('weekly-report page error:', e)
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        리포트를 불러오는 데 실패했습니다. 창을 닫고 다시 시도해주세요.
      </div>
    )
  }

  const generatedAt = format(new Date(data.generatedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })

  return (
    <>
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-10">
        <button onClick={() => window.print()}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
          인쇄 / PDF 저장
        </button>
        <button onClick={() => window.close()}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
          닫기
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-12 font-sans text-gray-900">
        <div className="mb-10">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">FOBreeders</p>
          <h1 className="text-2xl font-bold mb-1">주간 브리딩 리포트</h1>
          <p className="text-sm text-gray-500">{fmtDate(data.weekStart)} ~ {fmtDate(data.weekEnd)}</p>
          <p className="text-xs text-gray-400 mt-1">생성: {generatedAt}</p>
        </div>

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
            <Row key={t.id} label={t.title} badge={t.category} right={fmtDate(t.date)} />
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

        <div className="mt-12 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          FOBreeders 주간 리포트 · {generatedAt} 기준
        </div>
      </div>

      <style>{`
        @media print { @page { margin: 20mm; } }
      `}</style>
    </>
  )
}
