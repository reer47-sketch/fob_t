'use client'

import { useState, useEffect, useCallback, useMemo, useRef, useTransition, useId } from 'react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  ResponsiveDrawer,
  ResponsiveDrawerContent,
  ResponsiveDrawerHeader,
} from '@/components/ui/responsive-drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format, parse } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Plus, Minus, Check, Heart, Egg, AlertCircle, Snowflake, Thermometer, ChevronRight, UserPlus, Loader2, Settings2, Trash2, Pencil, Search, ScanLine, LogOut, CalendarIcon, Download } from 'lucide-react'
import { getRackData } from '@/actions/breeding-management/get-rack-data'
import { enterManualCooling } from '@/actions/breeding-management/enter-manual-cooling'
import { updatePairing } from '@/actions/breeding-management/update-pairing'
import { deletePairing } from '@/actions/breeding-management/delete-pairing'
import { deleteClutch } from '@/actions/breeding-management/delete-clutch'
import { assignCell } from '@/actions/breeding-management/assign-cell'
import { createPairing } from '@/actions/breeding-management/create-pairing'
import { createEggs } from '@/actions/breeding-management/create-eggs'
import { unassignCell } from '@/actions/breeding-management/unassign-cell'
import { createZone } from '@/actions/breeding-management/create-zone'
import { updateZone } from '@/actions/breeding-management/update-zone'
import { deleteZone } from '@/actions/breeding-management/delete-zone'
import { createRack } from '@/actions/breeding-management/create-rack'
import { updateRack } from '@/actions/breeding-management/update-rack'
import { deleteRack } from '@/actions/breeding-management/delete-rack'
import { getHatchDaysRange, CELL_STATUS_CONFIG } from '@/lib/breeding-mock-data'
import { QrScannerSheet } from '@/components/layout/qr-scanner-sheet'
import type {
  RackDataZone,
  RackDataRack,
  RackDataCell,
  RackDataAnimal,
  RackDataPairing,
} from '@/services/breeding-management-service'
import { AnimalDetailSheet } from '@/app/(client)/(desktop)/animals/_components/animal-detail-sheet'
import { getAnimalBreedingHistory } from '@/actions/breeding-management/get-animal-breeding-history'
import type { AnimalBreedingPairing } from '@/services/breeding-management-service'
import { PairingLabelSheet } from './pairing-label-sheet'
import { useSheetRoute } from '@/hooks/use-sheet-route'
import type { PairingLabelData } from './pairing-label-renderer'
import {
  PAIRING_STATE,
  DERIVED_STATUS_LABEL,
  daysBetween,
  type DerivedPairingStatus,
} from '@/lib/pairing-state'
import {
  AnimalSelectCard,
  BENTO_STYLES,
  CELL_SHAPE_COLORS,
  TRAPEZOID_PATH,
  TRAPEZOID_VENT_DOTS,
  TRAPEZOID_VENT_DOTS_COMPACT,
  derivePairingStatus,
  getCellDaysLabel,
  getCellStatusFromData,
  type CellStatus,
  type SheetMode,
} from './rack-shared'

