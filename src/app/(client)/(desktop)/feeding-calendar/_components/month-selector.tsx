import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MonthSelectorProps {
  selectedMonth: string // YYYY-MM 형식
  onMonthChange: (month: string) => void
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [year, month] = selectedMonth.split('-').map(Number)

  // 연도 목록 생성 (현재 연도 기준 ±5년)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

  // 월 목록 생성 (1~12월)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const handleYearChange = (newYear: string) => {
    const formattedMonth = month.toString().padStart(2, '0')
    onMonthChange(`${newYear}-${formattedMonth}`)
  }

  const handleMonthChange = (newMonth: string) => {
    const formattedMonth = newMonth.padStart(2, '0')
    onMonthChange(`${year}-${formattedMonth}`)
  }

  return (
    <div className="flex items-center gap-2">
      {/* 연도 선택 */}
      <Select value={year.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[100px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}년
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 월 선택 */}
      <Select value={month.toString()} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-[80px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m} value={m.toString()}>
              {m}월
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
