'use client'

import { useState, useEffect, memo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { EditRow, MorphOption } from './bulk-manage-client'

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

function getVal(row: EditRow, field: string, fallback: unknown = null) {
  if (field in row.changes) return row.changes[field]
  if (field in row.animal) return (row.animal as unknown as Record<string, unknown>)[field]
  if (row.animal.detail && field in row.animal.detail) {
    return (row.animal.detail as unknown as Record<string, unknown>)[field]
  }
  return fallback
}

// ─── 셀 컴포넌트 ───

const LazyImage = memo(function LazyImage({ src }: { src: string | null }) {
  if (!src) {
    return (
      <div className="w-20 aspect-square shrink-0 rounded-lg bg-muted flex items-center justify-center">
        <span className="text-[11px] text-muted-foreground">없음</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="w-20 aspect-square shrink-0 rounded-lg object-cover"
    />
  )
})

/**
 * 로컬 state로 타이핑, blur 시에만 상위에 반영.
 * 매 키 입력마다 전체 테이블 리렌더 방지.
 */
const TextInput = memo(function TextInput({
  value,
  onChange,
  placeholder = '-',
}: {
  value: string | null
  onChange: (v: string | null) => void
  placeholder?: string
}) {
  const [local, setLocal] = useState(value || '')

  // 외부에서 value가 바뀌면 (저장 후 리로드 등) 로컬도 동기화
  useEffect(() => {
    setLocal(value || '')
  }, [value])

  return (
    <Input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onChange(local || null)}
      className="h-8 text-sm"
      placeholder={placeholder}
    />
  )
})

// ─── 날짜 입력 (dropdown으로 연/월 빠르게 선택) ───

function DateInput({
  value,
  onChange,
}: {
  value: Date | string | null
  onChange: (d: Date | null) => void
}) {
  const dateValue = value ? new Date(value) : null
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full justify-start text-left text-sm font-normal"
        >
          <CalendarIcon className="mr-1.5 h-3 w-3" />
          {dateValue ? format(dateValue, 'yyyy-MM-dd') : '(없음)'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={dateValue || undefined}
          onSelect={(date) => onChange(date || null)}
          locale={ko}
        />
      </PopoverContent>
    </Popover>
  )
}

// ─── 콤보모프 팝오버 ───

const ComboMorphCell = memo(function ComboMorphCell({
  row,
  availableMorphs,
  updateField,
}: {
  row: EditRow
  availableMorphs: MorphOption[]
  updateField: (animalId: string, field: string, value: unknown) => void
}) {
  const currentIds: string[] =
    'comboMorphIds' in row.changes
      ? (row.changes.comboMorphIds as string[])
      : row.animal.comboMorphs.map((m) => m.id)

  const primaryId = row.animal.primaryMorph?.id
  const options = availableMorphs.filter((m) => m.id !== primaryId)

  // 선택된 모프 이름 목록
  const selectedNames = currentIds
    .map((id) => options.find((m) => m.id === id)?.name)
    .filter(Boolean)

  if (options.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className="flex min-h-8 w-full cursor-pointer items-center rounded-md px-1 py-1 text-left text-sm transition-colors hover:bg-muted"
        >
          {selectedNames.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedNames.map((name, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs px-1.5 py-0.5"
                >
                  {name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">선택</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-0.5 max-h-60 overflow-y-auto">
          {options.map((morph) => {
            const selected = currentIds.includes(morph.id)
            return (
              <div
                key={morph.id}
                role="button"
                tabIndex={0}
                className={cn(
                  'flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors',
                  selected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted'
                )}
                onClick={() => {
                  const next = selected
                    ? currentIds.filter((id) => id !== morph.id)
                    : [...currentIds, morph.id]
                  updateField(row.animal.id, 'comboMorphIds', next)
                }}
              >
                <Checkbox checked={selected} className="pointer-events-none" />
                {morph.name}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
})

// ─── 컬럼 정의 ───

export function createColumns(
  updateField: (animalId: string, field: string, value: unknown) => void,
  morphOptions: MorphOption[]
): ColumnDef<EditRow>[] {
  return [
    {
      id: 'image',
      header: '사진',
      size: 96,
      enableSorting: false,
      cell: ({ row }) => <LazyImage src={row.original.animal.imageUrl} />,
    },
    {
      accessorFn: (row) => row.animal.uniqueId,
      id: 'uniqueId',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      size: 200,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-mono truncate block">
          {row.original.animal.uniqueId}
        </span>
      ),
    },
    {
      accessorFn: (row) => row.animal.species?.name ?? '',
      id: 'species',
      header: ({ column }) => <DataTableColumnHeader column={column} title="종" />,
      size: 120,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.animal.species?.name || '-'}
        </span>
      ),
    },
    {
      accessorFn: (row) => row.animal.primaryMorph?.name ?? '',
      id: 'morph',
      header: ({ column }) => <DataTableColumnHeader column={column} title="대표모프" />,
      size: 120,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.animal.primaryMorph?.name || '-'}
        </span>
      ),
    },
    {
      id: 'comboMorphs',
      header: '콤보모프',
      size: 180,
      enableSorting: false,
      cell: ({ row }) => (
        <ComboMorphCell
          row={row.original}
          availableMorphs={morphOptions}
          updateField={updateField}
        />
      ),
    },
    {
      accessorFn: (row) => (getVal(row, 'name') as string) ?? '',
      id: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="이름" />,
      size: 150,
      cell: ({ row }) => (
        <TextInput
          value={getVal(row.original, 'name') as string | null}
          onChange={(v) => updateField(row.original.animal.id, 'name', v)}
          placeholder="(없음)"
        />
      ),
    },
    {
      accessorFn: (row) => (getVal(row, 'gender') as string) ?? '',
      id: 'gender',
      header: ({ column }) => <DataTableColumnHeader column={column} title="성별" />,
      size: 110,
      cell: ({ row }) => (
        <Select
          value={(getVal(row.original, 'gender') as string) || ''}
          onValueChange={(v) => updateField(row.original.animal.id, 'gender', v)}
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
      ),
    },
    {
      accessorFn: (row) => {
        const v = getVal(row, 'hatchDate')
        return v ? new Date(v as string).getTime() : 0
      },
      id: 'hatchDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="해칭일" />,
      size: 150,
      cell: ({ row }) => (
        <DateInput
          value={getVal(row.original, 'hatchDate') as Date | string | null}
          onChange={(d) => updateField(row.original.animal.id, 'hatchDate', d ? d.toISOString() : null)}
        />
      ),
    },
    {
      accessorFn: (row) => {
        const v = getVal(row, 'deathDate')
        return v ? new Date(v as string).getTime() : 0
      },
      id: 'deathDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="폐사일" />,
      size: 150,
      cell: ({ row }) => (
        <DateInput
          value={getVal(row.original, 'deathDate') as Date | string | null}
          onChange={(d) => updateField(row.original.animal.id, 'deathDate', d ? d.toISOString() : null)}
        />
      ),
    },
    {
      accessorFn: (row) => (getVal(row, 'quality') as string) ?? '',
      id: 'quality',
      header: '등급',
      size: 90,
      cell: ({ row }) => (
        <Select
          value={(getVal(row.original, 'quality') as string) || '_none'}
          onValueChange={(v) => updateField(row.original.animal.id, 'quality', v === '_none' ? null : v)}
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
      ),
    },
    // 체크박스: 공개 / 브리딩 / 프루븐
    {
      id: 'flags',
      header: '',
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={getVal(row.original, 'isPublic') as boolean}
              onCheckedChange={(c) => updateField(row.original.animal.id, 'isPublic', !!c)}
            />
            <span className="text-xs text-muted-foreground">공개</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={getVal(row.original, 'isBreeding') as boolean}
              onCheckedChange={(c) => updateField(row.original.animal.id, 'isBreeding', !!c)}
            />
            <span className="text-xs text-muted-foreground">브리딩</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={getVal(row.original, 'isMating') as boolean}
              onCheckedChange={(c) => updateField(row.original.animal.id, 'isMating', !!c)}
            />
            <span className="text-xs text-muted-foreground">프루븐</span>
          </label>
        </div>
      ),
    },
    // 텍스트 그룹: 크기 / 꼬리
    {
      id: 'sizeTail',
      header: '크기 / 꼬리',
      size: 150,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <TextInput
            value={getVal(row.original, 'currentSize') as string | null}
            onChange={(v) => updateField(row.original.animal.id, 'currentSize', v)}
            placeholder="크기"
          />
          <TextInput
            value={getVal(row.original, 'tailStatus') as string | null}
            onChange={(v) => updateField(row.original.animal.id, 'tailStatus', v)}
            placeholder="꼬리"
          />
        </div>
      ),
    },
    // 텍스트 그룹: 무늬 / 특이사항
    {
      id: 'patternMarks',
      header: '무늬 / 특이',
      size: 150,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <TextInput
            value={getVal(row.original, 'patternType') as string | null}
            onChange={(v) => updateField(row.original.animal.id, 'patternType', v)}
            placeholder="무늬"
          />
          <TextInput
            value={getVal(row.original, 'distinctiveMarks') as string | null}
            onChange={(v) => updateField(row.original.animal.id, 'distinctiveMarks', v)}
            placeholder="특이사항"
          />
        </div>
      ),
    },
    // 텍스트: 건강
    {
      id: 'healthStatus',
      header: '건강',
      size: 150,
      enableSorting: false,
      cell: ({ row }) => (
        <TextInput
          value={getVal(row.original, 'healthStatus') as string | null}
          onChange={(v) => updateField(row.original.animal.id, 'healthStatus', v)}
          placeholder="건강"
        />
      ),
    },
    // 텍스트 그룹: 케이지 / 바닥재
    {
      id: 'cageFloor',
      header: '케이지 / 바닥재',
      size: 150,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <TextInput
            value={getVal(row.original, 'cageInfo') as string | null}
            onChange={(v) => updateField(row.original.animal.id, 'cageInfo', v)}
            placeholder="케이지"
          />
          <TextInput
            value={getVal(row.original, 'flooringInfo') as string | null}
            onChange={(v) => updateField(row.original.animal.id, 'flooringInfo', v)}
            placeholder="바닥재"
          />
        </div>
      ),
    },
    // 텍스트: 서식지 메모
    {
      id: 'habitatNotes',
      header: '메모',
      size: 200,
      enableSorting: false,
      cell: ({ row }) => (
        <TextInput
          value={getVal(row.original, 'habitatNotes') as string | null}
          onChange={(v) => updateField(row.original.animal.id, 'habitatNotes', v)}
          placeholder="메모"
        />
      ),
    },
  ]
}