export function RackView() {
  const [zones, setZones] = useState<RackDataZone[]>([])
  const [pairings, setPairings] = useState<RackDataPairing[]>([])
  const [unassignedAnimals, setUnassignedAnimals] = useState<RackDataAnimal[]>([])
  const [latestEggLayDateByFemaleId, setLatestEggLayDateByFemaleId] = useState<Record<string, string>>({})
  const [latestEggTempByFemaleId, setLatestEggTempByFemaleId] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [selectedZone, setSelectedZone] = useState<string>('')

  // 메인 셀 시트 (URL 기반: ?mode=<mode>&cell=<cellId>)
  // 기존 3-setter 호출 패턴(setSelectedCell / setSheetMode / setSheetOpen)을 유지하기 위해
  // 같은 이벤트 핸들러에서 발생한 연속 호출을 microtask로 모아 단일 URL 업데이트로 flush한다.
  type CellSheetState = { mode: SheetMode; cell?: string }
  const cellSheet = useSheetRoute<CellSheetState>(['mode', 'cell'])
  const sheetMode: SheetMode = (cellSheet.state?.mode as SheetMode) ?? 'detail'
  const sheetOpen = cellSheet.isOpen
  const selectedCellId = cellSheet.state?.cell ?? null

  const sheetBatchRef = useRef<{
    cell?: RackDataCell | null
    mode?: SheetMode
    openIntent?: 'open' | 'close'
  }>({})
  const flushScheduledRef = useRef(false)
  const flushSheetBatch = useCallback(() => {
    const batch = sheetBatchRef.current
    sheetBatchRef.current = {}
    flushScheduledRef.current = false

    if (batch.openIntent === 'close') {
      cellSheet.close()
      return
    }
    const isOpen = cellSheet.isOpen
    const wantsOpen = batch.openIntent === 'open' || isOpen
    if (!wantsOpen) return
    if (!isOpen) {
      const mode = batch.mode ?? 'detail'
      cellSheet.open({ mode, ...(batch.cell ? { cell: batch.cell.id } : {}) })
    } else {
      const patch: Partial<CellSheetState> = {}
      if (batch.mode !== undefined) patch.mode = batch.mode
      if (batch.cell) patch.cell = batch.cell.id
      if (Object.keys(patch).length > 0) cellSheet.update(patch)
    }
  }, [cellSheet])
  const scheduleSheetFlush = useCallback(() => {
    if (flushScheduledRef.current) return
    flushScheduledRef.current = true
    queueMicrotask(flushSheetBatch)
  }, [flushSheetBatch])

  const setSelectedCell = useCallback((cell: RackDataCell | null) => {
    sheetBatchRef.current.cell = cell
    scheduleSheetFlush()
  }, [scheduleSheetFlush])
  const setSheetMode = useCallback((mode: SheetMode) => {
    sheetBatchRef.current.mode = mode
    scheduleSheetFlush()
  }, [scheduleSheetFlush])
  const setSheetOpen = useCallback((open: boolean) => {
    sheetBatchRef.current.openIntent = open ? 'open' : 'close'
    scheduleSheetFlush()
  }, [scheduleSheetFlush])

  // selectedCell은 URL cellId + zones 데이터에서 파생
  const selectedCell = useMemo<RackDataCell | null>(() => {
    if (!selectedCellId) return null
    for (const z of zones) for (const r of z.racks) for (const c of r.cells) {
      if (c.id === selectedCellId) return c
    }
    return null
  }, [zones, selectedCellId])
  const [isPending, startTransition] = useTransition()
  const isMobile = useIsMobile()
  const fieldId = useId()
  const id = (key: string) => `${fieldId}-${key}`

  // 개체 배정 검색/QR
  const [assignSearch, setAssignSearch] = useState('')
  const [qrScannerOpen, setQrScannerOpen] = useState(false)

  // 개체 상세 시트 (URL 기반: ?animal=<id>)
  const detailSheet = useSheetRoute<{ animal: string }>(['animal'])
  const detailAnimalId = detailSheet.state?.animal ?? null
  const detailSheetOpen = detailSheet.isOpen

  // 구역 관리 상태
  const [zoneName, setZoneName] = useState('')
  const [zoneDescription, setZoneDescription] = useState('')
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)

  // 렉사 관리 상태
  const [rackName, setRackName] = useState('')
  const [rackRows, setRackRows] = useState('4')
  const [rackCols, setRackCols] = useState('2')
  const [editingRack, setEditingRack] = useState<RackDataRack | null>(null)

  // 확인 다이얼로그 상태 (window.confirm 대체)
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    destructive?: boolean
    onConfirm: () => void
  } | null>(null)

  // 페어링 등록 상태 — 수컷 1마리 고정
  const [selectedMaleId, setSelectedMaleId] = useState<string | null>(null)
  const [pairingDate, setPairingDate] = useState('')
  const [pairingMemo, setPairingMemo] = useState('')
  const [maleSearch, setMaleSearch] = useState('')

  // 페어링 수정 상태
  const [pairingEditId, setPairingEditId] = useState<string | null>(null)
  const [pairingEditDate, setPairingEditDate] = useState('')
  const [pairingEditMemo, setPairingEditMemo] = useState('')
  const [pairingEditFirstLayDate, setPairingEditFirstLayDate] = useState<string | null>(null)
  // 수정 완료/삭제 후 복귀할 시트 ('detail' = 상세에서 열린 경우, 'laying-history' = 산란 기록에서 열린 경우)
  const [pairingEditReturnTo, setPairingEditReturnTo] = useState<'detail' | 'laying-history'>('detail')

  // 산란 등록 상태 — 페어링 0~2개 + 유정/무정 수량 동시 입력
  const [eggLayDate, setEggLayDate] = useState('')
  const [eggDateOpen, setEggDateOpen] = useState(false)
  const [eggPairingIds, setEggPairingIds] = useState<string[]>([''])
  const [eggFertileCount, setEggFertileCount] = useState('')
  const [eggInfertileCount, setEggInfertileCount] = useState('')
  const [eggTemp, setEggTemp] = useState('24')
  const [eggHumidity, setEggHumidity] = useState('')
  const [eggSubstrate, setEggSubstrate] = useState('')
  const [eggMemo, setEggMemo] = useState('')

  // 산란 기록 시트 상태
  const [layingHistoryPairings, setLayingHistoryPairings] = useState<AnimalBreedingPairing[]>([])
  const [layingHistoryLoading, setLayingHistoryLoading] = useState(false)
  const [selectedHistoryPairingId, setSelectedHistoryPairingId] = useState<string>('')

  // 메이팅 기록 시트 상태 — 전체 페어링 조회 (getAnimalBreedingHistory 공유)
  const [pairingHistoryLoading, setPairingHistoryLoading] = useState(false)

  // 산란 라벨
  const [pairingLabelOpen, setPairingLabelOpen] = useState(false)
  const [pairingLabelData, setPairingLabelData] = useState<PairingLabelData | null>(null)

  // 데이터 로드
  const loadData = useCallback(async () => {
    const result = await getRackData()
    if (result.success) {
      setZones(result.data.zones)
      setPairings(result.data.pairings)
      setUnassignedAnimals(result.data.unassignedAnimals)
      setLatestEggLayDateByFemaleId(result.data.latestEggLayDateByFemaleId)
      setLatestEggTempByFemaleId(result.data.latestEggTempByFemaleId)
      if (!selectedZone && result.data.zones.length > 0) {
        setSelectedZone(result.data.zones[0].id)
      }
    }
    setLoading(false)
  }, [selectedZone])

  useEffect(() => { loadData() }, [loadData])

  const zoneRacks = zones.find(z => z.id === selectedZone)?.racks ?? []

  // 모든 브리딩 수컷 목록 (렉사 배정 + 미배정 포함)
  const allAnimalsInCells = zones.flatMap(z => z.racks.flatMap(r => r.cells.map(c => c.animal).filter(Boolean))) as RackDataAnimal[]
  const allBreedingMales = [
    ...allAnimalsInCells.filter(a => a.gender === 'MALE'),
    ...unassignedAnimals.filter(a => a.gender === 'MALE'),
  ]

  const handleCellClick = (cell: RackDataCell) => {
    setSelectedCell(cell)
    if (!cell.animal) {
      setAssignSearch('')
      setSheetMode('assign')
      setSheetOpen(true)
      return
    }
    setSheetMode('detail')
    setSheetOpen(true)
  }

  // 시즌 종료 → 강제 쿨링 진입. 유정란 산란 시 자동 해제됨.
  const handleEndPairing = (pairingId: string) => {
    setConfirmState({
      open: true,
      title: '시즌을 종료하시겠습니까?',
      description: '쿨링 상태로 전환됩니다. 이후 유정란을 산란하면 자동으로 산란 흐름으로 복귀합니다.',
      confirmLabel: '쿨링 진입',
      destructive: false,
      onConfirm: () => {
        startTransition(async () => {
          const result = await enterManualCooling({ pairingId })
          if (result.success) await loadData()
        })
      },
    })
  }

  // 산란 기록 재조회 (삭제 후 사용)
  const reloadLayingHistory = async (animalId: string, preferPairingId?: string) => {
    const result = await getAnimalBreedingHistory({ animalId })
    if (!result.success) return
    setLayingHistoryPairings(result.data.pairings)
    if (result.data.pairings.length === 0) {
      setSelectedHistoryPairingId('')
      setSheetMode('detail')
      return
    }
    const next =
      preferPairingId && result.data.pairings.some(p => p.id === preferPairingId)
        ? preferPairingId
        : result.data.pairings[0].id
    setSelectedHistoryPairingId(next)
  }

  // 페어링 수정 시트 오픈 — 날짜/메모만 수정 (수컷 변경은 지원하지 않음)
  // 상세/산란 기록 양쪽에서 호출 가능. returnTo는 수정 완료·삭제 후 돌아갈 시트.
  const openPairingEditFor = (args: {
    id: string
    date: string
    memo: string | null
    eggLayDates: string[]
    returnTo: 'detail' | 'laying-history'
  }) => {
    setPairingEditId(args.id)
    setPairingEditDate(args.date)
    setPairingEditMemo(args.memo ?? '')
    // 최초 산란일 = 메이팅 날짜의 상한선 (계보 무결성)
    const firstLay = args.eggLayDates.length > 0
      ? args.eggLayDates.reduce((min, d) => (d < min ? d : min), args.eggLayDates[0])
      : null
    setPairingEditFirstLayDate(firstLay)
    setPairingEditReturnTo(args.returnTo)
    setSheetMode('pairing-edit')
  }

  const openPairingEditSheet = (p: RackDataPairing) => {
    openPairingEditFor({
      id: p.id,
      date: p.date,
      memo: p.memo,
      eggLayDates: p.eggs.map(e => e.layDate),
      returnTo: 'detail',
    })
  }

  const handleUpdatePairing = () => {
    if (!pairingEditId || !pairingEditDate) return
    const animalId = selectedCell?.animal?.id
    const returnTo = pairingEditReturnTo
    const editedId = pairingEditId
    startTransition(async () => {
      const result = await updatePairing({
        pairingId: editedId,
        date: pairingEditDate,
        memo: pairingEditMemo.trim() || undefined,
      })
      if (result.success) {
        await loadData()
        if (returnTo === 'laying-history' && animalId) {
          await reloadLayingHistory(animalId, editedId)
          setSheetMode('laying-history')
        } else {
          setSheetMode('detail')
        }
      } else {
        toast.error(result.error ?? '페어링 수정에 실패했습니다.')
      }
    })
  }

  // 페어링 삭제 (파괴적): 알/온도로그 모두 cascade 삭제
  const handleDeletePairing = (pairingId: string) => {
    const animalId = selectedCell?.animal?.id
    setConfirmState({
      open: true,
      title: '메이팅을 삭제하시겠습니까?',
      description: '연결된 산란 기록과 온도 이력이 모두 함께 삭제됩니다. 되돌릴 수 없습니다.',
      confirmLabel: '삭제',
      destructive: true,
      onConfirm: () => {
        startTransition(async () => {
          const result = await deletePairing({ pairingId })
          if (result.success) {
            await loadData()
            if (animalId) await reloadLayingHistory(animalId)
            // 수정 시트에서 삭제한 경우 호출처로 복귀 (상세 또는 산란 기록)
            if (sheetMode === 'pairing-edit') {
              setPairingEditId(null)
              setSheetMode(pairingEditReturnTo)
            }
          } else {
            toast.error(result.error ?? '메이팅 삭제에 실패했습니다.')
          }
        })
      },
    })
  }

  // 산란(클러치) 삭제: 같은 페어링의 해당 산란일 알 전체.
  // pairingId가 'orphan-' prefix면 페어 없는 단독 산란이므로 femaleId 기반으로 삭제.
  const handleDeleteClutch = (pairingId: string, layDate: string) => {
    const animalId = selectedCell?.animal?.id
    const isOrphan = pairingId.startsWith('orphan-')
    setConfirmState({
      open: true,
      title: `${layDate} 산란을 삭제하시겠습니까?`,
      description: '해당 산란일의 알과 온도 이력이 모두 삭제됩니다. 되돌릴 수 없습니다.',
      confirmLabel: '삭제',
      destructive: true,
      onConfirm: () => {
        startTransition(async () => {
          const result = isOrphan
            ? await deleteClutch({ femaleId: animalId, layDate })
            : await deleteClutch({ pairingId, layDate })
          if (result.success) {
            await loadData()
            if (animalId) await reloadLayingHistory(animalId, pairingId)
          } else {
            toast.error(result.error ?? '산란 삭제에 실패했습니다.')
          }
        })
      },
    })
  }

  // 빈 칸에 개체 배정
  const handleAssignAnimal = (animalId: string) => {
    if (!selectedCell) return
    startTransition(async () => {
      const result = await assignCell({ cellId: selectedCell.id, animalId })
      if (result.success) {
        await loadData()
        setSheetOpen(false)
      }
    })
  }

  // QR로 개체 배정
  const handleQrAssign = (animal: { id: string }) => {
    handleAssignAnimal(animal.id)
  }

  // 셀 배정 해제 (렉사에서 빼기)
  const handleUnassignCell = () => {
    if (!selectedCell) return
    startTransition(async () => {
      const result = await unassignCell({ cellId: selectedCell.id })
      if (result.success) {
        await loadData()
        setSheetOpen(false)
      }
    })
  }

  // 페어링 등록 (수컷 1마리)
  const handleCreatePairing = () => {
    if (!selectedCell?.animal || !selectedMaleId) return
    startTransition(async () => {
      const result = await createPairing({
        femaleId: selectedCell.animal!.id,
        maleId: selectedMaleId,
        date: pairingDate,
        memo: pairingMemo || undefined,
      })
      if (result.success) {
        await loadData()
        setSheetMode('detail')
      }
    })
  }

  // 산란 등록 (페어 0~2개 + 유정/무정 동시 등록)
  const handleCreateEggs = () => {
    if (!selectedCell?.animal) return
    const femaleId = selectedCell.animal.id

    const pairingIds = eggPairingIds.filter(Boolean)
    const fertileCount = parseInt(eggFertileCount) || 0
    const infertileCount = parseInt(eggInfertileCount) || 0
    if (fertileCount + infertileCount < 1) return

    startTransition(async () => {
      const result = await createEggs({
        femaleId,
        layDate: eggLayDate,
        pairingIds,
        fertileCount,
        infertileCount,
        temperature: fertileCount > 0 ? parseFloat(eggTemp) : undefined,
        humidity: eggHumidity ? parseInt(eggHumidity) : undefined,
        substrate: eggSubstrate || undefined,
        memo: eggMemo || undefined,
      })
      if (result.success) {
        await loadData()
        setSheetMode('detail')
      } else {
        toast.error(result.error ?? '산란 등록에 실패했습니다.')
      }
    })
  }

  // 구역 추가
  const openZoneCreateSheet = () => {
    setZoneName('')
    setZoneDescription('')
    setSheetMode('zone-create')
    setSheetOpen(true)
  }

  const handleCreateZone = () => {
    if (!zoneName.trim()) return
    startTransition(async () => {
      const result = await createZone({
        name: zoneName.trim(),
        description: zoneDescription.trim() || undefined,
      })
      if (result.success) {
        await loadData()
        setSelectedZone(result.data.id)
        setSheetOpen(false)
      }
    })
  }

  // 구역 수정
  const openZoneEditSheet = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId)
    if (!zone) return
    setEditingZoneId(zoneId)
    setZoneName(zone.name)
    setZoneDescription('')
    setSheetMode('zone-edit')
    setSheetOpen(true)
  }

  const handleUpdateZone = () => {
    if (!editingZoneId || !zoneName.trim()) return
    startTransition(async () => {
      const result = await updateZone({
        zoneId: editingZoneId,
        name: zoneName.trim(),
        description: zoneDescription.trim() || undefined,
      })
      if (result.success) {
        await loadData()
        setSheetOpen(false)
      }
    })
  }

  const handleDeleteZone = () => {
    if (!editingZoneId) return
    const zoneIdToDelete = editingZoneId
    setConfirmState({
      open: true,
      title: '구역을 삭제하시겠습니까?',
      description: '구역 내 렉사가 있으면 삭제되지 않습니다.',
      confirmLabel: '삭제',
      destructive: true,
      onConfirm: () => {
        startTransition(async () => {
          const result = await deleteZone({ zoneId: zoneIdToDelete })
          if (result.success) {
            if (selectedZone === zoneIdToDelete) setSelectedZone('')
            await loadData()
            setSheetOpen(false)
          } else {
            toast.error(result.error ?? '구역 삭제에 실패했습니다.')
          }
        })
      },
    })
  }

  // 렉사 추가
  const openRackCreateSheet = () => {
    setRackName('')
    setRackRows('4')
    setRackCols('2')
    setSheetMode('rack-create')
    setSheetOpen(true)
  }

  const handleCreateRack = () => {
    if (!selectedZone || !rackName.trim()) return
    startTransition(async () => {
      const result = await createRack({
        zoneId: selectedZone,
        name: rackName.trim(),
        rows: parseInt(rackRows),
        cols: parseInt(rackCols),
      })
      if (result.success) {
        await loadData()
        setSheetOpen(false)
      }
    })
  }

  // 렉사 수정
  const openRackEditSheet = (rack: RackDataRack) => {
    setEditingRack(rack)
    setRackName(rack.name)
    setRackRows(String(rack.rows))
    setRackCols(String(rack.cols))
    setSheetMode('rack-edit')
    setSheetOpen(true)
  }

  const handleUpdateRack = () => {
    if (!editingRack || !rackName.trim()) return
    const newRows = parseInt(rackRows) || editingRack.rows
    const newCols = parseInt(rackCols) || editingRack.cols
    startTransition(async () => {
      const result = await updateRack({
        rackId: editingRack.id,
        name: rackName.trim(),
        rows: newRows,
        cols: newCols,
      })
      if (result.success) {
        await loadData()
        setSheetOpen(false)
      } else if (result.error) {
        toast.error(result.error)
      }
    })
  }

  const handleDeleteRack = () => {
    if (!editingRack) return
    const rackIdToDelete = editingRack.id
    setConfirmState({
      open: true,
      title: '렉사를 삭제하시겠습니까?',
      description: '렉사 내 개체가 배정되어 있으면 삭제되지 않습니다.',
      confirmLabel: '삭제',
      destructive: true,
      onConfirm: () => {
        startTransition(async () => {
          const result = await deleteRack({ rackId: rackIdToDelete })
          if (result.success) {
            await loadData()
            setSheetOpen(false)
          } else {
            toast.error(result.error ?? '렉사 삭제에 실패했습니다.')
          }
        })
      },
    })
  }

  const openPairingSheet = () => {
    setSelectedMaleId(null)
    setPairingDate(new Date().toISOString().slice(0, 10))
    setPairingMemo('')
    setMaleSearch('')
    setSheetMode('pairing')
  }

  const openEggSheet = () => {
    if (!selectedCell?.animal) return
    // 산란 등록 대상: 활성(비-DONE) 우선, 없으면 가장 최근 페어링(DONE 포함), 없으면 페어 없이 기록
    const femaleId = selectedCell.animal.id
    const femalePairings = pairings.filter(p => p.femaleId === femaleId)
    const activePairing = femalePairings.find(p => p.status !== 'DONE')
    const targetPairing =
      activePairing ??
      [...femalePairings].sort((a, b) => b.date.localeCompare(a.date))[0] ??
      null

    setEggLayDate(new Date().toISOString().slice(0, 10))
    setEggPairingIds(targetPairing ? [targetPairing.id] : [])
    setEggFertileCount('')
    setEggInfertileCount('')
    const lastTemp = latestEggTempByFemaleId[femaleId]
    setEggTemp(lastTemp !== undefined ? String(lastTemp) : '24')
    setEggHumidity('')
    setEggSubstrate('')
    setEggMemo('')
    setSheetMode('egg')
  }

  // 산란 기록 보기
  const openLayingHistory = async () => {
    if (!selectedCell?.animal) return
    setLayingHistoryLoading(true)
    setSheetMode('laying-history')
    const result = await getAnimalBreedingHistory({ animalId: selectedCell.animal.id })
    if (result.success) {
      setLayingHistoryPairings(result.data.pairings)
      if (result.data.pairings.length > 0) {
        setSelectedHistoryPairingId(result.data.pairings[0].id)
      }
    }
    setLayingHistoryLoading(false)
  }

  // 메이팅 기록 보기 — 해당 암컷의 전체 페어링 (orphan 제외)
  const openPairingHistory = async () => {
    if (!selectedCell?.animal) return
    setPairingHistoryLoading(true)
    setSheetMode('pairing-history')
    const result = await getAnimalBreedingHistory({ animalId: selectedCell.animal.id })
    if (result.success) {
      setLayingHistoryPairings(result.data.pairings)
    }
    setPairingHistoryLoading(false)
  }

  // 수컷 1마리 선택 (라디오 방식)
  const selectMale = (id: string) => {
    setSelectedMaleId(prev => (prev === id ? null : id))
  }

  const selectedAnimal = selectedCell?.animal ?? null
  const selectedPairing = selectedAnimal
    ? pairings.find(p => p.femaleId === selectedAnimal.id && p.status !== 'DONE')
      ?? pairings.find(p => p.maleId === selectedAnimal.id)
    : null

  // 활성 페어링의 파생 상태 (날짜 기반 자동 계산)
  const now = new Date()
  const selectedDerivedStatus: DerivedPairingStatus | null =
    selectedPairing && selectedPairing.status !== 'DONE'
      ? derivePairingStatus(selectedPairing, latestEggLayDateByFemaleId[selectedPairing.femaleId] ?? null, now)
      : null

  // 해당 암컷의 모든 페어링 (최근순) — 산란 등록 드롭다운 옵션
  const femalePairingsForEgg = selectedAnimal && selectedAnimal.gender === 'FEMALE'
    ? [...pairings.filter(p => p.femaleId === selectedAnimal.id)].sort((a, b) =>
        b.date.localeCompare(a.date),
      )
    : []

  // 산란 등록 대상 페어링: 활성(비-DONE) 우선, 없으면 가장 최근 페어링(DONE 포함)
  // — 이전 상태와 상관 없이 산란 등록이 가능하도록 (쿨링/완료/대기 모두 허용)
  const eggTargetPairing =
    femalePairingsForEgg.find(p => p.status !== 'DONE') ?? femalePairingsForEgg[0] ?? null

  // 산란 등록 버튼: 암컷이면 항상 노출 (페어가 없으면 클릭 시 안내)
  const canRegisterEgg = selectedAnimal?.gender === 'FEMALE'

  // 페어 추가: 암컷이면 항상 가능 (활성 페어가 있어도 추가 페어 등록 허용)
  const canCreatePairing = selectedAnimal?.gender === 'FEMALE'

  // 온도 범위 미리보기
  const tempNum = parseFloat(eggTemp)
  const tempRange = !isNaN(tempNum) ? getHatchDaysRange(tempNum) : null

  // 페어링 현황 통계 (파생 상태 기준)
  // 활성 페어 + "페어 없는 암컷의 5일 내 산란(배란기)"도 함께 집계해 셀 표시와 뱃지 카운트를 일치시킴.
  // 한 암컷에 활성 페어가 2개 이상인 경우(씨바꿈 등) 셀 표시는 최신 1건만 반영하므로,
  // 카운트도 "암컷당 최신 활성 페어" 1건으로 축약해 셀 UI와 어긋나지 않게 한다.
  const activePairings = pairings.filter(p => p.status !== 'DONE')
  const primaryActivePairings = Array.from(
    activePairings.reduce<Map<string, RackDataPairing>>((acc, p) => {
      const existing = acc.get(p.femaleId)
      if (!existing || p.date > existing.date) acc.set(p.femaleId, p)
      return acc
    }, new Map()).values(),
  )
  const primaryActivePairingIds = new Set(primaryActivePairings.map(p => p.id))
  const activeDerived = primaryActivePairings.map(p =>
    derivePairingStatus(p, latestEggLayDateByFemaleId[p.femaleId] ?? null, now),
  )
  const femalesWithActivePairing = new Set(activePairings.map(p => p.femaleId))
  const orphanWaitingCount = Object.entries(latestEggLayDateByFemaleId).filter(([femaleId, layDate]) => {
    if (femalesWithActivePairing.has(femaleId)) return false
    return daysBetween(new Date(layDate), now) < PAIRING_STATE.OVULATION_REST_DAYS
  }).length
  const waitingCount = activeDerived.filter(s => s === 'WAITING').length + orphanWaitingCount
  const matingCount = activeDerived.filter(s => s === 'MATING').length
  const layingSoonCount = activeDerived.filter(s => s === 'LAYING_SOON').length
  const coolingCount = activeDerived.filter(s => s === 'COOLING').length

  // 성별 카운트 — 렉에 배치된 개체 기준 (전 구역 합산)
  const maleCount = allAnimalsInCells.filter(a => a.gender === 'MALE').length
  const femaleCount = allAnimalsInCells.filter(a => a.gender === 'FEMALE').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (zones.length === 0) {
    return (
      <div className="space-y-6 pb-6">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center">
            <Plus className="h-6 w-6 text-neutral-400" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-[15px]">구역이 없습니다</p>
            <p className="text-sm text-muted-foreground">구역을 먼저 만들어 주세요</p>
          </div>
          <Button className="rounded-2xl h-11 gap-2" onClick={openZoneCreateSheet}>
            <Plus className="h-4 w-4" />
            구역 만들기
          </Button>
        </div>

        <ResponsiveDrawer open={sheetOpen} onOpenChange={(open) => { if (!open) cellSheet.close() }}>
          <ResponsiveDrawerContent>
            <ResponsiveDrawerHeader
              title="구역 추가"
              onClose={() => setSheetOpen(false)}
            />
            <div className={`no-scrollbar flex-1 overflow-y-auto px-5 ${isMobile ? 'pt-2' : 'pt-4'}`}>
              {sheetMode === 'zone-create' && (
                <>
                  <div className="space-y-5 pb-6">
                    <div className="space-y-1.5">
                      <label htmlFor={id('zone-name-empty')} className="text-sm font-semibold">구역 이름</label>
                      <Input
                        id={id('zone-name-empty')}
                        name="zoneName"
                        autoComplete="off"
                        value={zoneName}
                        onChange={(e) => setZoneName(e.target.value)}
                        placeholder="A, B, 1층…"
                        className="rounded-xl"
                        autoFocus={!isMobile}
                      />
                    </div>
                    <Button
                      className="w-full rounded-2xl h-11"
                      disabled={!zoneName.trim() || isPending}
                      onClick={handleCreateZone}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '구역 추가'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </ResponsiveDrawerContent>
        </ResponsiveDrawer>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* 구역 선택 */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {zones.map(zone => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone.id)}
            onDoubleClick={() => openZoneEditSheet(zone.id)}
            className={`shrink-0 px-5 py-2 rounded-2xl text-sm font-semibold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-1 ${selectedZone === zone.id
              ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/20'
              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}
          >
            {zone.name}
          </button>
        ))}
        <button
          onClick={openZoneCreateSheet}
          aria-label="구역 추가"
          className="shrink-0 w-9 h-9 rounded-2xl bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        {selectedZone && (
          <button
            onClick={() => openZoneEditSheet(selectedZone)}
            aria-label="구역 설정"
            className="shrink-0 w-9 h-9 rounded-2xl bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 상태 뱃지 — 페어링 상태 4개(pill)를 먼저 두고, 구분선 뒤에 ♂/♀ 단순 카운트를 톤다운해서 배치.
          laying_soon > 0 이면 dot만 펄스 (시선 유도, 색감은 절제) */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {([
          { status: 'waiting', count: waitingCount },
          { status: 'mating', count: matingCount },
          { status: 'laying_soon', count: layingSoonCount },
          { status: 'cooling', count: coolingCount },
        ] as const).map(({ status, count }) => {
          const isUrgent = status === 'laying_soon' && count > 0
          return (
            <div
              key={status}
              className={cn(
                'shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1',
                BENTO_STYLES[status].bg,
                BENTO_STYLES[status].border,
              )}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  CELL_STATUS_CONFIG[status].dot,
                  isUrgent && 'animate-pulse',
                )}
              />
              <span className="text-[13px] font-medium text-muted-foreground">{CELL_STATUS_CONFIG[status].label}</span>
              <span
                className={cn(
                  'text-[13px] font-bold tabular-nums',
                  count === 0 ? 'text-neutral-300' : 'text-neutral-900',
                )}
              >
                {count}
              </span>
            </div>
          )
        })}

        <div className="shrink-0 h-5 w-px bg-neutral-200 mx-1" aria-hidden="true" />

        <div className="shrink-0 flex items-center gap-3 text-[13px]">
          <span className="flex items-center gap-1">
            <span className="text-blue-400 leading-none">♂</span>
            <span className="tabular-nums font-semibold text-neutral-600">{maleCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-pink-400 leading-none">♀</span>
            <span className="tabular-nums font-semibold text-neutral-600">{femaleCount}</span>
          </span>
        </div>
      </div>

      {/* 렉사 벤토 그리드 */}
      {zoneRacks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm space-y-3">
          <p>이 구역에 렉사가 없습니다</p>
          <Button variant="outline" className="rounded-2xl h-10 gap-2" onClick={openRackCreateSheet}>
            <Plus className="h-4 w-4" />
            렉사 추가
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {zoneRacks.map(rack => {
            const occupiedCount = rack.cells.filter(c => c.animal).length
            // 렉사별 페어링 상태 카운트 (0인 항목은 서머리에서 제외)
            const rackCounts = { waiting: 0, mating: 0, laying_soon: 0, cooling: 0 }
            rack.cells.forEach(cell => {
              const s = getCellStatusFromData(cell, pairings, latestEggLayDateByFemaleId, now)
              if (s === 'waiting' || s === 'mating' || s === 'laying_soon' || s === 'cooling') {
                rackCounts[s]++
              }
            })
            const rackSummary: Array<{ key: keyof typeof rackCounts; label: string; dot: string; urgent?: boolean; text?: string }> = [
              { key: 'laying_soon', label: '산란 임박', dot: 'bg-red-500', urgent: true, text: 'text-red-600' },
              { key: 'waiting', label: '대기', dot: 'bg-orange-400' },
              { key: 'mating', label: '산란 중', dot: 'bg-violet-400' },
              { key: 'cooling', label: '쿨링', dot: 'bg-sky-400' },
            ]
            const nonZeroSummary = rackSummary.filter(i => rackCounts[i.key] > 0)
            return (
              <div key={rack.id}>
                <button
                  onClick={() => openRackEditSheet(rack)}
                  className="flex items-center gap-2.5 mb-4 group text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 flex-wrap"
                >
                  <h3 className="font-bold text-lg leading-tight">{rack.name}</h3>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {occupiedCount}/{rack.rows * rack.cols}칸
                  </span>
                  {nonZeroSummary.length > 0 && (
                    <>
                      <span className="text-neutral-300 text-xs" aria-hidden="true">·</span>
                      <div className="flex items-center gap-2.5 text-xs">
                        {nonZeroSummary.map(item => (
                          <span
                            key={item.key}
                            className={cn(
                              'inline-flex items-center gap-1',
                              item.urgent ? 'font-semibold text-red-600' : 'text-muted-foreground',
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', item.dot, item.urgent && 'animate-pulse')} />
                            {item.label} {rackCounts[item.key]}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  <Pencil className="h-3 w-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {(() => {
                  const isLargeRack = rack.cols >= 8
                  const isMediumRack = rack.cols >= 5
                  return (
                    <div className="overflow-x-auto -mx-2 px-2">
                      <div
                        className={`grid ${isLargeRack ? 'gap-1.5' : isMediumRack ? 'gap-1.5' : 'gap-2 sm:gap-3'}`}
                        style={{ gridTemplateColumns: `repeat(${rack.cols}, minmax(${isLargeRack ? '60px' : '56px'}, 120px))` }}
                      >
                        {rack.cells.map(cell => {
                          const status = getCellStatusFromData(cell, pairings, latestEggLayDateByFemaleId, now)
                          const style = BENTO_STYLES[status]
                          const config = CELL_STATUS_CONFIG[status]
                          const animal = cell.animal
                          const daysLabel = getCellDaysLabel(cell, pairings, latestEggLayDateByFemaleId, now)

                          const ventDots = isLargeRack ? TRAPEZOID_VENT_DOTS_COMPACT : TRAPEZOID_VENT_DOTS

                          // 빈 셀 — 모든 사이즈에서 사다리꼴 통일
                          if (!animal) {
                            return (
                              <button
                                key={cell.id}
                                onClick={() => handleCellClick(cell)}
                                aria-label="빈 셀에 개체 배정"
                                className="group relative aspect-[4/3] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                              >
                                <svg viewBox="0 0 100 75" className="absolute inset-0 w-full h-full">
                                  <path
                                    d={TRAPEZOID_PATH}
                                    fill="#fafafa"
                                    stroke="#d4d4d4"
                                    strokeWidth={1.4}
                                    className="transition-colors group-hover:stroke-neutral-500"
                                  />
                                  {ventDots.map(x => (
                                    <circle key={x} cx={x} cy={9} r={1.1} fill="rgba(15,15,15,0.12)" />
                                  ))}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Plus className={`${isLargeRack ? 'h-3 w-3' : 'h-4 w-4'} text-neutral-300`} aria-hidden="true" />
                                </div>
                              </button>
                            )
                          }

                          const StatusIcon = BENTO_STYLES[status].icon
                          const shape = CELL_SHAPE_COLORS[status]

                          // 채워진 셀 — 모든 사이즈에서 사다리꼴 통일
                          return (
                            <button
                              key={cell.id}
                              onClick={() => handleCellClick(cell)}
                              aria-label={`${animal.name ?? animal.uniqueId} 상세 보기`}
                              className="group relative aspect-[4/3] rounded-2xl transition-[transform,filter] hover:scale-[1.02] active:scale-[0.98] [filter:drop-shadow(0_1px_1.5px_rgba(0,0,0,0.04))] hover:[filter:drop-shadow(0_6px_10px_rgba(0,0,0,0.08))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                            >
                              <svg viewBox="0 0 100 75" className="absolute inset-0 w-full h-full">
                                <path
                                  d={TRAPEZOID_PATH}
                                  fill={shape.fill}
                                  stroke={shape.stroke}
                                  strokeWidth={1.4}
                                />
                                {ventDots.map(x => (
                                  <circle key={x} cx={x} cy={9} r={1.1} fill="rgba(15,15,15,0.18)" />
                                ))}
                              </svg>
                              <div className={`absolute inset-0 flex flex-col justify-between ${
                                isLargeRack ? 'px-3 pt-3 pb-1.5' :
                                isMediumRack ? 'px-3 pt-4 pb-2.5' :
                                'px-5 pt-5 pb-3.5'
                              }`}>
                                <div className="flex items-start justify-between">
                                  <div className={`${isLargeRack ? 'text-xs' : 'text-lg'} leading-none ${animal.gender === 'MALE' ? 'text-blue-400' : 'text-pink-400'}`}>
                                    {animal.gender === 'MALE' ? '♂' : '♀'}
                                  </div>
                                  {StatusIcon && (() => {
                                    const pillBg = status === 'cooling' ? 'bg-sky-100'
                                      : status === 'mating' ? 'bg-violet-100'
                                      : status === 'laying_soon' ? 'bg-red-200'
                                      : status === 'waiting' ? 'bg-orange-100'
                                      : 'bg-neutral-100'
                                    const pulse = status === 'laying_soon' ? 'animate-pulse' : ''
                                    if (isLargeRack) {
                                      return (
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${pillBg} ${pulse}`}>
                                          <StatusIcon className={`h-2 w-2 ${config.text}`} />
                                        </div>
                                      )
                                    }
                                    if (isMediumRack) {
                                      return (
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${pillBg} ${pulse}`}>
                                          <StatusIcon className={`h-2.5 w-2.5 ${config.text}`} />
                                        </div>
                                      )
                                    }
                                    return (
                                      <div className={`inline-flex items-center gap-1 h-6 rounded-full pl-1.5 ${daysLabel ? 'pr-2' : 'pr-1.5'} ${pillBg} ${pulse}`}>
                                        <StatusIcon className={`h-3 w-3 shrink-0 ${config.text}`} />
                                        {daysLabel && (
                                          <span className={`text-xs font-bold tabular-nums leading-none ${config.text}`}>{daysLabel}</span>
                                        )}
                                      </div>
                                    )
                                  })()}
                                </div>
                                <div className="min-w-0 text-center">
                                  <div className={`${
                                    isLargeRack ? 'text-[13px]' :
                                    isMediumRack ? 'text-[13px]' :
                                    'text-[15px]'
                                  } font-bold truncate leading-tight`}>{animal.name ?? animal.uniqueId}</div>
                                  {!isLargeRack && (
                                    <div className={`${isMediumRack ? 'text-[11px]' : 'text-xs'} text-muted-foreground truncate mt-0.5`}>{animal.morph}</div>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}

          {/* 렉사 추가 버튼 */}
          <button
            onClick={openRackCreateSheet}
            className="w-full rounded-3xl border-2 border-dashed border-neutral-200 py-8 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-neutral-300 hover:text-neutral-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">렉사 추가</span>
          </button>
        </div>
      )}

      {/* 통합 시트 */}
      <ResponsiveDrawer open={sheetOpen} onOpenChange={(open) => { if (!open) cellSheet.close() }}>
        <ResponsiveDrawerContent
          size={sheetMode === 'laying-history' || sheetMode === 'pairing-history' || sheetMode === 'pairing' ? 'tall' : 'default'}
          className="data-[vaul-drawer-direction=right]:sm:max-w-md"
        >
          {/* 헤더 — 모드별로 분기. 사이드(데스크톱)는 좌측 정렬, 바텀(모바일)은 중앙 정렬 */}
          {sheetMode === 'detail' && selectedAnimal && (
            <ResponsiveDrawerHeader
              title="개체 상세"
              onClose={() => setSheetOpen(false)}
              hideOnMobile
            />
          )}
          {sheetMode === 'pairing' && selectedAnimal && (
            <ResponsiveDrawerHeader
              title={
                <>
                  <span className="text-pink-600">{selectedAnimal.name ?? selectedAnimal.uniqueId}</span>
                  <span className="text-muted-foreground font-normal"> 메이팅</span>
                </>
              }
              onBack={() => setSheetMode('detail')}
              onClose={() => setSheetOpen(false)}
            />
          )}
          {sheetMode === 'pairing-edit' && selectedAnimal && (
            <ResponsiveDrawerHeader
              title={
                <>
                  <span className="text-pink-600">{selectedAnimal.name ?? selectedAnimal.uniqueId}</span>
                  <span className="text-muted-foreground font-normal"> 메이팅 수정</span>
                </>
              }
              onBack={() => setSheetMode(pairingEditReturnTo)}
              onClose={() => setSheetOpen(false)}
            />
          )}
          {sheetMode === 'egg' && selectedAnimal && (
            <ResponsiveDrawerHeader
              title={
                <>
                  <span className="text-pink-600">{selectedAnimal.name ?? selectedAnimal.uniqueId}</span>
                  <span className="text-muted-foreground font-normal"> 산란 등록</span>
                </>
              }
              onBack={() => setSheetMode('detail')}
              onClose={() => setSheetOpen(false)}
            />
          )}
          {sheetMode === 'laying-history' && selectedAnimal && (
            <ResponsiveDrawerHeader
              title="산란 기록"
              onBack={() => setSheetMode('detail')}
              onClose={() => setSheetOpen(false)}
            />
          )}
          {sheetMode === 'pairing-history' && selectedAnimal && (
            <ResponsiveDrawerHeader
              title="메이팅 기록"
              onBack={() => setSheetMode('detail')}
              onClose={() => setSheetOpen(false)}
            />
          )}
          {sheetMode === 'assign' && (
            <ResponsiveDrawerHeader
              title="개체 배정"
              onClose={() => setSheetOpen(false)}
            />
          )}
          {sheetMode === 'zone-create' && (
            <ResponsiveDrawerHeader title="구역 추가" onClose={() => setSheetOpen(false)} />
          )}
          {sheetMode === 'zone-edit' && (
            <ResponsiveDrawerHeader title="구역 수정" onClose={() => setSheetOpen(false)} />
          )}
          {sheetMode === 'rack-create' && (
            <ResponsiveDrawerHeader title="렉사 추가" onClose={() => setSheetOpen(false)} />
          )}
          {sheetMode === 'rack-edit' && (
            <ResponsiveDrawerHeader title="렉사 수정" onClose={() => setSheetOpen(false)} />
          )}

          {/* 스크롤 컨테이너 (vaul 드래그 제스처와 충돌 방지: DrawerContent가 아닌 안쪽 div에서 스크롤 처리) */}
          {(sheetMode === 'detail' || sheetMode === 'pairing' || sheetMode === 'pairing-edit' || sheetMode === 'egg') && (
          <div className={`no-scrollbar flex-1 overflow-y-auto px-5 ${isMobile ? 'pt-2' : 'pt-4'}`}>
          {/* === 개체 상세 === */}
          {sheetMode === 'detail' && selectedAnimal && (() => {
            // 파생 상태 (날짜 기반 자동 계산)
            const femaleLatestEggDate = selectedAnimal.gender === 'FEMALE'
              ? latestEggLayDateByFemaleId[selectedAnimal.id] ?? null
              : null
            const derivedStatus: DerivedPairingStatus | null =
              selectedPairing && selectedPairing.status !== 'DONE'
                ? derivePairingStatus(
                    selectedPairing,
                    latestEggLayDateByFemaleId[selectedPairing.femaleId] ?? null,
                    now,
                  )
                : null
            // 해당 암컷의 최근 페어링 2개 (씨바꿈 대응) — 활성 우선, 없으면 최근 DONE까지 포함
            const recentPairings: RackDataPairing[] = selectedAnimal.gender === 'FEMALE'
              ? [...pairings.filter(p => p.femaleId === selectedAnimal.id)]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 2)
              : []
            // 페어 없는 암컷 + 5일 내 단독 산란 → 배란기(메이팅 대기) 표시용
            const orphanWaitingDaysLeft: number | null =
              selectedAnimal.gender === 'FEMALE' &&
              recentPairings.length === 0 &&
              femaleLatestEggDate
                ? Math.max(0, PAIRING_STATE.OVULATION_REST_DAYS - daysBetween(new Date(femaleLatestEggDate), now))
                : null

            // 최근 메이팅 기준 파생 상태 — 메이팅 정보 헤더와 산란 기록 보기 버튼에서 공유
            const primaryActivePairing = recentPairings[0] ?? null
            const primaryActiveDerived: DerivedPairingStatus | null =
              primaryActivePairing && primaryActivePairing.status !== 'DONE'
                ? derivePairingStatus(
                    primaryActivePairing,
                    latestEggLayDateByFemaleId[primaryActivePairing.femaleId] ?? null,
                    now,
                  )
                : null
            const primaryActiveStatusKey: CellStatus | null =
              primaryActiveDerived === 'WAITING' ? 'waiting'
                : primaryActiveDerived === 'MATING' ? 'mating'
                  : primaryActiveDerived === 'LAYING_SOON' ? 'laying_soon'
                    : primaryActiveDerived === 'COOLING' ? 'cooling'
                      : null

            return (
              <>
                <div className="space-y-4 pb-6">
                  {/* 개체 프로필 — 모든 케이스에 노출. 클릭 시 상세 시트 */}
                  {(() => {
                    const referenceDate = selectedAnimal.hatchDate ?? selectedAnimal.acquisitionDate
                    const ageDays = referenceDate ? daysBetween(new Date(referenceDate), now) : null
                    const ageLabel = ageDays !== null
                      ? ageDays >= 365
                        ? `${Math.floor(ageDays / 365)}년 ${Math.floor((ageDays % 365) / 30)}개월`
                        : ageDays >= 30
                          ? `${Math.floor(ageDays / 30)}개월`
                          : `${ageDays}일`
                      : null
                    return (
                      <button
                        type="button"
                        onClick={() => detailSheet.open({ animal: selectedAnimal.id })}
                        className="w-full flex items-center gap-3 text-left rounded-2xl hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 -mx-1 px-1 py-1"
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0 overflow-hidden ${selectedAnimal.gender === 'MALE'
                          ? 'bg-gradient-to-br from-blue-50 to-sky-100 text-blue-400'
                          : 'bg-gradient-to-br from-pink-50 to-rose-100 text-pink-400'
                          }`}>
                          {selectedAnimal.imageUrl ? (
                            <img
                              src={selectedAnimal.imageUrl}
                              alt={selectedAnimal.name ?? (`${selectedAnimal.species ?? ''} ${selectedAnimal.morph ?? ''}`.trim() || '개체 사진')}
                              width={56}
                              height={56}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            selectedAnimal.gender === 'MALE' ? '♂' : '♀'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-base truncate leading-tight">{selectedAnimal.name ?? selectedAnimal.uniqueId}</span>
                            {selectedAnimal.name && (
                              <span className="text-xs text-neutral-400 truncate">{selectedAnimal.uniqueId}</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate mt-0.5">
                            {[selectedAnimal.species, selectedAnimal.morph].filter(Boolean).join(' · ') || '—'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-500 mt-1 tabular-nums">
                            {selectedAnimal.hatchDate ? (
                              <span>해칭 {selectedAnimal.hatchDate.slice(2)}</span>
                            ) : (
                              <span>등록 {selectedAnimal.acquisitionDate.slice(2)}</span>
                            )}
                            {ageLabel && (
                              <>
                                <span className="text-neutral-300">·</span>
                                <span>{ageLabel}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
                      </button>
                    )
                  })()}

                  {/* 페어 없는 암컷 + 최근 단독 산란(5일 내) → 배란기 배너 */}
                  {orphanWaitingDaysLeft !== null && orphanWaitingDaysLeft > 0 && femaleLatestEggDate && (
                    <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-orange-400" aria-hidden="true" />
                        <span className="text-sm font-bold text-orange-900">메이팅 대기 (배란기)</span>
                      </div>
                      <p className="text-sm text-orange-800 leading-relaxed">
                        {femaleLatestEggDate}에 산란이 기록되어 {orphanWaitingDaysLeft}일 뒤 휴식기가 끝납니다.
                      </p>
                    </div>
                  )}

                  {/* 메이팅 시작 (페어 이력 자체가 없을 때만 큰 프라이머리) */}
                  {canCreatePairing && recentPairings.length === 0 && (
                    <Button className="w-full rounded-2xl h-11 gap-2 font-semibold" onClick={openPairingSheet}>
                      <Heart className="h-4.5 w-4.5" />
                      메이팅 시작하기
                    </Button>
                  )}

                  {/* 수컷: 페어링 리스트 (각 암컷의 상태 표시) */}
                  {selectedAnimal.gender === 'MALE' && (() => {
                    const malePairings = pairings.filter(p => p.maleId === selectedAnimal.id)
                    if (malePairings.length === 0) return (
                      <div className="text-center py-6 text-sm text-muted-foreground">페어링 기록이 없습니다</div>
                    )
                    // 같은 암컷에 새 페어가 생긴 이전 페어(씨바꿈)는 상태 계산에서 제외하고 "이전" 라벨로 표시
                    const activePairings = malePairings.filter(p => p.status !== 'DONE' && primaryActivePairingIds.has(p.id))
                    const supersededPairings = malePairings.filter(p => p.status !== 'DONE' && !primaryActivePairingIds.has(p.id))
                    const donePairings = malePairings.filter(p => p.status === 'DONE')
                    return (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">페어링 {malePairings.length}건</div>
                        {[...activePairings, ...supersededPairings, ...donePairings].map(p => {
                          const female = allAnimalsInCells.find(a => a.id === p.femaleId)
                          const femaleName = female?.name ?? female?.uniqueId ?? '-'
                          const femaleMorph = female?.morph
                          const isDone = p.status === 'DONE'
                          const isSuperseded = !isDone && !primaryActivePairingIds.has(p.id)
                          const pDerived = !isDone && !isSuperseded
                            ? derivePairingStatus(p, latestEggLayDateByFemaleId[p.femaleId] ?? null, now)
                            : null
                          const pStatusKey: CellStatus | null = pDerived === 'WAITING' ? 'waiting'
                            : pDerived === 'MATING' ? 'mating'
                              : pDerived === 'LAYING_SOON' ? 'laying_soon'
                                : pDerived === 'COOLING' ? 'cooling'
                                  : null
                          const days = daysBetween(new Date(p.date), now)
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                if (female) detailSheet.open({ animal: female.id })
                              }}
                              className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 w-full text-left hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                            >
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {female?.imageUrl ? (
                                  <img
                                    src={female.imageUrl}
                                    alt={femaleName}
                                    width={40}
                                    height={40}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-pink-400 text-lg">♀</span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold truncate">{femaleName}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {femaleMorph ?? ''}{femaleMorph ? ' · ' : ''}{p.date} · D+{days}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isDone ? (
                                  <span className="text-xs text-muted-foreground">완료</span>
                                ) : isSuperseded ? (
                                  <span className="text-xs text-muted-foreground">이전</span>
                                ) : pDerived ? (
                                  <>
                                    <div className={`w-2 h-2 rounded-full ${pStatusKey ? CELL_STATUS_CONFIG[pStatusKey].dot : 'bg-neutral-300'}`} />
                                    <span className="text-xs font-medium">{DERIVED_STATUS_LABEL[pDerived]}</span>
                                  </>
                                ) : null}
                                <ChevronRight className="h-4 w-4 text-neutral-300" />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {/* 암컷: 통합 메이팅 기록 — 카드 외곽 없이 컴팩트, 한눈에 보기 */}
                  {selectedAnimal.gender === 'FEMALE' && recentPairings.length > 0 && (() => {
                    const primary = primaryActivePairing!
                    const primaryDerived = primaryActiveDerived

                    return (
                      <div className="space-y-3">
                        {/* 헤더: 라벨 + 액션(우측) — 카드 외곽 없음 */}
                        <div className="flex items-start justify-between gap-3 pt-1">
                          <div className="min-w-0">
                            <span className="text-base font-bold text-neutral-900">메이팅 관리</span>
                          </div>
                          <div className="flex items-start gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openPairingEditSheet(primary)}
                              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                              <span className="text-xs font-medium">수정</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePairing(primary.id)}
                              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-neutral-600 hover:text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                              <span className="text-xs font-medium">삭제</span>
                            </button>
                            {canCreatePairing && (
                              <button
                                type="button"
                                onClick={openPairingSheet}
                                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                              >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                <span className="text-xs font-medium">추가</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 페어 행 — 한 줄 = 한 메이팅 (암컷 × 수컷). 이전 메이팅은 흐리게 */}
                        <div className="space-y-1.5">
                          {recentPairings.map((p, idx) => {
                            const isCurrent = idx === 0
                            const elapsed = daysBetween(new Date(p.date), now)
                            return (
                              <div
                                key={p.id}
                                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${
                                  isCurrent ? 'bg-neutral-50' : 'bg-transparent opacity-70'
                                }`}
                              >
                                {/* 페어 라벨 */}
                                <span className={`text-xs font-semibold w-8 shrink-0 ${isCurrent ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                  {isCurrent ? '최근' : '이전'}
                                </span>
                                {/* 암컷 아바타 (페어임을 명시) */}
                                <button
                                  type="button"
                                  onClick={() => detailSheet.open({ animal: selectedAnimal.id })}
                                  aria-label={`${selectedAnimal.name ?? selectedAnimal.uniqueId} 상세`}
                                  className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center shrink-0 overflow-hidden hover:ring-2 hover:ring-neutral-900/10 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30"
                                >
                                  {selectedAnimal.imageUrl ? (
                                    <img src={selectedAnimal.imageUrl} alt="" width={36} height={36} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-pink-400 text-base">♀</span>
                                  )}
                                </button>
                                <span className="text-neutral-300 text-sm shrink-0">×</span>
                                {/* 수컷 아바타 + 정보 */}
                                <button
                                  type="button"
                                  onClick={() => detailSheet.open({ animal: p.male.id })}
                                  className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-lg"
                                >
                                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center shrink-0 overflow-hidden">
                                    {p.male.imageUrl ? (
                                      <img src={p.male.imageUrl} alt={p.male.name ?? p.male.uniqueId} width={36} height={36} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-blue-400 text-base">♂</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1 text-left">
                                    <div className="text-sm font-bold truncate leading-tight">
                                      {p.male.name ?? p.male.uniqueId}
                                      {p.male.morph && (
                                        <span className="ml-1.5 text-sm font-medium text-muted-foreground">{p.male.morph}</span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                                {/* 날짜 + D+N */}
                                <div className="text-sm text-neutral-500 tabular-nums text-right shrink-0">
                                  <div>{p.date.slice(5)}</div>
                                  <div className="font-semibold">D+{elapsed}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* 상태 안내 한 줄 (최근 메이팅 기준) */}
                        {primaryDerived && (() => {
                          const hint = (() => {
                            if (primaryDerived === 'WAITING') {
                              if (primary.endScheduledAt) {
                                const endAt = new Date(primary.endScheduledAt)
                                const daysLeft = Math.max(0, Math.ceil((endAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                                return { tone: 'orange' as const, text: `무정란이 등록되어 ${daysLeft}일 뒤 시즌이 자동 종료됩니다.` }
                              }
                              return { tone: 'orange' as const, text: '마지막 산란 후 5일간은 휴식기(배란기)이며, 이후 다시 산란 중으로 돌아갑니다.' }
                            }
                            if (primaryDerived === 'MATING') {
                              return { tone: 'violet' as const, text: '마지막 산란일로부터 25일이 지나면 산란 임박으로, 90일이 지나면 쿨링으로 자동 전환됩니다.' }
                            }
                            if (primaryDerived === 'LAYING_SOON') {
                              return { tone: 'red' as const, text: '마지막 산란일로부터 90일이 지나도 산란이 없으면 쿨링으로 자동 전환됩니다.' }
                            }
                            return { tone: 'sky' as const, text: '무정란을 산란 등록하면 5일 뒤 시즌이 자동 종료됩니다.' }
                          })()
                          const toneClasses = {
                            orange: 'border-orange-200 bg-orange-50/80 text-orange-900',
                            violet: 'border-violet-200 bg-violet-50/80 text-violet-900',
                            red: 'border-red-200 bg-red-50/80 text-red-900',
                            sky: 'border-sky-200 bg-sky-50/80 text-sky-900',
                          }[hint.tone]
                          return (
                            <div className={`rounded-xl border ${toneClasses} px-3 py-2 text-sm leading-relaxed`}>
                              {hint.text}
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })()}

                  {/* 액션 버튼 — 동일 셸(좌측 아이콘 컨테이너 + 좌측 라벨), 색상으로만 차별화 */}

                  {/* 산란 등록 — 보라 톤 강조 (프라이머리) */}
                  {canRegisterEgg && (
                    <button
                      onClick={openEggSheet}
                      className="w-full flex items-center justify-between rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 hover:bg-violet-100 hover:border-violet-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
                          <Egg className="h-4 w-4 text-white" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-bold text-violet-700">산란 등록</span>
                      </div>
                    </button>
                  )}

                  {/* 산란 기록 보기 — 네비게이션 (우측 화살표) */}
                  {selectedAnimal.gender === 'FEMALE' && (
                    <button
                      onClick={openLayingHistory}
                      className="w-full flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                          <Egg className="h-4 w-4 text-violet-600" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-semibold">산란 기록 보기</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {recentPairings.length > 0 && (
                          primaryActiveDerived ? (
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${primaryActiveStatusKey ? CELL_STATUS_CONFIG[primaryActiveStatusKey].dot : 'bg-neutral-300'}`} />
                              <span className={`text-sm font-semibold ${primaryActiveStatusKey ? CELL_STATUS_CONFIG[primaryActiveStatusKey].text : 'text-neutral-700'}`}>
                                {DERIVED_STATUS_LABEL[primaryActiveDerived]}
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-muted-foreground">시즌 완료</span>
                          )
                        )}
                        <ChevronRight className="h-4 w-4 text-neutral-300" />
                      </div>
                    </button>
                  )}

                  {/* 메이팅 기록 보기 — 해당 암컷의 전체 페어링 */}
                  {selectedAnimal.gender === 'FEMALE' && (() => {
                    const totalPairings = pairings.filter(p => p.femaleId === selectedAnimal.id).length
                    return (
                      <button
                        onClick={openPairingHistory}
                        className="w-full flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
                            <Heart className="h-4 w-4 text-pink-600" aria-hidden="true" />
                          </div>
                          <span className="text-sm font-semibold">메이팅 기록 보기</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {totalPairings > 0 && (
                            <span className="text-sm font-semibold text-muted-foreground tabular-nums">{totalPairings}건</span>
                          )}
                          <ChevronRight className="h-4 w-4 text-neutral-300" />
                        </div>
                      </button>
                    )
                  })()}

                  {/* 시즌 종료 (쿨링 진입) — 빨강 액센트 */}
                  {selectedAnimal.gender === 'FEMALE' && selectedPairing && derivedStatus !== null && (
                    <button
                      onClick={() => handleEndPairing(selectedPairing.id)}
                      disabled={isPending}
                      className="w-full flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 hover:bg-red-50 hover:border-red-100 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                          <Snowflake className="h-4 w-4 text-red-500" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-semibold">시즌 종료 (쿨링 진입)</span>
                      </div>
                    </button>
                  )}

                  {/* 렉사에서 빼기 — 빨강 액센트 */}
                  <button
                    onClick={handleUnassignCell}
                    disabled={isPending}
                    className="w-full flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 hover:bg-red-50 hover:border-red-100 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                        {isPending ? <Loader2 className="h-4 w-4 text-red-500 animate-spin" /> : <LogOut className="h-4 w-4 text-red-500" aria-hidden="true" />}
                      </div>
                      <span className="text-sm font-semibold">렉사에서 빼기</span>
                    </div>
                  </button>
                </div>
              </>
            )
          })()}

          {/* === 페어링 등록 === */}
          {sheetMode === 'pairing' && selectedAnimal && (
            <>
              <div className="flex flex-col gap-5 pb-6">
                <div className="flex flex-col gap-2.5">
                  <label htmlFor={id('male-search')} className="text-sm font-semibold">수컷 선택</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <Input
                        id={id('male-search')}
                        name="maleSearch"
                        type="search"
                        autoComplete="off"
                        spellCheck={false}
                        value={maleSearch}
                        onChange={(e) => setMaleSearch(e.target.value)}
                        placeholder="이름, ID, 종, 모프 검색…"
                        className="rounded-xl pl-9"
                      />
                    </div>
                    <button
                      onClick={() => setQrScannerOpen(true)}
                      aria-label="QR 스캔"
                      className="shrink-0 w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-1"
                    >
                      <ScanLine className="h-4.5 w-4.5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground px-1">
                    브리딩 수컷 {allBreedingMales.length}마리
                    {maleSearch.trim() && (() => {
                      const q = maleSearch.trim().toLowerCase()
                      const cnt = allBreedingMales.filter(a =>
                        (a.name?.toLowerCase().includes(q)) ||
                        a.uniqueId.toLowerCase().includes(q) ||
                        (a.species?.toLowerCase().includes(q)) ||
                        (a.morph?.toLowerCase().includes(q))
                      ).length
                      return ` · 검색 결과 ${cnt}마리`
                    })()}
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const q = maleSearch.trim().toLowerCase()
                      const filtered = q
                        ? allBreedingMales.filter(a =>
                          (a.name?.toLowerCase().includes(q)) ||
                          a.uniqueId.toLowerCase().includes(q) ||
                          (a.species?.toLowerCase().includes(q)) ||
                          (a.morph?.toLowerCase().includes(q))
                        )
                        : allBreedingMales
                      return filtered.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          {q ? '검색 결과가 없습니다' : '브리딩 수컷이 없습니다'}
                        </div>
                      ) : (
                        filtered.map(animal => (
                          <AnimalSelectCard
                            key={animal.id}
                            animal={animal}
                            selected={selectedMaleId === animal.id}
                            onToggle={() => selectMale(animal.id)}
                          />
                        ))
                      )
                    })()}
                  </div>
                </div>

                <div className="space-y-3 shrink-0">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">메이팅 날짜</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full rounded-xl h-10 justify-start text-left font-normal',
                            !pairingDate && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {pairingDate
                            ? format(parse(pairingDate, 'yyyy-MM-dd', new Date()), 'yyyy년 M월 d일 (EEE)', { locale: ko })
                            : '날짜 선택'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          startMonth={new Date(new Date().getFullYear() - 5, 0)}
                          endMonth={new Date(new Date().getFullYear() + 5, 11)}
                          selected={pairingDate ? parse(pairingDate, 'yyyy-MM-dd', new Date()) : undefined}
                          onSelect={(date) => {
                            if (date) setPairingDate(format(date, 'yyyy-MM-dd'))
                          }}
                          locale={ko}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={id('pairing-memo')} className="text-sm font-semibold">메모</label>
                    <Textarea
                      id={id('pairing-memo')}
                      name="pairingMemo"
                      autoComplete="off"
                      value={pairingMemo}
                      onChange={(e) => setPairingMemo(e.target.value)}
                      placeholder="특이사항, 쿨링 기간 등…"
                      className="min-h-[60px] rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  className="w-full rounded-2xl h-11 shrink-0"
                  disabled={!selectedMaleId || isPending}
                  onClick={handleCreatePairing}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '메이팅 등록'}
                </Button>
              </div>
            </>
          )}

          {/* === 페어링 수정 === */}
          {sheetMode === 'pairing-edit' && selectedAnimal && pairingEditId && (
            <>
              <div className="space-y-5 pb-6">
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-2 text-[11px] text-muted-foreground">
                  수컷은 수정할 수 없습니다. 수컷을 바꾸려면 메이팅을 삭제하고 새로 등록해주세요.
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">메이팅 날짜</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full rounded-xl h-10 justify-start text-left font-normal',
                          !pairingEditDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {pairingEditDate
                          ? format(parse(pairingEditDate, 'yyyy-MM-dd', new Date()), 'yyyy년 M월 d일 (EEE)', { locale: ko })
                          : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        startMonth={new Date(new Date().getFullYear() - 5, 0)}
                        endMonth={new Date(new Date().getFullYear() + 5, 11)}
                        selected={pairingEditDate ? parse(pairingEditDate, 'yyyy-MM-dd', new Date()) : undefined}
                        onSelect={(date) => {
                          if (date) setPairingEditDate(format(date, 'yyyy-MM-dd'))
                        }}
                        disabled={pairingEditFirstLayDate
                          ? { after: parse(pairingEditFirstLayDate, 'yyyy-MM-dd', new Date()) }
                          : undefined}
                        locale={ko}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {pairingEditFirstLayDate && (
                    <p className="text-[11px] text-muted-foreground px-1">
                      최초 산란일({pairingEditFirstLayDate}) 이전으로만 설정 가능합니다.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={id('pairing-edit-memo')} className="text-sm font-semibold">메모</label>
                  <Textarea
                    id={id('pairing-edit-memo')}
                    name="pairingEditMemo"
                    autoComplete="off"
                    value={pairingEditMemo}
                    onChange={(e) => setPairingEditMemo(e.target.value)}
                    placeholder="특이사항, 쿨링 기간 등…"
                    className="min-h-[60px] rounded-xl"
                  />
                </div>

                <Button
                  className="w-full rounded-2xl h-11"
                  disabled={!pairingEditDate || isPending}
                  onClick={handleUpdatePairing}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '수정 완료'}
                </Button>

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm text-neutral-400 hover:text-red-500 hover:bg-red-50/50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                  disabled={isPending}
                  onClick={() => handleDeletePairing(pairingEditId)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  메이팅 삭제
                </button>
              </div>
            </>
          )}

          {/* === 산란 등록 === */}
          {sheetMode === 'egg' && selectedAnimal && (
            <>
              <div className="space-y-5 pb-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">산란일</label>
                  <Popover open={eggDateOpen} onOpenChange={setEggDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full rounded-xl h-10 justify-start text-left font-normal',
                          !eggLayDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eggLayDate
                          ? format(parse(eggLayDate, 'yyyy-MM-dd', new Date()), 'yyyy년 M월 d일 (EEE)', { locale: ko })
                          : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      {(() => {
                        // 선택된 페어링 중 가장 늦은 메이팅 날짜 = 산란 가능 최소 날짜
                        // 페어가 없으면 제한 없음
                        const selectedPairings = eggPairingIds
                          .filter(Boolean)
                          .map(id => femalePairingsForEgg.find(p => p.id === id))
                          .filter((p): p is NonNullable<typeof p> => Boolean(p))
                        const anchorPairings = selectedPairings.length > 0
                          ? selectedPairings
                          : (eggTargetPairing ? [eggTargetPairing] : [])
                        const minLayDate = anchorPairings.length > 0
                          ? anchorPairings.reduce((max, p) => (p.date > max ? p.date : max), anchorPairings[0].date)
                          : null
                        return (
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            startMonth={new Date(new Date().getFullYear() - 5, 0)}
                            endMonth={new Date(new Date().getFullYear() + 5, 11)}
                            selected={eggLayDate ? parse(eggLayDate, 'yyyy-MM-dd', new Date()) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setEggLayDate(format(date, 'yyyy-MM-dd'))
                                setEggDateOpen(false)
                              }
                            }}
                            disabled={minLayDate ? { before: parse(minLayDate, 'yyyy-MM-dd', new Date()) } : undefined}
                            locale={ko}
                            initialFocus
                          />
                        )
                      })()}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 페어링 × 개수 (최대 2개까지 선택) — 페어가 있을 때만 노출 */}
                {femalePairingsForEgg.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-3 text-xs text-neutral-600">
                    메이팅 기록이 없습니다. <span className="font-semibold">페어 없이 무정란으로 기록</span>됩니다.
                  </div>
                ) : eggPairingIds.length === 0 ? (
                  <div className="space-y-2">
                    <span className="text-sm font-semibold block">메이팅 선택</span>
                    <button
                      type="button"
                      onClick={() => setEggPairingIds([''])}
                      className="w-full rounded-xl border-2 border-dashed border-neutral-200 py-2.5 text-xs font-semibold text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      + 메이팅 연결 (선택)
                    </button>
                    <p className="text-[11px] text-muted-foreground px-1">
                      연결하지 않으면 페어 없는 무정란 기록으로 저장됩니다.
                    </p>
                  </div>
                ) : (
                <div className="space-y-2">
                  <span className="text-sm font-semibold block">
                    메이팅 <span className="text-muted-foreground font-normal">(최대 2개)</span>
                  </span>
                  {eggPairingIds.map((pairingId, idx) => {
                    // 이미 다른 슬롯에서 선택된 페어링은 후보에서 제외 (현재 값은 유지)
                    const otherSelected = new Set(
                      eggPairingIds.filter((_, i) => i !== idx).filter(Boolean),
                    )
                    const options = femalePairingsForEgg.filter(
                      p => p.id === pairingId || !otherSelected.has(p.id),
                    )
                    return (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="flex-1">
                          <Select
                            value={pairingId || undefined}
                            onValueChange={(value) => {
                              const next = [...eggPairingIds]
                              next[idx] = value
                              setEggPairingIds(next)
                            }}
                          >
                            <SelectTrigger className="w-full rounded-xl bg-white h-11 text-sm font-medium">
                              <SelectValue placeholder="메이팅 선택…" />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.male.name ?? p.male.uniqueId} · {p.date}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {eggPairingIds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEggPairingIds(eggPairingIds.filter((_, i) => i !== idx))}
                            aria-label="메이팅 제거"
                            className="shrink-0 w-11 h-11 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {eggPairingIds.length < 2 && femalePairingsForEgg.length > eggPairingIds.length && (
                    <button
                      type="button"
                      onClick={() => setEggPairingIds([...eggPairingIds, ''])}
                      className="w-full rounded-xl border-2 border-dashed border-neutral-200 py-2.5 text-xs font-semibold text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    >
                      + 이전 메이팅 기록 추가
                    </button>
                  )}
                </div>
                )}

                {/* 유정/무정 수량 동시 입력 */}
                <div className="space-y-1.5" role="group" aria-label="알 개수">
                  <span className="text-sm font-semibold block">알 개수 (유정 + 무정)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor={id('egg-fertile-count')} className="text-xs text-muted-foreground px-0.5">유정란</label>
                      <Input
                        id={id('egg-fertile-count')}
                        name="eggFertileCount"
                        type="number"
                        inputMode="numeric"
                        autoComplete="off"
                        value={eggFertileCount}
                        onChange={(e) => setEggFertileCount(e.target.value)}
                        min={0}
                        max={4}
                        placeholder="0"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor={id('egg-infertile-count')} className="text-xs text-muted-foreground px-0.5">무정란</label>
                      <Input
                        id={id('egg-infertile-count')}
                        name="eggInfertileCount"
                        type="number"
                        inputMode="numeric"
                        autoComplete="off"
                        value={eggInfertileCount}
                        onChange={(e) => setEggInfertileCount(e.target.value)}
                        min={0}
                        max={4}
                        placeholder="0"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  {parseInt(eggInfertileCount) > 0 && (
                    <p className="text-[11px] text-muted-foreground px-1">
                      무정란은 인큐에 들어가지 않고 기록으로만 남습니다.
                      {selectedDerivedStatus === 'COOLING' && ' 쿨링 상태에서 등록하면 5일 후 시즌이 자동 종료됩니다.'}
                    </p>
                  )}
                </div>

                {/* 인큐 온도 — 유정란이 1개 이상일 때만 노출 */}
                {parseInt(eggFertileCount) > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor={id('egg-temp')} className="text-sm font-semibold flex items-center gap-1.5">
                        <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
                        인큐 온도
                      </label>
                      <span className="text-lg font-bold tabular-nums">{parseFloat(eggTemp).toFixed(1)}°C</span>
                    </div>
                    <input
                      id={id('egg-temp')}
                      name="eggTemp"
                      type="range"
                      min={20}
                      max={28}
                      step={0.5}
                      value={eggTemp}
                      onChange={(e) => setEggTemp(e.target.value)}
                      aria-label="인큐 온도"
                      aria-valuetext={`${parseFloat(eggTemp).toFixed(1)}도${tempRange ? `, 예상 부화 ${tempRange.min}~${tempRange.max}일` : ''}`}
                      className="w-full accent-neutral-900 h-2 rounded-full appearance-none bg-neutral-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                      <span>20°C</span>
                      {tempRange && <span>예상 부화: {tempRange.min}~{tempRange.max}일 · {tempRange.label}</span>}
                      <span>28°C</span>
                    </div>
                  </div>
                )}

                {parseInt(eggFertileCount) > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor={id('egg-humidity')} className="text-sm font-semibold">습도 (%)</label>
                      <Input
                        id={id('egg-humidity')}
                        name="eggHumidity"
                        type="number"
                        inputMode="numeric"
                        autoComplete="off"
                        value={eggHumidity}
                        onChange={(e) => setEggHumidity(e.target.value)}
                        placeholder="80"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={id('egg-substrate')} className="text-sm font-semibold">바닥재</label>
                      <Input
                        id={id('egg-substrate')}
                        name="eggSubstrate"
                        autoComplete="off"
                        value={eggSubstrate}
                        onChange={(e) => setEggSubstrate(e.target.value)}
                        placeholder="해치라이트"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor={id('egg-memo')} className="text-sm font-semibold">메모</label>
                  <Textarea
                    id={id('egg-memo')}
                    name="eggMemo"
                    autoComplete="off"
                    value={eggMemo}
                    onChange={(e) => setEggMemo(e.target.value)}
                    placeholder="알 상태, 무게 등…"
                    className="min-h-[60px] rounded-xl"
                  />
                </div>

                {/* 산란일 < 메이팅일 경고 */}
                {(() => {
                  if (!eggLayDate) return null
                  const selectedPairings = eggPairingIds
                    .filter(Boolean)
                    .map(id => femalePairingsForEgg.find(p => p.id === id))
                    .filter(Boolean)
                  const tooEarly = selectedPairings.some(p => eggLayDate < p!.date)
                  if (!tooEarly) return null
                  return (
                    <p className="text-sm text-red-500">산란일이 메이팅 날짜보다 이전입니다.</p>
                  )
                })()}

                <Button
                  className="w-full rounded-2xl h-11"
                  disabled={
                    !eggLayDate ||
                    ((parseInt(eggFertileCount) || 0) + (parseInt(eggInfertileCount) || 0) < 1) ||
                    (parseInt(eggFertileCount) > 0 && !eggTemp) ||
                    isPending ||
                    eggPairingIds.filter(Boolean).some(id => {
                      const p = femalePairingsForEgg.find(pp => pp.id === id)
                      return p && eggLayDate < p.date
                    })
                  }
                  onClick={handleCreateEggs}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '산란 등록'}
                </Button>
              </div>
            </>
          )}
          </div>
          )}

          {/* === 산란 기록 === */}
          {sheetMode === 'laying-history' && selectedAnimal && (
            <div className={`flex flex-col flex-1 min-h-0 px-5 ${isMobile ? 'pt-2' : 'pt-4'}`}>
              {/* 고정 영역: 셀렉트 + 요약 + 테이블 헤더 */}
              <div className="shrink-0">
                {layingHistoryLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : layingHistoryPairings.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-20 text-center">메이팅 기록이 없습니다.</div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {/* 페어 선택 */}
                    {layingHistoryPairings.length > 1 && (
                      <Select
                        value={selectedHistoryPairingId}
                        onValueChange={setSelectedHistoryPairingId}
                      >
                        <SelectTrigger className="w-full rounded-xl bg-white h-11 text-sm font-medium">
                          <SelectValue placeholder="메이팅 선택…" />
                        </SelectTrigger>
                        <SelectContent>
                          {layingHistoryPairings.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.date} · {p.partnerNames.join(', ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* 선택된 페어링 요약 */}
                    {(() => {
                      const pairing = layingHistoryPairings.find(p => p.id === selectedHistoryPairingId)
                      if (!pairing) return null
                      const statusLabel: Record<string, string> = {
                        WAITING: '대기', MATING: '메이팅', LAYING_SOON: '산란임박',
                        LAID: '산란', DONE: '완료', COOLING: '쿨링',
                      }
                      const statusColor: Record<string, string> = {
                        WAITING: 'bg-orange-50 text-orange-600',
                        MATING: 'bg-violet-50 text-violet-600',
                        LAYING_SOON: 'bg-red-50 text-red-600',
                        LAID: 'bg-violet-50 text-violet-600',
                        DONE: 'bg-green-50 text-green-700',
                        COOLING: 'bg-sky-50 text-sky-600',
                      }
                      // 같은 암컷에 더 최신 활성 페어가 있는 경우(씨바꿈 — 시즌종료 미실행) "이전"으로 표기해 메이팅 오해 방지
                      const isSuperseded =
                        !pairing.id.startsWith('orphan-') &&
                        pairing.status !== 'DONE' &&
                        !primaryActivePairingIds.has(pairing.id)
                      const eggSummary = pairing.eggs.length > 0 ? {
                        total: pairing.eggs.length,
                        fertile: pairing.eggs.filter(e => e.fertileStatus === 'FERTILE').length,
                        hatched: pairing.eggs.filter(e => e.status === 'HATCHED').length,
                        // 무정란은 status=FAILED지만 '무정'으로만 표시 (실패 배지 중복 방지)
                        failed: pairing.eggs.filter(e => e.status === 'FAILED' && e.fertileStatus !== 'INFERTILE').length,
                      } : null

                      const isOrphan = pairing.id.startsWith('orphan-')
                      return (
                        <div className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm font-medium">{pairing.date}</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              {pairing.partnerNames.map((name, i) => (
                                <span key={i} className="text-sm truncate">
                                  {name}
                                  {pairing.partnerMorphs[i] && (
                                    <span className="text-xs text-muted-foreground ml-1">({pairing.partnerMorphs[i]})</span>
                                  )}
                                  {i < pairing.partnerNames.length - 1 && <span className="text-muted-foreground">, </span>}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${isSuperseded ? 'bg-neutral-100 text-neutral-600' : (statusColor[pairing.status] ?? 'bg-neutral-100 text-neutral-600')}`}>
                                {isSuperseded ? '이전' : (statusLabel[pairing.status] ?? pairing.status)}
                              </span>
                              {!isOrphan && (
                                <button
                                  type="button"
                                  aria-label="메이팅 수정"
                                  onClick={() => openPairingEditFor({
                                    id: pairing.id,
                                    date: pairing.date,
                                    memo: pairing.memo,
                                    eggLayDates: pairing.eggs.map(e => e.layDate),
                                    returnTo: 'laying-history',
                                  })}
                                  className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                                >
                                  <Pencil className="h-3 w-3" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </div>
                          {eggSummary && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>산란 {eggSummary.total}개</span>
                              {eggSummary.fertile > 0 && <span className="text-green-600">유정 {eggSummary.fertile}</span>}
                              {eggSummary.hatched > 0 && <span className="text-green-700">부화 {eggSummary.hatched}</span>}
                              {eggSummary.failed > 0 && <span className="text-red-500">실패 {eggSummary.failed}</span>}
                            </div>
                          )}
                          {pairing.memo && (
                            <p className="text-xs text-muted-foreground">{pairing.memo}</p>
                          )}
                        </div>
                      )
                    })()}

                    {/* 라벨 다운로드 버튼 */}
                    {(() => {
                      const pairing = layingHistoryPairings.find(p => p.id === selectedHistoryPairingId)
                      if (!pairing || pairing.eggs.length === 0) return null
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={() => {
                            const clutches = pairing.eggs.reduce<Record<string, typeof pairing.eggs>>((acc, egg) => {
                              if (!acc[egg.layDate]) acc[egg.layDate] = []
                              acc[egg.layDate].push(egg)
                              return acc
                            }, {})
                            const clutchEntries = Object.entries(clutches).sort(([a], [b]) => a.localeCompare(b))
                            setPairingLabelData({
                              femaleName: selectedAnimal!.name ?? selectedAnimal!.uniqueId,
                              maleName: pairing.partnerNames[0] ?? '-',
                              species: selectedAnimal!.species ?? '',
                              femaleMorph: selectedAnimal!.morph ?? '-',
                              maleMorph: pairing.partnerMorphs[0] ?? '',
                              matingDate: pairing.date,
                              clutches: clutchEntries.map(([layDate, eggs], idx) => ({
                                index: idx + 1,
                                layDate,
                                count: eggs.length,
                                fertile: eggs.filter(e => e.fertileStatus === 'FERTILE').length,
                                infertile: eggs.filter(e => e.fertileStatus === 'INFERTILE').length,
                                unknown: eggs.filter(e => e.fertileStatus === 'UNKNOWN').length,
                              })),
                            })
                            setPairingLabelOpen(true)
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          라벨 다운로드
                        </Button>
                      )
                    })()}

                    {/* 테이블 헤더 */}
                    <div className="grid grid-cols-[36px_1fr_36px_1fr_28px] items-center px-3 py-2 bg-neutral-50 rounded-t-xl border border-neutral-100 border-b-0">
                      <span className="text-xs font-medium text-muted-foreground">차수</span>
                      <span className="text-xs font-medium text-muted-foreground">산란일</span>
                      <span className="text-xs font-medium text-muted-foreground text-center">수량</span>
                      <span className="text-xs font-medium text-muted-foreground pl-2">상태</span>
                      <span className="sr-only">삭제</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 스크롤 영역: 데이터 행 */}
              {!layingHistoryLoading && layingHistoryPairings.length > 0 && (() => {
                const pairing = layingHistoryPairings.find(p => p.id === selectedHistoryPairingId)
                if (!pairing) return null
                const clutches = pairing.eggs.reduce<Record<string, typeof pairing.eggs>>((acc, egg) => {
                  if (!acc[egg.layDate]) acc[egg.layDate] = []
                  acc[egg.layDate].push(egg)
                  return acc
                }, {})
                const clutchEntries = Object.entries(clutches).sort(([a], [b]) => a.localeCompare(b))

                return (
                  <div className="flex-1 min-h-0 overflow-y-auto border border-neutral-100 rounded-b-xl">
                    {clutchEntries.length === 0 ? (
                      <div className="text-center py-12 text-sm text-muted-foreground">아직 산란 기록이 없습니다</div>
                    ) : (
                      <div className="divide-y divide-neutral-50">
                        {clutchEntries.map(([layDate, eggs], clutchIdx) => {
                          const incubating = eggs.filter(e => e.status === 'INCUBATING').length
                          const hatched = eggs.filter(e => e.status === 'HATCHED').length
                          // 무정란은 '무정' 배지로만 표시하고 '실패' 배지에서는 제외 (중복 방지)
                          const failed = eggs.filter(e => e.status === 'FAILED' && e.fertileStatus !== 'INFERTILE').length
                          const fertile = eggs.filter(e => e.fertileStatus === 'FERTILE').length
                          const infertile = eggs.filter(e => e.fertileStatus === 'INFERTILE').length
                          const unknown = eggs.filter(e => e.fertileStatus === 'UNKNOWN').length
                          const clutchHasHatched = eggs.some(e => e.status === 'HATCHED')
                          return (
                            <div key={layDate} className="grid grid-cols-[36px_1fr_36px_1fr_28px] items-center px-3 py-3">
                              <span className="text-sm font-medium">{clutchIdx + 1}차</span>
                              <span className="text-sm text-muted-foreground">{layDate}</span>
                              <span className="text-sm text-center">{eggs.length}</span>
                              <div className="flex items-center gap-1 flex-wrap pl-2">
                                {fertile > 0 && (
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">유정{fertile}</span>
                                )}
                                {infertile > 0 && (
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-600">무정{infertile}</span>
                                )}
                                {unknown > 0 && (
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-muted-foreground">미확인{unknown}</span>
                                )}
                                {incubating > 0 && (
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">인큐{incubating}</span>
                                )}
                                {hatched > 0 && (
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">부화{hatched}</span>
                                )}
                                {failed > 0 && (
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">실패{failed}</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteClutch(pairing.id, layDate)}
                                disabled={isPending || clutchHasHatched}
                                aria-label={`${layDate} 산란 삭제`}
                                title={clutchHasHatched ? '부화 개체가 있는 산란은 삭제할 수 없습니다' : '산란 삭제'}
                                className="shrink-0 w-7 h-7 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* 하단 고정: 페어링 삭제 (파괴적 액션은 헤더 우상단보다 화면 아래쪽이 더 안전) */}
              {selectedHistoryPairingId && !selectedHistoryPairingId.startsWith('orphan-') && (
                <div className="shrink-0 pt-3 pb-6">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm text-neutral-400 hover:text-red-500 hover:bg-red-50/50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                    disabled={isPending}
                    onClick={() => handleDeletePairing(selectedHistoryPairingId)}
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    메이팅 삭제
                  </button>
                </div>
              )}
            </div>
          )}

          {/* === 메이팅 기록 === 전체 페어링 리스트 */}
          {sheetMode === 'pairing-history' && selectedAnimal && (
            <div className={`flex flex-col flex-1 min-h-0 px-5 ${isMobile ? 'pt-2' : 'pt-4'}`}>
              {pairingHistoryLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (() => {
                // orphan(페어 없이 기록) 항목은 제외하고 페어링만 표시
                const matingRecords = layingHistoryPairings.filter(p => !p.id.startsWith('orphan-'))
                if (matingRecords.length === 0) {
                  return (
                    <div className="text-sm text-muted-foreground py-20 text-center">메이팅 기록이 없습니다.</div>
                  )
                }
                const statusLabel: Record<string, string> = {
                  WAITING: '대기', MATING: '메이팅', LAYING_SOON: '산란임박',
                  LAID: '산란', DONE: '완료', COOLING: '쿨링',
                }
                const statusColor: Record<string, string> = {
                  WAITING: 'bg-orange-50 text-orange-600',
                  MATING: 'bg-violet-50 text-violet-600',
                  LAYING_SOON: 'bg-red-50 text-red-600',
                  LAID: 'bg-violet-50 text-violet-600',
                  DONE: 'bg-green-50 text-green-700',
                  COOLING: 'bg-sky-50 text-sky-600',
                }
                return (
                  <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pt-2 pb-6">
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                      총 {matingRecords.length}건
                    </div>
                    <div className="space-y-2">
                      {matingRecords.map(pairing => {
                        const isCurrent = primaryActivePairingIds.has(pairing.id)
                        const fertile = pairing.eggs.filter(e => e.fertileStatus === 'FERTILE').length
                        const hatched = pairing.eggs.filter(e => e.status === 'HATCHED').length
                        const partnerName = pairing.partnerNames[0] ?? '-'
                        const partnerMorph = pairing.partnerMorphs[0] ?? ''
                        const maleImageUrl = pairings.find(p => p.id === pairing.id)?.male.imageUrl ?? null
                        return (
                          <div
                            key={pairing.id}
                            className="rounded-2xl border border-neutral-100 bg-neutral-50/60 px-3 py-3 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center shrink-0 overflow-hidden">
                                  {maleImageUrl ? (
                                    <img
                                      src={maleImageUrl}
                                      alt={partnerName}
                                      width={64}
                                      height={64}
                                      loading="lazy"
                                      decoding="async"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-blue-400 text-2xl">♂</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-bold truncate leading-tight">
                                    {partnerName}
                                    {partnerMorph && (
                                      <span className="ml-1.5 text-sm font-medium text-muted-foreground">{partnerMorph}</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                                    {pairing.date}
                                  </div>
                                </div>
                              </div>
                              {isCurrent && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${statusColor[pairing.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                                    {statusLabel[pairing.status] ?? pairing.status}
                                  </span>
                                </div>
                              )}
                            </div>
                            {pairing.eggs.length > 0 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-[76px]">
                                <span>산란 {pairing.eggs.length}개</span>
                                {fertile > 0 && <span className="text-green-600">유정 {fertile}</span>}
                                {hatched > 0 && <span className="text-green-700">부화 {hatched}</span>}
                              </div>
                            )}
                            {pairing.memo && (
                              <p className="text-xs text-muted-foreground pl-[76px]">{pairing.memo}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* === 빈 칸 개체 배정 === 전용 flex 컨테이너: 개체 목록이 시트 바닥까지 차게 */}
          {sheetMode === 'assign' && selectedCell && (() => {
            const q = assignSearch.trim().toLowerCase()
            const filtered = q
              ? unassignedAnimals.filter(a =>
                (a.name?.toLowerCase().includes(q)) ||
                a.uniqueId.toLowerCase().includes(q) ||
                (a.species?.toLowerCase().includes(q)) ||
                (a.morph?.toLowerCase().includes(q))
              )
              : unassignedAnimals
            return (
              <div className={`flex flex-col flex-1 min-h-0 px-5 ${isMobile ? 'pt-2' : 'pt-4'}`}>
                {/* 검색 + QR */}
                <div className="shrink-0 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id={id('assign-search')}
                      name="assignSearch"
                      type="search"
                      autoComplete="off"
                      spellCheck={false}
                      aria-label="개체 검색"
                      value={assignSearch}
                      onChange={(e) => setAssignSearch(e.target.value)}
                      placeholder="이름, ID, 종, 모프 검색…"
                      className="rounded-xl pl-9"
                      autoFocus={!isMobile}
                    />
                  </div>
                  <button
                    onClick={() => setQrScannerOpen(true)}
                    aria-label="QR 스캔"
                    className="shrink-0 w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-1"
                  >
                    <ScanLine className="h-4.5 w-4.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="shrink-0 text-xs text-muted-foreground px-1 mt-3 mb-3">
                  브리딩 대상 중 미배정 {unassignedAnimals.length}마리
                  {q && ` · 검색 결과 ${filtered.length}마리`}
                </div>

                {/* 개체 목록 */}
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {q ? '검색 결과가 없습니다' : '배정 가능한 개체가 없습니다'}
                  </div>
                ) : (
                  <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-6">
                    <div className="space-y-2">
                      {filtered.map(animal => (
                        <button
                          key={animal.id}
                          onClick={() => handleAssignAnimal(animal.id)}
                          disabled={isPending}
                          className="flex items-center gap-3 w-full rounded-2xl border-2 border-neutral-200 hover:border-neutral-400 p-3 text-left transition-[border-color,transform] active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${animal.gender === 'MALE'
                            ? 'bg-gradient-to-br from-blue-50 to-sky-100'
                            : 'bg-gradient-to-br from-pink-50 to-rose-100'
                            }`}>
                            {animal.imageUrl ? (
                              <img
                                src={animal.imageUrl}
                                alt={animal.name ?? '개체 사진'}
                                width={40}
                                height={40}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className={animal.gender === 'MALE' ? 'text-blue-400 text-lg' : 'text-pink-400 text-lg'}>
                                {animal.gender === 'MALE' ? '♂' : '♀'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold truncate">{animal.name ?? animal.uniqueId}</span>
                              {animal.name && (
                                <span className="text-xs text-muted-foreground shrink-0">{animal.uniqueId}</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {[animal.species, animal.morph].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* 두 번째 스크롤 컨테이너 (zone-* / rack-*) */}
          {(sheetMode === 'zone-create' || sheetMode === 'zone-edit' || sheetMode === 'rack-create' || sheetMode === 'rack-edit') && (
          <div className={`no-scrollbar flex-1 overflow-y-auto px-5 ${isMobile ? 'pt-2' : 'pt-4'}`}>
          {/* === 구역 추가 === */}
          {sheetMode === 'zone-create' && (
            <>
              <div className="space-y-5 pb-6">
                <div className="space-y-1.5">
                  <label htmlFor={id('zone-name-create')} className="text-sm font-semibold">구역 이름</label>
                  <Input
                    id={id('zone-name-create')}
                    name="zoneName"
                    autoComplete="off"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="A, B, 1층…"
                    className="rounded-xl"
                    autoFocus={!isMobile}
                  />
                </div>
                <Button
                  className="w-full rounded-2xl h-11"
                  disabled={!zoneName.trim() || isPending}
                  onClick={handleCreateZone}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '구역 추가'}
                </Button>
              </div>
            </>
          )}

          {/* === 구역 수정 === */}
          {sheetMode === 'zone-edit' && editingZoneId && (
            <>
              <div className="space-y-5 pb-6">
                <div className="space-y-1.5">
                  <label htmlFor={id('zone-name-edit')} className="text-sm font-semibold">구역 이름</label>
                  <Input
                    id={id('zone-name-edit')}
                    name="zoneName"
                    autoComplete="off"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    className="rounded-xl"
                    autoFocus={!isMobile}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl h-11 gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                    disabled={isPending}
                    onClick={handleDeleteZone}
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </Button>
                  <Button
                    className="flex-1 rounded-2xl h-11"
                    disabled={!zoneName.trim() || isPending}
                    onClick={handleUpdateZone}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '수정 완료'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* === 렉사 추가 === */}
          {sheetMode === 'rack-create' && (
            <>
              <div className="space-y-5 pb-6">
                <div className="space-y-1.5">
                  <label htmlFor={id('rack-name-create')} className="text-sm font-semibold">렉사 이름</label>
                  <Input
                    id={id('rack-name-create')}
                    name="rackName"
                    autoComplete="off"
                    value={rackName}
                    onChange={(e) => setRackName(e.target.value)}
                    placeholder="렉사 1, 상단 렉사…"
                    className="rounded-xl"
                    autoFocus={!isMobile}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor={id('rack-rows-create')} className="text-sm font-semibold">행 수 (세로)</label>
                    <Input
                      id={id('rack-rows-create')}
                      name="rackRows"
                      type="number"
                      inputMode="numeric"
                      autoComplete="off"
                      value={rackRows}
                      onChange={(e) => setRackRows(e.target.value)}
                      min={1}
                      max={20}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={id('rack-cols-create')} className="text-sm font-semibold">열 수 (가로)</label>
                    <Input
                      id={id('rack-cols-create')}
                      name="rackCols"
                      type="number"
                      inputMode="numeric"
                      autoComplete="off"
                      value={rackCols}
                      onChange={(e) => setRackCols(e.target.value)}
                      min={1}
                      max={10}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                {rackRows && rackCols && (
                  <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-3.5 text-center">
                    <span className="text-sm text-muted-foreground">
                      총 <span className="font-bold text-foreground">{parseInt(rackRows || '0') * parseInt(rackCols || '0')}</span>칸
                    </span>
                  </div>
                )}
                <Button
                  className="w-full rounded-2xl h-11"
                  disabled={!rackName.trim() || !rackRows || !rackCols || isPending}
                  onClick={handleCreateRack}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '렉사 추가'}
                </Button>
              </div>
            </>
          )}

          {/* === 렉사 수정 === */}
          {sheetMode === 'rack-edit' && editingRack && (
            <>
              <div className="space-y-5 pb-6">
                <div className="space-y-1.5">
                  <label htmlFor={id('rack-name-edit')} className="text-sm font-semibold">렉사 이름</label>
                  <Input
                    id={id('rack-name-edit')}
                    name="rackName"
                    autoComplete="off"
                    value={rackName}
                    onChange={(e) => setRackName(e.target.value)}
                    className="rounded-xl"
                    autoFocus={!isMobile}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-neutral-50 border border-neutral-100 p-3.5">
                    <span className="text-sm font-medium">행</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="행 줄이기"
                        disabled={parseInt(rackRows) <= 1}
                        onClick={() => setRackRows(String(Math.max(1, parseInt(rackRows) - 1)))}
                        className="w-8 h-8 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{rackRows}</span>
                      <button
                        type="button"
                        aria-label="행 늘리기"
                        disabled={parseInt(rackRows) >= 20}
                        onClick={() => setRackRows(String(Math.min(20, parseInt(rackRows) + 1)))}
                        className="w-8 h-8 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-neutral-50 border border-neutral-100 p-3.5">
                    <span className="text-sm font-medium">열</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="열 줄이기"
                        disabled={parseInt(rackCols) <= 1}
                        onClick={() => setRackCols(String(Math.max(1, parseInt(rackCols) - 1)))}
                        className="w-8 h-8 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{rackCols}</span>
                      <button
                        type="button"
                        aria-label="열 늘리기"
                        disabled={parseInt(rackCols) >= 20}
                        onClick={() => setRackCols(String(Math.min(20, parseInt(rackCols) + 1)))}
                        className="w-8 h-8 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground px-1">
                    {parseInt(rackRows) * parseInt(rackCols)}칸 · 줄일 때 해당 칸이 비어있어야 합니다
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl h-11 gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                    disabled={isPending}
                    onClick={handleDeleteRack}
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </Button>
                  <Button
                    className="flex-1 rounded-2xl h-11"
                    disabled={!rackName.trim() || isPending}
                    onClick={handleUpdateRack}
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '수정 완료'}
                  </Button>
                </div>
              </div>
            </>
          )}
          </div>
          )}
        </ResponsiveDrawerContent>
      </ResponsiveDrawer>

      {/* QR 스캐너 시트 */}
      <QrScannerSheet
        open={qrScannerOpen}
        onOpenChange={setQrScannerOpen}
        mode="select"
        onAnimalSelect={handleQrAssign}
      />

      {/* 개체 상세 시트 */}
      <AnimalDetailSheet
        animalId={detailAnimalId}
        open={detailSheetOpen}
        onOpenChange={(open) => { if (!open) detailSheet.close() }}
      />

      {/* 산란 라벨 다운로드 */}
      <PairingLabelSheet
        open={pairingLabelOpen}
        onOpenChange={setPairingLabelOpen}
        data={pairingLabelData}
      />

      {/* 확인 다이얼로그 (window.confirm 대체) */}
      <AlertDialog
        open={confirmState?.open ?? false}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmState?.title}</AlertDialogTitle>
            {confirmState?.description && (
              <AlertDialogDescription>{confirmState.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className={
                confirmState?.destructive
                  ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
                  : undefined
              }
              onClick={() => {
                confirmState?.onConfirm()
                setConfirmState(null)
              }}
            >
              {confirmState?.confirmLabel ?? '확인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

