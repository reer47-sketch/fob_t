'use client'

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Row,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Loader2, Save, Plus, CheckCircle2, Download, HelpCircle, FileDown, ImageUp, PenLine } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { getAnimalsForBulkEdit, type BulkEditAnimal } from '@/actions/animals/get-animals-for-bulk-edit'
import { bulkUpdateAnimals } from '@/actions/animals/bulk-update-animals'
import { bulkCreateAnimals } from '@/actions/animals/bulk-create-animals'
import { BulkPhotoUploadModal, type PhotoUploadResult } from '@/components/bulk-photo-upload-modal'
import { getSpeciesList, getMorphsBySpecies } from '@/actions/codes/get-codes'
import { resizeImage } from '@/lib/image-resize'
import { exportCodeSheet } from '@/actions/admin/export-code-sheet'
import { createColumns } from './columns'

export interface EditRow {
  animal: BulkEditAnimal
  changes: Record<string, unknown>
}

export interface MorphOption {
  id: string
  code: string
  name: string
}

interface Species {
  id: string
  code: string
  name: string
}

type RegisterStatus =
  | { phase: 'idle' }
  | { phase: 'resizing'; current: number; total: number }
  | { phase: 'uploading'; total: number }
  | { phase: 'done'; created: number; failed: number }
  | { phase: 'error'; message: string }

// 행 높이 (사진 80px + padding)
const ROW_HEIGHT = 100

// ─── memo된 행 컴포넌트 ───

