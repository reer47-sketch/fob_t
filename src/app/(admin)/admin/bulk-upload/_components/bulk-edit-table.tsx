'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AcquisitionType, Gender } from '@prisma/client'
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
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Trash2, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getMorphsForBulk } from '@/actions/admin/get-codes'

export interface BulkAnimalRow {
  id: string // 클라이언트 식별용 (uuid)
  file: File
  imagePreview: string
  name: string | null
  gender: Gender | null
  hatchDate: Date | null
  speciesId: string | null
  speciesCode: string | null
  primaryMorphId: string | null
  morphCode: string | null
  acquisitionType: AcquisitionType | null
  errors: string[]
  warnings: string[]
}

interface Species {
  id: string
  code: string
  name: string
}

interface Morph {
  id: string
  code: string
  name: string
}

interface BulkEditTableProps {
  rows: BulkAnimalRow[]
  onUpdateRow: (id: string, updates: Partial<BulkAnimalRow>) => void
  onDeleteRow: (id: string) => void
  speciesList: Species[]
}

const GENDER_OPTIONS = [
  { value: Gender.MALE, label: '수컷 (M)' },
  { value: Gender.FEMALE, label: '암컷 (F)' },
  { value: Gender.UNKNOWN, label: '미확인 (U)' },
]

const ACQUISITION_TYPE_OPTIONS = [
  { value: AcquisitionType.ADOPTION, label: '입양 (A)' },
  { value: AcquisitionType.HATCHING, label: '해칭 (H)' },
]

export function BulkEditTable({ rows, onUpdateRow, onDeleteRow, speciesList }: BulkEditTableProps) {
  // 종별 모프 캐시
  const [morphCache, setMorphCache] = useState<Record<string, Morph[]>>({})
  const morphCacheRef = useRef(morphCache)
  morphCacheRef.current = morphCache

  // 종 변경 시 모프 목록 로드
  const loadMorphs = useCallback(
    async (speciesId: string) => {
      if (morphCacheRef.current[speciesId]) return
      const morphs = await getMorphsForBulk(speciesId)
      setMorphCache((prev) => ({ ...prev, [speciesId]: morphs }))
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // 행 추가 시: 모프 로드 + 자동 매칭
  useEffect(() => {
    const speciesIds = new Set(rows.map((r) => r.speciesId).filter(Boolean) as string[])
    speciesIds.forEach((id) => loadMorphs(id))
  }, [rows.length, loadMorphs])

  // morphCode → primaryMorphId 자동 매칭 (캐시 또는 rows 변경 시)
  useEffect(() => {
    rows.forEach((row) => {
      if (row.speciesId && row.morphCode && !row.primaryMorphId) {
        const morphs = morphCache[row.speciesId]
        if (morphs) {
          const match = morphs.find(
            (m) => m.code.toUpperCase() === row.morphCode!.toUpperCase()
          )
          if (match) {
            onUpdateRow(row.id, { primaryMorphId: match.id })
          }
        }
      }
    })
  }, [morphCache, rows, onUpdateRow])

  const handleSpeciesChange = (rowId: string, speciesId: string) => {
    const species = speciesList.find((s) => s.id === speciesId)
    onUpdateRow(rowId, {
      speciesId,
      speciesCode: species?.code || null,
      primaryMorphId: null,
      morphCode: null,
      errors: [],
    })
    loadMorphs(speciesId)
  }

  const handleMorphChange = (rowId: string, morphId: string, speciesId: string) => {
    const morphs = morphCache[speciesId] || []
    const morph = morphs.find((m) => m.id === morphId)
    onUpdateRow(rowId, {
      primaryMorphId: morphId,
      morphCode: morph?.code || null,
    })
  }

  const getRowStatus = (row: BulkAnimalRow) => {
    // 재검증: 필수 필드 체크
    const currentErrors: string[] = []
    if (!row.gender) currentErrors.push('성별 필수')
    if (!row.speciesId) currentErrors.push('종 필수')
    if (!row.primaryMorphId) currentErrors.push('모프 필수')
    if (!row.acquisitionType) currentErrors.push('등록유형 필수')

    if (currentErrors.length > 0) return 'error'
    if (row.warnings.length > 0 || !row.name) return 'warning'
    return 'valid'
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">사진</TableHead>
              <TableHead className="w-[50px]">상태</TableHead>
              <TableHead className="w-[140px]">이름</TableHead>
              <TableHead className="w-[120px]">성별</TableHead>
              <TableHead className="w-[160px]">해칭일</TableHead>
              <TableHead className="w-[160px]">종</TableHead>
              <TableHead className="w-[160px]">모프</TableHead>
              <TableHead className="w-[120px]">등록유형</TableHead>
              <TableHead className="w-[60px]">삭제</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const status = getRowStatus(row)
              const morphs = row.speciesId ? morphCache[row.speciesId] || [] : []

              return (
                <TableRow
                  key={row.id}
                  className={
                    status === 'error'
                      ? 'bg-red-50/50'
                      : status === 'warning'
                        ? 'bg-yellow-50/30'
                        : ''
                  }
                >
                  {/* 썸네일 */}
                  <TableCell>
                    <img
                      src={row.imagePreview}
                      alt=""
                      className="h-16 w-16 rounded object-cover"
                    />
                  </TableCell>

                  {/* 상태 */}
                  <TableCell>
                    {status === 'valid' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {status === 'warning' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    {status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </TableCell>

                  {/* 이름 */}
                  <TableCell>
                    <Input
                      value={row.name || ''}
                      onChange={(e) =>
                        onUpdateRow(row.id, { name: e.target.value || null })
                      }
                      placeholder="(없음)"
                      className="h-8 text-sm"
                    />
                  </TableCell>

                  {/* 성별 */}
                  <TableCell>
                    <Select
                      value={row.gender || ''}
                      onValueChange={(v) =>
                        onUpdateRow(row.id, { gender: v as Gender })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* 해칭일 */}
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-full justify-start text-left text-sm font-normal"
                        >
                          <CalendarIcon className="mr-1.5 h-3 w-3" />
                          {row.hatchDate
                            ? format(row.hatchDate, 'yyyy-MM-dd')
                            : '(없음)'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={row.hatchDate || undefined}
                          onSelect={(date) =>
                            onUpdateRow(row.id, { hatchDate: date || null })
                          }
                          locale={ko}
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>

                  {/* 종 */}
                  <TableCell>
                    <Select
                      value={row.speciesId || ''}
                      onValueChange={(v) => handleSpeciesChange(row.id, v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="종 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {speciesList.map((species) => (
                          <SelectItem key={species.id} value={species.id}>
                            [{species.code}] {species.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* 모프 */}
                  <TableCell>
                    <Select
                      value={row.primaryMorphId || ''}
                      onValueChange={(v) =>
                        handleMorphChange(row.id, v, row.speciesId!)
                      }
                      disabled={!row.speciesId}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="모프 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {morphs.map((morph) => (
                          <SelectItem key={morph.id} value={morph.id}>
                            [{morph.code}] {morph.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* 등록유형 */}
                  <TableCell>
                    <Select
                      value={row.acquisitionType || ''}
                      onValueChange={(v) =>
                        onUpdateRow(row.id, { acquisitionType: v as AcquisitionType })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACQUISITION_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* 삭제 */}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteRow(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
