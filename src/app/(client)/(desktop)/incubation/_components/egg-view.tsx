'use client'

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format, parse } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Thermometer, Baby, X, Loader2, Trash2, Pencil, Check, Undo2, CalendarIcon, Plus, Minus, ArrowDown, ArrowUp } from 'lucide-react'
import { getEggData } from '@/actions/breeding-management/get-egg-data'
import { updateEggStatus } from '@/actions/breeding-management/update-egg-status'
import { changeEggTemp } from '@/actions/breeding-management/change-egg-temp'
import { updateEggMemo } from '@/actions/breeding-management/update-egg-memo'
import { deleteTemperatureLog } from '@/actions/breeding-management/delete-temperature-log'
import { updateEggSires } from '@/actions/breeding-management/update-egg-sires'
import { updateEggEnvironment } from '@/actions/breeding-management/update-egg-environment'
import { getHatchDaysRange, calculateHatchInfo, type TemperatureLog } from '@/lib/breeding-mock-data'
import type { EggDataItem, EggParentInfo } from '@/services/breeding-management-service'
import { useSheetRoute } from '@/hooks/use-sheet-route'

type SheetMode = 'detail' | 'temp' | 'status' | 'pairing'
const SHEET_KEYS = ['egg', 'mode'] as const
type EggSheetState = { egg: string; mode: SheetMode }

/** 알에 부화 정보를 붙인 뷰 모델 */
interface EggWithInfo {
  egg: EggDataItem
  hatchInfo: ReturnType<typeof calculateHatchInfo> | null
}

type StatusFilter = 'ALL' | 'INCUBATING' | 'HATCHED' | 'FAILED'
const VALID_FILTERS: StatusFilter[] = ['ALL', 'INCUBATING', 'HATCHED', 'FAILED']

