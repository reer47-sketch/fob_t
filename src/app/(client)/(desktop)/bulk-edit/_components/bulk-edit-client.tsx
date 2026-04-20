'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Gender } from '@prisma/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Loader2, Save, ArrowLeft } from 'lucide-react'
import { getAnimalsForBulkEdit, type BulkEditAnimal } from '@/actions/animals/get-animals-for-bulk-edit'
import { bulkUpdateAnimals } from '@/actions/animals/bulk-update-animals'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const GENDER_OPTIONS = [
  { value: 'MALE', label: '수컷' },
  { value: 'FEMALE', label: '암컷' },
  { value: 'UNKNOWN', label: '미확인' },
]

const QUALITY_OPTIONS = [
  { value: 'S', label: 'S' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
]

interface EditRow {
  animal: BulkEditAnimal
  changes: Record<string, unknown>
}

export function BulkEditClient() {
  const router = useRouter()
  const [rows, setRows] = useState<EditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('bulkEditIds')
    if (!raw) {
      toast.error('편집할 개체를 선택해주세요.')
      router.push('/animals')
      return
    }

    const ids = JSON.parse(raw) as string[]
    sessionStorage.removeItem('bulkEditIds')

    getAnimalsForBulkEdit(ids).then((result) => {
      if (result.success && result.data) {
        setRows(result.data.map((animal) => ({ animal, changes: {} })))
      } else {
        toast.error(result.error || '데이터를 불러올 수 없습니다.')
        router.push('/animals')
      }
      setLoading(false)
    })
  }, [router])

  const updateField = useCallback((animalId: string, field: string, value: unknown) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.animal.id !== animalId) return row
        return { ...row, changes: { ...row.changes, [field]: value } }
      })
    )
  }, [])

  const getVal = (row: EditRow, field: string, fallback: unknown = null) => {
    if (field in row.changes) return row.changes[field]
    // Animal 직접 필드
    if (field in row.animal) return (row.animal as unknown as Record<string, unknown>)[field]
    // Detail 필드
    if (row.animal.detail && field in row.animal.detail) {
      return (row.animal.detail as unknown as Record<string, unknown>)[field]
    }
    return fallback
  }

  const changedCount = rows.filter((r) => Object.keys(r.changes).length > 0).length

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
        router.push('/animals')
      } else {
        toast.error(result.error || '수정 실패')
      }
    } catch {
      toast.error('수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <p className="text-muted-foreground">편집할 개체가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden">
      {/* 상단 툴바 */}
      <div className="shrink-0 flex items-center gap-3 pb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/animals')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          목록으로
        </Button>
        <span className="text-sm text-muted-foreground">{rows.length}개 개체 편집 중</span>
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

      {/* 테이블 */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] sticky left-0 bg-background z-10">ID</TableHead>
                <TableHead className="w-[80px]">종</TableHead>
                <TableHead className="w-[80px]">모프</TableHead>
                <TableHead className="w-[130px]">이름</TableHead>
                <TableHead className="w-[100px]">성별</TableHead>
                <TableHead className="w-[140px]">해칭일</TableHead>
                <TableHead className="w-[140px]">폐사일</TableHead>
                <TableHead className="w-[70px]">퀄리티</TableHead>
                <TableHead className="w-[60px]">공개</TableHead>
                <TableHead className="w-[70px]">브리딩</TableHead>
                <TableHead className="w-[130px]">크기</TableHead>
                <TableHead className="w-[130px]">꼬리</TableHead>
                <TableHead className="w-[130px]">무늬</TableHead>
                <TableHead className="w-[130px]">특이사항</TableHead>
                <TableHead className="w-[130px]">건강</TableHead>
                <TableHead className="w-[60px]">프루븐</TableHead>
                <TableHead className="w-[130px]">케이지</TableHead>
                <TableHead className="w-[130px]">바닥재</TableHead>
                <TableHead className="w-[130px]">서식지 메모</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.animal.id} className={Object.keys(row.changes).length > 0 ? 'bg-blue-50/30' : ''}>
                  {/* ID (읽기전용) */}
                  <TableCell className="sticky left-0 bg-background z-10 text-xs text-muted-foreground font-mono">
                    {row.animal.uniqueId}
                  </TableCell>
                  {/* 종 (읽기전용) */}
                  <TableCell className="text-xs text-muted-foreground">
                    {row.animal.species?.code || '-'}
                  </TableCell>
                  {/* 대표모프 (읽기전용) */}
                  <TableCell className="text-xs text-muted-foreground">
                    {row.animal.primaryMorph?.code || '-'}
                  </TableCell>
                  {/* 이름 */}
                  <TableCell>
                    <Input
                      value={(getVal(row, 'name') as string) || ''}
                      onChange={(e) => updateField(row.animal.id, 'name', e.target.value || null)}
                      placeholder="(없음)"
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  {/* 성별 */}
                  <TableCell>
                    <Select
                      value={(getVal(row, 'gender') as string) || ''}
                      onValueChange={(v) => updateField(row.animal.id, 'gender', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {/* 해칭일 */}
                  <TableCell>
                    <DateCell
                      value={getVal(row, 'hatchDate') as Date | string | null}
                      onChange={(d) => updateField(row.animal.id, 'hatchDate', d ? d.toISOString() : null)}
                    />
                  </TableCell>
                  {/* 폐사일 */}
                  <TableCell>
                    <DateCell
                      value={getVal(row, 'deathDate') as Date | string | null}
                      onChange={(d) => updateField(row.animal.id, 'deathDate', d ? d.toISOString() : null)}
                    />
                  </TableCell>
                  {/* 퀄리티 */}
                  <TableCell>
                    <Select
                      value={(getVal(row, 'quality') as string) || '_none'}
                      onValueChange={(v) => updateField(row.animal.id, 'quality', v === '_none' ? null : v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">-</SelectItem>
                        {QUALITY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {/* 공개 */}
                  <TableCell>
                    <Checkbox
                      checked={getVal(row, 'isPublic') as boolean}
                      onCheckedChange={(c) => updateField(row.animal.id, 'isPublic', !!c)}
                    />
                  </TableCell>
                  {/* 브리딩 */}
                  <TableCell>
                    <Checkbox
                      checked={getVal(row, 'isBreeding') as boolean}
                      onCheckedChange={(c) => updateField(row.animal.id, 'isBreeding', !!c)}
                    />
                  </TableCell>
                  {/* 텍스트 필드들 */}
                  <TableCell>
                    <TextCell value={getVal(row, 'currentSize') as string | null} onChange={(v) => updateField(row.animal.id, 'currentSize', v)} />
                  </TableCell>
                  <TableCell>
                    <TextCell value={getVal(row, 'tailStatus') as string | null} onChange={(v) => updateField(row.animal.id, 'tailStatus', v)} />
                  </TableCell>
                  <TableCell>
                    <TextCell value={getVal(row, 'patternType') as string | null} onChange={(v) => updateField(row.animal.id, 'patternType', v)} />
                  </TableCell>
                  <TableCell>
                    <TextCell value={getVal(row, 'distinctiveMarks') as string | null} onChange={(v) => updateField(row.animal.id, 'distinctiveMarks', v)} />
                  </TableCell>
                  <TableCell>
                    <TextCell value={getVal(row, 'healthStatus') as string | null} onChange={(v) => updateField(row.animal.id, 'healthStatus', v)} />
                  </TableCell>
                  {/* 프루븐 */}
                  <TableCell>
                    <Checkbox
                      checked={getVal(row, 'isMating') as boolean}
                      onCheckedChange={(c) => updateField(row.animal.id, 'isMating', !!c)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextCell value={getVal(row, 'cageInfo') as string | null} onChange={(v) => updateField(row.animal.id, 'cageInfo', v)} />
                  </TableCell>
                  <TableCell>
                    <TextCell value={getVal(row, 'flooringInfo') as string | null} onChange={(v) => updateField(row.animal.id, 'flooringInfo', v)} />
                  </TableCell>
                  <TableCell>
                    <TextCell value={getVal(row, 'habitatNotes') as string | null} onChange={(v) => updateField(row.animal.id, 'habitatNotes', v)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function TextCell({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-8 text-sm"
      placeholder="-"
    />
  )
}

function DateCell({ value, onChange }: { value: Date | string | null; onChange: (d: Date | null) => void }) {
  const dateValue = value ? new Date(value) : null
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-full justify-start text-left text-sm font-normal">
          <CalendarIcon className="mr-1.5 h-3 w-3" />
          {dateValue ? format(dateValue, 'yyyy-MM-dd') : '(없음)'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue || undefined}
          onSelect={(date) => onChange(date || null)}
          locale={ko}
        />
      </PopoverContent>
    </Popover>
  )
}
