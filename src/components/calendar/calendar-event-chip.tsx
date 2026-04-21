import { cn } from '@/lib/utils'

export type EventType = 'adoption' | 'hatching' | 'sale' | 'death' | 'mating' | 'laying' | 'hatch' | 'expected_hatch' | 'task' | 'unfed'

const CONFIG: Record<EventType, { bg: string; text: string; label: string }> = {
  adoption:       { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '입양' },
  hatching:       { bg: 'bg-green-200',   text: 'text-green-800',   label: '해칭' },
  sale:           { bg: 'bg-blue-100',    text: 'text-blue-700',    label: '판매' },
  death:          { bg: 'bg-slate-200',   text: 'text-slate-600',   label: '폐사' },
  mating:         { bg: 'bg-pink-100',    text: 'text-pink-700',    label: '메이팅' },
  laying:         { bg: 'bg-yellow-100',  text: 'text-yellow-700',  label: '산란' },
  hatch:          { bg: 'bg-sky-100',     text: 'text-sky-700',     label: '부화' },
  expected_hatch: { bg: 'bg-violet-100',  text: 'text-violet-700',  label: '부화예정' },
  task:           { bg: 'bg-orange-100',  text: 'text-orange-700',  label: '태스크' },
  unfed:          { bg: 'bg-red-100',     text: 'text-red-700',     label: '미피딩' },
}

interface EventChipProps {
  type: EventType
  count?: number
  label?: string
  className?: string
  dashed?: boolean
}

export function EventChip({ type, count, label, className, dashed }: EventChipProps) {
  const cfg = CONFIG[type]
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium leading-none',
      cfg.bg, cfg.text,
      dashed && 'border border-dashed border-current',
      className,
    )}>
      {label ?? cfg.label}{count != null && count > 0 ? ` ${count}` : ''}
    </span>
  )
}