export function EggView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [eggs, setEggs] = useState<EggDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const sheet = useSheetRoute<EggSheetState>(SHEET_KEYS)
  const selectedEggId = sheet.state?.egg ?? null
  const sheetMode: SheetMode = sheet.state?.mode ?? 'detail'
  const sheetOpen = sheet.isOpen
  const [isPending, startTransition] = useTransition()
  const isMobile = useIsMobile()

  const statusFilter = useMemo<StatusFilter>(() => {
    const param = searchParams.get('status')?.toUpperCase()
    return param && VALID_FILTERS.includes(param as StatusFilter) ? (param as StatusFilter) : 'INCUBATING'
  }, [searchParams])

  const setStatusFilter = useCallback((value: StatusFilter) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'INCUBATING') {
      params.delete('status')
    } else {
      params.set('status', value)
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  // 온도 변경 폼
  const [newTemp, setNewTemp] = useState('24')
  const [newTempDate, setNewTempDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  // 상태 변경 날짜
  const [statusDate, setStatusDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  // 메모 편집
  const [editingMemo, setEditingMemo] = useState(false)
  const [memoDraft, setMemoDraft] = useState('')

  // 습도·바닥재 편집
  const [editingEnv, setEditingEnv] = useState(false)
  const [humidityDraft, setHumidityDraft] = useState('')
  const [substrateDraft, setSubstrateDraft] = useState('')

  // 메이팅 수정 폼 (1~2개 maleId)
  const [pairingMaleIds, setPairingMaleIds] = useState<string[]>([])

  // 데이터 로드
  const loadData = useCallback(async () => {
    const result = await getEggData()
    if (result.success) {
      setEggs(result.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // 개별 알 리스트 (뷰 모델)
  const eggList = useMemo(() => {
    return eggs.map<EggWithInfo>(egg => {
      // calculateHatchInfo 호환 형태로 변환
      const hatchInfo = egg.status === 'INCUBATING' ? calculateHatchInfo({
        id: egg.id,
        pairingId: egg.pairingId ?? '',
        femaleId: egg.femaleId,
        layDate: egg.layDate,
        checked: egg.checked,
        fertile: egg.fertileStatus === 'FERTILE' ? true : egg.fertileStatus === 'INFERTILE' ? false : null,
        temperatureLogs: egg.temperatureLogs as TemperatureLog[],
        humidity: egg.humidity ?? undefined,
        substrate: egg.substrate ?? undefined,
        status: egg.status as any,
        hatchDate: egg.hatchDate ?? undefined,
        memo: egg.memo ?? undefined,
      }) : null

      return { egg, hatchInfo }
    }).sort((a, b) => {
      if (a.egg.status === 'INCUBATING' && b.egg.status !== 'INCUBATING') return -1
      if (a.egg.status !== 'INCUBATING' && b.egg.status === 'INCUBATING') return 1
      if (a.hatchInfo && b.hatchInfo) {
        const diff = a.hatchInfo.remainingDays - b.hatchInfo.remainingDays
        return sortDir === 'asc' ? diff : -diff
      }
      return a.egg.layDate.localeCompare(b.egg.layDate)
    })
  }, [eggs, sortDir])

  const incubatingCount = eggs.filter(e => e.status === 'INCUBATING').length
  const hatchedCount = eggs.filter(e => e.status === 'HATCHED').length
  const failedCount = eggs.filter(e => e.status === 'FAILED').length

  const filteredEggList = useMemo(() => {
    if (statusFilter === 'ALL') return eggList
    return eggList.filter(item => item.egg.status === statusFilter)
  }, [eggList, statusFilter])

  const handleEggClick = (eggId: string) => {
    setEditingMemo(false)
    setEditingEnv(false)
    sheet.open({ egg: eggId, mode: 'detail' })
  }

  // 알 상태 변경 (INCUBATING으로 되돌리기 포함)
  const handleEggStatusChange = (eggId: string, newStatus: 'INCUBATING' | 'HATCHED' | 'FAILED', date?: string) => {
    startTransition(async () => {
      const result = await updateEggStatus({ eggId, status: newStatus, date })
      if (result.success) {
        await loadData()
        sheet.close()
      } else if (result.error) {
        toast.error(result.error)
      }
    })
  }

  // 온도 변경
  const handleTempChange = (eggId: string) => {
    const temp = parseFloat(newTemp)
    if (isNaN(temp) || temp < 20 || temp > 28) return
    startTransition(async () => {
      const result = await changeEggTemp({ eggId, temperature: temp, startDate: newTempDate })
      if (result.success) {
        await loadData()
        sheet.update({ mode: 'detail' })
      } else if (result.error) {
        toast.error(result.error)
      }
    })
  }

  // 메이팅 수정 저장
  const handlePairingSave = (eggId: string) => {
    const ids = pairingMaleIds.filter(Boolean)
    if (ids.length === 0) return
    startTransition(async () => {
      const result = await updateEggSires({ eggId, maleIds: ids })
      if (result.success) {
        await loadData()
        sheet.update({ mode: 'detail' })
      } else if (result.error) {
        toast.error(result.error)
      }
    })
  }

  // 환경(습도·바닥재) 저장
  const handleEnvSave = (eggId: string) => {
    const humidity = humidityDraft.trim() ? parseInt(humidityDraft) : null
    if (humidity !== null && (isNaN(humidity) || humidity < 0 || humidity > 100)) return
    startTransition(async () => {
      const result = await updateEggEnvironment({
        eggId,
        humidity,
        substrate: substrateDraft.trim() || null,
      })
      if (result.success) {
        await loadData()
        setEditingEnv(false)
      } else if (result.error) {
        toast.error(result.error)
      }
    })
  }

  // 메모 저장
  const handleMemoSave = (eggId: string) => {
    startTransition(async () => {
      const result = await updateEggMemo({ eggId, memo: memoDraft })
      if (result.success) {
        await loadData()
        setEditingMemo(false)
      }
    })
  }

  // 온도 로그 삭제
  const handleDeleteTempLog = (eggId: string, logId: number) => {
    startTransition(async () => {
      const result = await deleteTemperatureLog({ eggId, logId })
      if (result.success) await loadData()
    })
  }

  // 온도 변경 시트 열기 (카드에서 열 땐 push, 상세에서 전환할 땐 replace)
  const openTempSheet = (eggId: string) => {
    const egg = eggs.find(e => e.id === eggId)
    const currentTemp = egg?.temperatureLogs[egg.temperatureLogs.length - 1]?.temp ?? 24
    setNewTemp(String(currentTemp))
    setNewTempDate(format(new Date(), 'yyyy-MM-dd'))
    if (sheet.isOpen) sheet.update({ mode: 'temp' })
    else sheet.open({ egg: eggId, mode: 'temp' })
  }

  // 상태 변경 시트 열기
  const openStatusSheet = (eggId: string) => {
    setStatusDate(format(new Date(), 'yyyy-MM-dd'))
    if (sheet.isOpen) sheet.update({ mode: 'status' })
    else sheet.open({ egg: eggId, mode: 'status' })
  }

  // 메이팅 수정 시트 열기 (상세에서만 호출)
  const openPairingSheet = (eggId: string) => {
    const egg = eggs.find(e => e.id === eggId)
    if (!egg) return
    const initial = [egg.maleId, egg.maleId2].filter((v): v is string => Boolean(v))
    setPairingMaleIds(initial)
    sheet.update({ mode: 'pairing' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* 필터 탭 */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'ALL', label: '전체', count: eggs.length, active: 'bg-neutral-900 text-white', countActive: 'text-white/70' },
          { key: 'INCUBATING', label: '인큐중', count: incubatingCount, active: 'bg-amber-500 text-white', countActive: 'text-white/70' },
          { key: 'HATCHED', label: '부화', count: hatchedCount, active: 'bg-green-500 text-white', countActive: 'text-white/70' },
          { key: 'FAILED', label: '실패', count: failedCount, active: 'bg-red-500 text-white', countActive: 'text-white/70' },
        ] as const).map(tab => {
          const isActive = statusFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 outline-none ${
                isActive
                  ? tab.active
                  : 'bg-neutral-100 text-muted-foreground hover:bg-neutral-200'
              }`}
            >
              {tab.label} <span className={isActive ? tab.countActive : 'text-muted-foreground/60'}>{tab.count}</span>
            </button>
          )
        })}
      </div>

      {/* 정렬 (인큐중 필터일 때만) */}
      {statusFilter === 'INCUBATING' && (
        <div className="flex justify-end -mt-3">
          <button
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
            aria-pressed={sortDir === 'desc'}
            aria-label={`해칭 ${sortDir === 'asc' ? '임박' : '여유'}순으로 정렬됨, 클릭하여 토글`}
            className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground hover:bg-neutral-100 active:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 rounded-full px-2.5 py-1"
          >
            정렬: <span className="font-semibold text-foreground">{sortDir === 'asc' ? '임박순' : '여유순'}</span>
            {sortDir === 'asc' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}

      {/* 부화 카드 그리드 */}
      {filteredEggList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {statusFilter === 'ALL' ? '산란 기록이 없습니다' : '해당 상태의 알이 없습니다'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredEggList.map(item => (
            <EggCard
              key={item.egg.id}
              item={item}
              onClick={() => handleEggClick(item.egg.id)}
              onTempChange={() => openTempSheet(item.egg.id)}
              onStatusChange={() => openStatusSheet(item.egg.id)}
              onRegister={() => router.push(`/animals/register?eggId=${item.egg.id}`)}
            />
          ))}
        </div>
      )}

      {/* 통합 시트 */}
      <Drawer direction={isMobile ? "bottom" : "right"} open={sheetOpen} onOpenChange={(open) => { if (!open) sheet.close() }}>
        <DrawerContent
          className={isMobile ? "rounded-t-3xl overflow-hidden px-5 max-h-[90dvh] flex flex-col" : "overflow-hidden px-5 pt-6 h-full flex flex-col"}
        >
          {/* === 알 상세 === */}
          {sheetMode === 'detail' && selectedEggId && (() => {
            const egg = eggs.find(e => e.id === selectedEggId)
            if (!egg) return null
            const currentTemp = egg.temperatureLogs[egg.temperatureLogs.length - 1]?.temp ?? 0
            const hatchInfo = egg.status === 'INCUBATING' ? calculateHatchInfo({
              id: egg.id,
              pairingId: egg.pairingId ?? '',
              femaleId: egg.femaleId,
              layDate: egg.layDate,
              checked: egg.checked,
              fertile: egg.fertileStatus === 'FERTILE' ? true : egg.fertileStatus === 'INFERTILE' ? false : null,
              temperatureLogs: egg.temperatureLogs as TemperatureLog[],
              humidity: egg.humidity ?? undefined,
              substrate: egg.substrate ?? undefined,
              status: egg.status as any,
              hatchDate: egg.hatchDate ?? undefined,
              memo: egg.memo ?? undefined,
            }) : null

            return (
              <>
                <DrawerHeader className="shrink-0 p-0 pb-4">
                  <DrawerTitle className="text-left">알 상세</DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="pb-6 space-y-4">
                  {/* 부모 정보 */}
                  <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">부모</span>
                      {egg.status === 'INCUBATING' && (
                        (!egg.male && egg.sireCandidates.length > 0) ||
                        egg.sireCandidates.length > 1
                      ) && (
                        <button
                          onClick={() => openPairingSheet(egg.id)}
                          aria-label="메이팅 수정"
                          className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-0.5"
                        >
                          <Pencil className="h-3 w-3" />
                          {egg.male ? '메이팅 수정' : '수컷 지정'}
                        </button>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <ParentRow parent={egg.female} />
                      {egg.male ? (
                        <ParentRow parent={egg.male} />
                      ) : (
                        <div className="text-xs text-muted-foreground px-0.5">수컷 미등록 (페어 없이 기록)</div>
                      )}
                      {egg.male2 && <ParentRow parent={egg.male2} />}
                    </div>
                  </div>

                  {/* 알 정보 그리드 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
                      <div className="text-xs text-muted-foreground">산란일</div>
                      <div className="text-sm font-semibold mt-0.5">{egg.layDate}</div>
                    </div>
                    <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
                      <div className="text-xs text-muted-foreground">현재 온도</div>
                      <div className="text-sm font-semibold mt-0.5">{currentTemp}°C</div>
                    </div>
                  </div>

                  {/* 인큐 환경 (습도·바닥재) — 편집 가능 */}
                  <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">인큐 환경</span>
                      {!editingEnv ? (
                        egg.status === 'INCUBATING' && (
                          <button
                            onClick={() => {
                              setHumidityDraft(egg.humidity != null ? String(egg.humidity) : '')
                              setSubstrateDraft(egg.substrate ?? '')
                              setEditingEnv(true)
                            }}
                            aria-label="인큐 환경 편집"
                            className="p-1 rounded-lg hover:bg-neutral-200 text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingEnv(false)}
                            aria-label="환경 편집 취소"
                            className="p-1 rounded-lg hover:bg-neutral-200 text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleEnvSave(egg.id)}
                            disabled={isPending}
                            aria-label="환경 저장"
                            className="p-1 rounded-lg hover:bg-green-100 text-green-600 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-1"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {!editingEnv ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-muted-foreground">습도</div>
                          <div className="text-sm font-semibold mt-0.5">{egg.humidity != null ? `${egg.humidity}%` : '-'}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-muted-foreground">바닥재</div>
                          <div className="text-sm font-semibold mt-0.5">{egg.substrate ?? '-'}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="env-humidity" className="text-[11px] text-muted-foreground">습도 (%)</label>
                          <Input
                            id="env-humidity"
                            type="number"
                            min={0}
                            max={100}
                            value={humidityDraft}
                            onChange={(e) => setHumidityDraft(e.target.value)}
                            placeholder="-"
                            className="mt-1 h-9 bg-white border-neutral-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label htmlFor="env-substrate" className="text-[11px] text-muted-foreground">바닥재</label>
                          <Input
                            id="env-substrate"
                            value={substrateDraft}
                            onChange={(e) => setSubstrateDraft(e.target.value)}
                            maxLength={30}
                            placeholder="해치라이트"
                            className="mt-1 h-9 bg-white border-neutral-200 rounded-xl"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 부화 정보 (인큐 중일 때) */}
                  {hatchInfo && (
                    <div className="rounded-2xl border border-neutral-100 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground">부화 진행</span>
                        <span className={`text-sm font-bold ${
                          hatchInfo.remainingDays <= 3 ? 'text-red-500' :
                          hatchInfo.remainingDays <= 14 ? 'text-orange-500' : 'text-amber-600'
                        }`}>
                          {hatchInfo.remainingDays === 0 ? 'D-Day' :
                           hatchInfo.remainingDays < 0 ? `D+${Math.abs(hatchInfo.remainingDays)}` :
                           `D-${hatchInfo.remainingDays}`}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            hatchInfo.remainingDays <= 3 ? 'bg-red-500' :
                            hatchInfo.remainingDays <= 14 ? 'bg-orange-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(hatchInfo.progress, 100)}%`, transition: 'width 500ms' }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                        <span>{hatchInfo.progress}%</span>
                        <span>예상 {hatchInfo.expectedDateMid.slice(5)} <span className="text-muted-foreground/60">({hatchInfo.expectedDateMin.slice(5)}~{hatchInfo.expectedDateMax.slice(5)})</span></span>
                      </div>
                    </div>
                  )}

                  {/* 상태 */}
                  <div className="rounded-2xl border border-neutral-100 p-3.5">
                    <div className="text-xs text-muted-foreground mb-2">상태</div>
                    {(() => {
                      const chipClass = egg.status === 'INCUBATING' ? 'bg-orange-100 text-orange-700' :
                        egg.status === 'HATCHED' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      const label = egg.status === 'INCUBATING' ? '인큐 중' : egg.status === 'HATCHED' ? '부화 완료' : '실패'
                      const editable = egg.status === 'INCUBATING' || !egg.hatchedAnimalId
                      const content = (
                        <>
                          {label}
                          {egg.hatchDate && <div className="text-xs mt-0.5 opacity-70">{egg.hatchDate}</div>}
                        </>
                      )
                      return editable ? (
                        <button
                          type="button"
                          onClick={() => openStatusSheet(egg.id)}
                          aria-label="상태 변경"
                          className={`w-full text-sm font-medium px-3 py-2 rounded-xl text-center transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 ${chipClass}`}
                        >
                          {content}
                        </button>
                      ) : (
                        <div className={`w-full text-sm font-medium px-3 py-2 rounded-xl text-center ${chipClass}`}>
                          {content}
                        </div>
                      )
                    })()}
                  </div>

                  {/* 온도 변경 히스토리 */}
                  <div className="rounded-2xl border border-neutral-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">온도 히스토리</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{egg.temperatureLogs.length}회</span>
                    </div>
                    <div className="divide-y divide-neutral-50">
                      {egg.temperatureLogs.map((log, i) => {
                        const isFirst = i === 0
                        const isLatest = i === egg.temperatureLogs.length - 1
                        const prevTemp = i > 0 ? egg.temperatureLogs[i - 1].temp : null
                        const tempDiff = prevTemp !== null ? log.temp - prevTemp : null
                        return (
                          <div key={log.id} className="flex items-center justify-between px-4 py-2.5 group">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${isLatest ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {log.temp}°C
                              </span>
                              {tempDiff !== null && tempDiff !== 0 && (
                                <span className={`text-xs font-medium ${tempDiff > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                  {tempDiff > 0 ? '+' : ''}{tempDiff.toFixed(1)}°C
                                </span>
                              )}
                              {isLatest && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-900 text-white">현재</span>
                              )}
                            </div>
                            <div className="relative">
                              <span className={`text-xs text-muted-foreground ${!isFirst ? 'group-hover:invisible' : ''}`}>{log.startDate}</span>
                              {!isFirst && (
                                <button
                                  onClick={() => handleDeleteTempLog(egg.id, log.id)}
                                  disabled={isPending}
                                  aria-label="온도 로그 삭제"
                                  className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 메모 */}
                  <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">메모</span>
                      {!editingMemo ? (
                        <button
                          onClick={() => { setMemoDraft(egg.memo ?? ''); setEditingMemo(true) }}
                          aria-label="메모 편집"
                          className="p-1 rounded-lg hover:bg-neutral-200 text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingMemo(false)}
                            aria-label="메모 편집 취소"
                            className="p-1 rounded-lg hover:bg-neutral-200 text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleMemoSave(egg.id)}
                            disabled={isPending}
                            aria-label="메모 저장"
                            className="p-1 rounded-lg hover:bg-green-100 text-green-600 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-1"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingMemo ? (
                      <Textarea
                        value={memoDraft}
                        onChange={(e) => setMemoDraft(e.target.value)}
                        maxLength={200}
                        placeholder="메모를 입력하세요"
                        className="min-h-[60px] resize-none bg-white border-neutral-200"
                        autoFocus
                      />
                    ) : (
                      <div className="text-sm text-foreground whitespace-pre-wrap">
                        {egg.memo || <span className="text-muted-foreground/50">메모 없음</span>}
                      </div>
                    )}
                  </div>

                </div>
                </div>
              </>
            )
          })()}

          {/* === 온도 변경 === */}
          {sheetMode === 'temp' && selectedEggId && (() => {
            const egg = eggs.find(e => e.id === selectedEggId)
            if (!egg) return null
            const currentTemp = egg.temperatureLogs[egg.temperatureLogs.length - 1]?.temp ?? 24
            const tempNum = parseFloat(newTemp)
            const tempRange = !isNaN(tempNum) ? getHatchDaysRange(tempNum) : null
            // 변경 시점 선택 가능 범위: 산란일 ~ 오늘
            const minDate = parse(egg.layDate, 'yyyy-MM-dd', new Date())
            const today = new Date()
            today.setHours(23, 59, 59, 999)
            return (
              <>
                <DrawerHeader className="shrink-0 p-0 pb-4">
                  <DrawerTitle className="text-left flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    온도 변경
                  </DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-4 mt-4 pb-6">
                  <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
                    <div className="text-xs text-muted-foreground mb-1">현재 온도</div>
                    <div className="text-lg font-bold">{currentTemp}°C</div>
                    {egg.temperatureLogs.length > 1 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        온도 변경 {egg.temperatureLogs.length - 1}회
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="temp-date-btn" className="text-sm font-semibold">변경 시점</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="temp-date-btn"
                          variant="outline"
                          className={cn(
                            'w-full rounded-xl h-10 justify-start text-left font-normal',
                            !newTempDate && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newTempDate
                            ? format(parse(newTempDate, 'yyyy-MM-dd', new Date()), 'yyyy년 M월 d일 (EEE)', { locale: ko })
                            : '날짜 선택'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          startMonth={new Date(new Date().getFullYear() - 1, 0)}
                          endMonth={new Date(new Date().getFullYear() + 1, 11)}
                          selected={newTempDate ? parse(newTempDate, 'yyyy-MM-dd', new Date()) : undefined}
                          onSelect={(date) => {
                            if (date) setNewTempDate(format(date, 'yyyy-MM-dd'))
                          }}
                          disabled={(d) => d < minDate || d > today}
                          locale={ko}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-[11px] text-muted-foreground pl-0.5">
                      산란일({egg.layDate}) 이후 ~ 오늘 범위에서 선택
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="temp-range" className="text-sm font-semibold">새 온도</label>
                      <span className="text-lg font-bold">{parseFloat(newTemp).toFixed(1)}°C</span>
                    </div>
                    <input
                      id="temp-range"
                      type="range"
                      min={20}
                      max={28}
                      step={0.5}
                      value={newTemp}
                      onChange={(e) => setNewTemp(e.target.value)}
                      className="w-full accent-neutral-900 h-2 rounded-full appearance-none bg-neutral-200 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                      <span>20°C</span>
                      {tempRange && <span>예상 부화: {tempRange.min}~{tempRange.max}일 · {tempRange.label}</span>}
                      <span>28°C</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-2xl h-11" onClick={() => sheet.close()}>
                      취소
                    </Button>
                    <Button
                      className="flex-1 rounded-2xl h-11"
                      disabled={isNaN(tempNum) || tempNum < 20 || tempNum > 28 || isPending || !newTempDate}
                      onClick={() => handleTempChange(selectedEggId)}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '변경'}
                    </Button>
                  </div>
                </div>
                </div>
              </>
            )
          })()}

          {/* === 알 상태 변경 === */}
          {sheetMode === 'status' && selectedEggId && (() => {
            const egg = eggs.find(e => e.id === selectedEggId)
            if (!egg) return null
            const minDate = parse(egg.layDate, 'yyyy-MM-dd', new Date())
            const today = new Date()
            today.setHours(23, 59, 59, 999)
            const isIncubating = egg.status === 'INCUBATING'
            return (
              <>
                <DrawerHeader className="shrink-0 p-0 pb-4">
                  <DrawerTitle className="text-left">알 상태 변경</DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-3 mt-4 pb-6">
                  <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4 text-sm">
                    <span className="text-pink-600 font-semibold">{egg.femaleName}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span>{egg.layDate}</span>
                    {!isIncubating && (
                      <div className="mt-1.5 text-xs text-muted-foreground">
                        현재 상태: <span className="font-semibold">{egg.status === 'HATCHED' ? '부화 완료' : '실패'}</span>
                        {egg.hatchDate && <span> · {egg.hatchDate}</span>}
                      </div>
                    )}
                  </div>

                  {isIncubating ? (
                    <>
                      {/* 날짜 선택 (부화/실패 전이) */}
                      <div className="space-y-1.5">
                        <label htmlFor="status-date-btn" className="text-sm font-semibold">날짜</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="status-date-btn"
                              variant="outline"
                              className={cn(
                                'w-full rounded-xl h-10 justify-start text-left font-normal',
                                !statusDate && 'text-muted-foreground',
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {statusDate
                                ? format(parse(statusDate, 'yyyy-MM-dd', new Date()), 'yyyy년 M월 d일 (EEE)', { locale: ko })
                                : '날짜 선택'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown"
                              startMonth={new Date(new Date().getFullYear() - 1, 0)}
                              endMonth={new Date(new Date().getFullYear() + 1, 11)}
                              selected={statusDate ? parse(statusDate, 'yyyy-MM-dd', new Date()) : undefined}
                              onSelect={(date) => {
                                if (date) setStatusDate(format(date, 'yyyy-MM-dd'))
                              }}
                              disabled={(d) => d < minDate || d > today}
                              locale={ko}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <button
                        disabled={isPending}
                        onClick={() => handleEggStatusChange(selectedEggId, 'HATCHED', statusDate)}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors text-left disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-1 outline-none"
                      >
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                          <Baby className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-green-700">부화 성공</div>
                          <div className="text-xs text-green-600/70">선택한 날짜로 기록됩니다</div>
                        </div>
                      </button>

                      <button
                        disabled={isPending}
                        onClick={() => handleEggStatusChange(selectedEggId, 'FAILED', statusDate)}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors text-left disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 outline-none"
                      >
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                          <X className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-red-700">실패</div>
                          <div className="text-xs text-red-600/70">무정란, 곰팡이 등</div>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        disabled={isPending}
                        onClick={() => handleEggStatusChange(selectedEggId, 'INCUBATING')}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-orange-200 bg-orange-50/50 hover:bg-orange-50 transition-colors text-left disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 outline-none"
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                          <Undo2 className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-orange-700">인큐로 되돌리기</div>
                          <div className="text-xs text-orange-600/70">
                            {egg.status === 'HATCHED' ? '부화 완료 기록을 취소하고 인큐 상태로 복귀' : '실패 기록을 취소하고 인큐 상태로 복귀'}
                          </div>
                        </div>
                      </button>
                      <p className="text-[11px] text-muted-foreground px-1">
                        다른 상태로 바꾸려면 먼저 인큐로 되돌린 뒤 다시 변경하세요.
                      </p>
                    </>
                  )}
                </div>
                </div>
              </>
            )
          })()}

          {/* === 메이팅 수정 === */}
          {sheetMode === 'pairing' && selectedEggId && (() => {
            const egg = eggs.find(e => e.id === selectedEggId)
            if (!egg) return null
            const candidates = egg.sireCandidates
            const usedIds = new Set(pairingMaleIds.filter(Boolean))
            const canAdd = pairingMaleIds.length < 2 && candidates.length > pairingMaleIds.length
            const canRemove = pairingMaleIds.length > 1
            const changed = (() => {
              const curr = [egg.maleId, egg.maleId2].filter((v): v is string => Boolean(v))
              const next = pairingMaleIds.filter(Boolean)
              if (curr.length !== next.length) return true
              return next.some((id, i) => id !== curr[i])
            })()
            return (
              <>
                <DrawerHeader className="shrink-0 p-0 pb-4">
                  <DrawerTitle className="text-left">메이팅 수정</DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-4 pb-6">
                  <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4 text-sm">
                    <span className="text-pink-600 font-semibold">{egg.femaleName ?? egg.female.uniqueId}</span>
                    <span className="text-muted-foreground"> · 산란 {egg.layDate}</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-semibold block">
                      메이팅 <span className="text-muted-foreground font-normal">(최대 2개)</span>
                    </span>
                    {pairingMaleIds.map((mid, idx) => {
                      const selectable = candidates.filter(c => !usedIds.has(c.id) || c.id === mid)
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="flex-1">
                            <Select
                              value={mid || undefined}
                              onValueChange={(value) => {
                                const next = [...pairingMaleIds]
                                next[idx] = value
                                setPairingMaleIds(next)
                              }}
                            >
                              <SelectTrigger className="w-full rounded-xl bg-white h-11 text-sm font-medium">
                                <SelectValue placeholder="메이팅 선택…" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectable.map(m => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name ?? m.uniqueId}{m.latestPairingDate ? ` · ${m.latestPairingDate}` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {canRemove && (
                            <button
                              type="button"
                              onClick={() => {
                                setPairingMaleIds(pairingMaleIds.filter((_, i) => i !== idx))
                              }}
                              aria-label="메이팅 제거"
                              className="shrink-0 w-11 h-11 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                            >
                              <Minus className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      )
                    })}

                    {canAdd && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = candidates.find(c => !usedIds.has(c.id))
                          if (next) setPairingMaleIds([...pairingMaleIds, next.id])
                        }}
                        className="w-full rounded-xl border-2 border-dashed border-neutral-200 py-2.5 text-sm font-semibold text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        + 메이팅 추가
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground px-0.5">
                    같은 암컷의 메이팅 이력에 있는 수컷만 선택할 수 있습니다. 최대 2개.
                  </p>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-2xl h-11" onClick={() => sheet.update({ mode: 'detail' })}>
                      취소
                    </Button>
                    <Button
                      className="flex-1 rounded-2xl h-11"
                      disabled={!changed || pairingMaleIds.length === 0 || isPending}
                      onClick={() => handlePairingSave(selectedEggId)}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장'}
                    </Button>
                  </div>
                </div>
                </div>
              </>
            )
          })()}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

// ============ 원형 프로그레스 링 ============

function ProgressRing({ progress, size = 96, strokeWidth = 4, color }: {
  progress: number
  size?: number
  strokeWidth?: number
  color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-neutral-100"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 700ms' }}
      />
    </svg>
  )
}

// ============ 부화 카드 ============

function EggCard({ item, onClick, onTempChange, onStatusChange, onRegister }: {
  item: EggWithInfo
  onClick: () => void
  onTempChange: () => void
  onStatusChange: () => void
  onRegister: () => void
}) {
  const { egg, hatchInfo } = item
  const isUrgent = hatchInfo && hatchInfo.remainingDays <= 3
  const isWarning = hatchInfo && hatchInfo.remainingDays <= 14
  const currentTemp = egg.temperatureLogs[egg.temperatureLogs.length - 1]?.temp ?? 0

  const ringColor = isUrgent ? '#ef4444' : isWarning ? '#f97316' : '#d97706'
  const accentText = isUrgent ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-amber-600'

  const dDayText = hatchInfo
    ? hatchInfo.remainingDays < 0
      ? `D+${Math.abs(hatchInfo.remainingDays)}`
      : hatchInfo.remainingDays === 0
        ? 'D-Day'
        : `D-${hatchInfo.remainingDays}`
    : null

  // --- 인큐 중 ---
  if (egg.status === 'INCUBATING' && hatchInfo) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
        className={cn(
          'w-full text-left rounded-2xl border p-4 flex flex-col cursor-pointer outline-none',
          'transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1',
          isUrgent ? 'border-red-200 bg-red-50/30' : 'border-neutral-100 bg-white',
        )}
      >
        {/* 부모 */}
        <div className="min-w-0 mb-4">
          <div className="text-[13px] leading-tight truncate">
            <span className="text-pink-600 font-semibold">{egg.femaleName}</span>
            <span className="text-muted-foreground/40"> × </span>
            {egg.male ? (
              <span className="text-blue-600 font-semibold">{egg.male.name ?? egg.male.uniqueId}</span>
            ) : (
              <span className="text-muted-foreground">수컷 미등록</span>
            )}
            {egg.male2 && (
              <>
                <span className="text-muted-foreground/40"> · </span>
                <span className="text-blue-600 font-semibold">{egg.male2.name ?? egg.male2.uniqueId}</span>
              </>
            )}
          </div>
        </div>

        {/* 프로그레스 링: D-day */}
        <div className="relative flex items-center justify-center self-center mb-4">
          <ProgressRing progress={hatchInfo.progress} size={88} color={ringColor} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              'text-lg font-extrabold tabular-nums leading-none',
              accentText,
              isUrgent && 'motion-safe:animate-pulse',
            )}>
              {dDayText}
            </span>
          </div>
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] text-muted-foreground/70"><span className="text-sm">🌡️</span> 온도</div>
            <div className="text-[13px] font-semibold tabular-nums text-foreground">{currentTemp}°C</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground/70"><span className="text-sm">🥚</span> 예상 부화</div>
            <div className="text-[13px] font-semibold tabular-nums text-foreground">{hatchInfo.expectedDateMid.slice(5)}</div>
            <div className="text-[10px] text-muted-foreground/60 tabular-nums">{hatchInfo.expectedDateMin.slice(5)}~{hatchInfo.expectedDateMax.slice(5)}</div>
          </div>
        </div>

        {/* 액션 */}
        <div className="flex gap-2 mt-auto pt-3 border-t border-neutral-100">
          <button
            onClick={(e) => { e.stopPropagation(); onTempChange() }}
            aria-label="온도 변경"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[13px] font-semibold text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          >
            <Thermometer className="h-3.5 w-3.5" />
            온도
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onStatusChange() }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[13px] font-semibold text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          >
            <Check className="h-3.5 w-3.5" />
            상태
          </button>
        </div>
      </div>
    )
  }

  // --- 부화 완료 ---
  if (egg.status === 'HATCHED') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
        className="w-full text-left rounded-2xl border border-green-100 bg-white p-4 flex flex-col cursor-pointer outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-1"
      >
        {/* 부모 */}
        <div className="min-w-0 mb-4">
          <div className="text-[13px] leading-tight truncate">
            <span className="text-pink-600 font-semibold">{egg.femaleName}</span>
            <span className="text-muted-foreground/40"> × </span>
            {egg.male ? (
              <span className="text-blue-600 font-semibold">{egg.male.name ?? egg.male.uniqueId}</span>
            ) : (
              <span className="text-muted-foreground">수컷 미등록</span>
            )}
            {egg.male2 && (
              <>
                <span className="text-muted-foreground/40"> · </span>
                <span className="text-blue-600 font-semibold">{egg.male2.name ?? egg.male2.uniqueId}</span>
              </>
            )}
          </div>
        </div>

        {/* 링 + 아이콘 */}
        <div className="relative flex items-center justify-center self-center mb-4">
          <ProgressRing progress={100} size={88} color="#22c55e" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Baby className="h-6 w-6 text-green-500 mb-0.5" />
            <span className="text-[11px] font-semibold text-green-600 tabular-nums">{egg.hatchDate?.slice(5) ?? '-'}</span>
          </div>
        </div>

        {/* 액션 */}
        <div className="mt-auto pt-3 border-t border-neutral-100">
          {egg.hatchedAnimalId ? (
            <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 text-[13px] font-semibold text-green-600">
              <Check className="h-3.5 w-3.5" />
              등록 완료
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onRegister() }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-[13px] font-semibold text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                <Baby className="h-3.5 w-3.5" />
                개체 등록
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onStatusChange() }}
                aria-label="인큐로 되돌리기"
                title="인큐로 되돌리기"
                className="shrink-0 w-9 flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              >
                <Undo2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- 실패 ---
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className="w-full text-left rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 flex flex-col opacity-60 cursor-pointer outline-none transition-shadow hover:shadow-md hover:opacity-80 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1"
    >
      {/* 부모 */}
      <div className="min-w-0 mb-4">
        <div className="text-[13px] leading-tight truncate">
          <span className="text-pink-600 font-semibold">{egg.femaleName}</span>
          <span className="text-muted-foreground/40"> × </span>
          {egg.male ? (
            <span className="text-blue-600 font-semibold">{egg.male.name ?? egg.male.uniqueId}</span>
          ) : (
            <span className="text-muted-foreground">수컷 미등록</span>
          )}
          {egg.male2 && (
            <>
              <span className="text-muted-foreground/40"> · </span>
              <span className="text-blue-600 font-semibold">{egg.male2.name ?? egg.male2.uniqueId}</span>
            </>
          )}
        </div>
      </div>

      {/* 링 + 아이콘 */}
      <div className="relative flex items-center justify-center self-center mb-4">
        <ProgressRing progress={0} size={88} color="#d4d4d4" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <X className="h-6 w-6 text-neutral-300 mb-0.5" />
          <span className="text-[11px] font-semibold text-red-400">실패</span>
        </div>
      </div>

      {/* 상태 되돌리기 */}
      <div className="mt-auto pt-3 border-t border-neutral-100">
        <button
          onClick={(e) => { e.stopPropagation(); onStatusChange() }}
          aria-label="상태 변경"
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[13px] font-semibold text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
        >
          <Undo2 className="h-3.5 w-3.5" />
          상태
        </button>
      </div>
    </div>
  )
}

// ============ 부모 정보 행 ============

function ParentRow({ parent }: { parent: EggParentInfo }) {
  const isFemale = parent.gender === 'FEMALE'
  const displayName = parent.name ?? parent.uniqueId
  const sub = [parent.species, parent.morph].filter(Boolean).join(' · ')

  return (
    <div className="flex items-center gap-3">
      {parent.imageUrl ? (
        <img
          src={parent.imageUrl}
          alt={displayName}
          width={40}
          height={40}
          className="w-10 h-10 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isFemale
            ? 'bg-gradient-to-br from-pink-50 to-rose-100'
            : 'bg-gradient-to-br from-blue-50 to-sky-100'
        }`}>
          <span className={`text-sm leading-none ${isFemale ? 'text-pink-400' : 'text-blue-400'}`}>
            {isFemale ? '♀' : '♂'}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${isFemale ? 'text-pink-500' : 'text-blue-500'}`}>
            {isFemale ? '♀' : '♂'}
          </span>
          <span className="text-sm font-bold truncate">{displayName}</span>
        </div>
        {sub && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">{sub}</div>
        )}
      </div>
    </div>
  )
}

// ============ 시트 내 산란표 행 ============

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    INCUBATING: { label: '인큐중', className: 'bg-orange-100 text-orange-700' },
    HATCHED: { label: '부화', className: 'bg-green-100 text-green-700' },
    FAILED: { label: '실패', className: 'bg-red-100 text-red-700' },
  }
  const c = config[status] ?? { label: status, className: 'bg-neutral-100 text-neutral-700' }
  return (
    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.className}`}>
      {c.label}
    </span>
  )
}