const VirtualRow = memo(function VirtualRow({
  row,
}: {
  row: Row<EditRow>
}) {
  return (
    <>
      {row.getVisibleCells().map((cell) => (
        <td
          key={cell.id}
          className={cn(
            'px-3 py-2 align-top',
            cell.column.id === 'image' && 'sticky left-0 z-10 bg-background/95 backdrop-blur-sm'
          )}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </>
  )
})

export function BulkManageClient() {
  const [rows, setRows] = useState<EditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])

  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [registerStatus, setRegisterStatus] = useState<RegisterStatus>({ phase: 'idle' })
  const [morphOptions, setMorphOptions] = useState<MorphOption[]>([])
  const [downloadingCodes, setDownloadingCodes] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const result = await getAnimalsForBulkEdit()
    if (result.success && result.data) {
      setRows(result.data.map((animal) => ({ animal, changes: {} })))

      const firstSpeciesId = result.data[0]?.species?.id
      if (firstSpeciesId) {
        const morphs = await getMorphsBySpecies(firstSpeciesId)
        setMorphOptions(morphs)
      }
    } else {
      toast.error(result.error || '데이터를 불러올 수 없습니다.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    getSpeciesList().then(setSpeciesList)
  }, [loadData])

  const updateField = useCallback((animalId: string, field: string, value: unknown) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.animal.id !== animalId) return row
        return { ...row, changes: { ...row.changes, [field]: value } }
      })
    )
  }, [])

  const changedCount = useMemo(
    () => rows.filter((r) => Object.keys(r.changes).length > 0).length,
    [rows]
  )

  const handleSave = async () => {
    const items = rows
      .filter((r) => Object.keys(r.changes).length > 0)
      .map((r) => ({
        animalId: r.animal.id,
        patch: r.changes as Record<string, unknown>,
      }))

    if (items.length === 0) {
      toast.info('변경된 항목이 없습니다.')
      return
    }

    setSaving(true)
    try {
      const result = await bulkUpdateAnimals(items)
      if (result.success && result.data) {
        toast.success(`${result.data.updatedCount}건 수정 완료`)
        if (result.data.errors.length > 0) {
          toast.error(`${result.data.errors.length}건 실패`)
        }
        await loadData()
      } else {
        toast.error(result.error || '수정 실패')
      }
    } catch {
      toast.error('수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = useCallback(
    async (uploadResult: PhotoUploadResult) => {
      setPhotoModalOpen(false)

      const total = uploadResult.files.length
      setRegisterStatus({ phase: 'resizing', current: 0, total })

      try {
        const morphs = await getMorphsBySpecies(uploadResult.speciesId)

        const animals = []
        const imageFiles = []

        for (let i = 0; i < uploadResult.files.length; i++) {
          const pf = uploadResult.files[i]
          const morph = pf.morphCode
            ? morphs.find((m) => m.code.toUpperCase() === pf.morphCode!.toUpperCase())
            : null

          if (!morph) continue

          setRegisterStatus({ phase: 'resizing', current: i + 1, total })
          const resizedFile = await resizeImage(pf.file)

          animals.push({
            name: null,
            gender: 'UNKNOWN' as const,
            hatchDate: pf.hatchDate ? pf.hatchDate.toISOString() : null,
            speciesId: uploadResult.speciesId,
            primaryMorphId: morph.id,
            acquisitionType: 'HATCHING' as const,
          })
          imageFiles.push(resizedFile)
        }

        if (animals.length === 0) {
          setRegisterStatus({ phase: 'error', message: '등록할 개체가 없습니다.' })
          return
        }

        setRegisterStatus({ phase: 'uploading', total: animals.length })
        const res = await bulkCreateAnimals(animals, imageFiles)

        if (res.success === true && 'data' in res) {
          setRegisterStatus({ phase: 'done', created: res.data.created, failed: res.data.failed })
          await loadData()
        } else if ('error' in res) {
          setRegisterStatus({ phase: 'error', message: res.error || '등록 실패' })
        }
      } catch (err) {
        console.error(err)
        setRegisterStatus({ phase: 'error', message: '등록 중 오류가 발생했습니다.' })
      }
    },
    [loadData]
  )

  const handleDownloadCodeSheet = async () => {
    setDownloadingCodes(true)
    try {
      const res = await exportCodeSheet()
      if (res.success) {
        const blob = new Blob([new Uint8Array(res.data.buffer)], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.data.filename
        a.click()
        URL.revokeObjectURL(url)
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error('코드표 다운로드에 실패했습니다')
    } finally {
      setDownloadingCodes(false)
    }
  }

  const handleCloseRegisterModal = () => {
    setRegisterStatus({ phase: 'idle' })
  }

  const columns = useMemo(
    () => createColumns(updateField, morphOptions),
    [updateField, morphOptions]
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  const tableRows = table.getRowModel().rows

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 3,
  })

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isRegistering = registerStatus.phase === 'resizing' || registerStatus.phase === 'uploading'

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden">
      {/* 상단 툴바 */}
      <div className="shrink-0 flex items-center gap-3 pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPhotoModalOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          등록
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadCodeSheet}
          disabled={downloadingCodes}
          className="text-muted-foreground"
        >
          {downloadingCodes
            ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            : <Download className="mr-1.5 h-3.5 w-3.5" />
          }
          코드표
        </Button>

        <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2 text-blue-700 hover:text-blue-800">
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs">도움말</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0" align="end">
              <div className="px-4 pt-4 pb-2">
                <h4 className="text-sm font-semibold">일괄 등록 가이드</h4>
                <p className="text-xs text-muted-foreground mt-0.5">사진 파일명으로 개체를 빠르게 등록하세요</p>
              </div>
              <div className="px-4 pb-4 space-y-1">
                <div className="flex gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <FileDown className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">코드표 확인</p>
                    <p className="text-xs text-muted-foreground mt-0.5">코드표를 다운로드하여 종/모프 코드를 확인하세요.</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <ImageUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">파일명 변경</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      사진 파일명을 <code className="bg-muted px-1 py-px rounded text-[11px]">모프코드_해칭일.확장자</code> 형식으로 변경하세요.
                    </p>
                    <div className="flex gap-2 mt-1.5">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] text-muted-foreground">HQ_20250301.jpg</code>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] text-muted-foreground">NM.webp</code>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">사진 등록</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      등록 버튼 클릭 후 종을 선택하고 사진을 드래그하면 자동으로 등록됩니다.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <PenLine className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">상세 편집</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      등록된 개체의 이름, 성별, 모프 등을 테이블에서 바로 수정 후 저장하세요.
                    </p>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

        <span className="text-sm text-muted-foreground">{rows.length}개 개체</span>

        <div className="ml-auto flex items-center gap-3">
          {changedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {changedCount}건 변경됨
            </span>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || changedCount === 0}
          >
            {saving ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />저장 중...</>
            ) : (
              <><Save className="mr-1.5 h-4 w-4" />저장</>
            )}
          </Button>
        </div>
      </div>

      {/* 가상 스크롤 테이블 */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto rounded-md border">
        <table className="border-collapse" style={{ tableLayout: 'fixed', width: columns.reduce((sum, col) => sum + ((col.size as number) || 100), 0) }}>
          <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.column.columnDef.size, minWidth: header.column.columnDef.size }}
                    className={cn(
                      'px-3 py-2 text-left text-sm font-medium text-muted-foreground',
                      header.column.id === 'image' && 'sticky left-0 z-30 bg-muted/95'
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {tableRows.length ? (
              <>
                {/* 상단 spacer */}
                {virtualizer.getVirtualItems()[0]?.start > 0 && (
                  <tr><td colSpan={columns.length} style={{ height: virtualizer.getVirtualItems()[0].start, padding: 0, border: 'none' }} /></tr>
                )}
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = tableRows[virtualRow.index]
                  return (
                    <tr
                      key={row.id}
                      data-index={virtualRow.index}
                      ref={(el) => virtualizer.measureElement(el)}
                      className={cn(
                        'border-b transition-colors',
                        Object.keys(row.original.changes).length > 0
                          ? 'bg-blue-50/40'
                          : 'bg-background hover:bg-muted/30'
                      )}
                    >
                      <VirtualRow row={row} />
                    </tr>
                  )
                })}
                {/* 하단 spacer */}
                {(() => {
                  const items = virtualizer.getVirtualItems()
                  const lastItem = items[items.length - 1]
                  const bottomSpace = lastItem ? virtualizer.getTotalSize() - lastItem.end : 0
                  return bottomSpace > 0 ? (
                    <tr><td colSpan={columns.length} style={{ height: bottomSpace, padding: 0, border: 'none' }} /></tr>
                  ) : null
                })()}
              </>
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  등록된 개체가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 사진 업로드 모달 */}
      <BulkPhotoUploadModal
        open={photoModalOpen}
        onOpenChange={setPhotoModalOpen}
        speciesList={speciesList}
        onUpload={handlePhotoUpload}
      />

      {/* 등록 진행 모달 */}
      <Dialog
        open={registerStatus.phase !== 'idle'}
        onOpenChange={(open) => { if (!open && !isRegistering) handleCloseRegisterModal() }}
      >
        <DialogContent
          className="sm:max-w-sm"
          onPointerDownOutside={(e) => { if (isRegistering) e.preventDefault() }}
        >
          <DialogHeader>
            <DialogTitle>일괄 등록</DialogTitle>
            <DialogDescription className="sr-only">등록 진행 상태</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {registerStatus.phase === 'resizing' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm">
                    이미지 처리 중... ({registerStatus.current}/{registerStatus.total})
                  </span>
                </div>
                <Progress value={(registerStatus.current / registerStatus.total) * 100} />
              </div>
            )}

            {registerStatus.phase === 'uploading' && (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">{registerStatus.total}건 등록 중...</span>
              </div>
            )}

            {registerStatus.phase === 'done' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">{registerStatus.created}건 등록 완료</span>
                </div>
                {registerStatus.failed > 0 && (
                  <p className="text-sm text-destructive">{registerStatus.failed}건 실패</p>
                )}
                <Button size="sm" className="w-full" onClick={handleCloseRegisterModal}>
                  확인
                </Button>
              </div>
            )}

            {registerStatus.phase === 'error' && (
              <div className="space-y-4">
                <p className="text-sm text-destructive">{registerStatus.message}</p>
                <Button size="sm" variant="outline" className="w-full" onClick={handleCloseRegisterModal}>
                  닫기
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
