'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { useState, useEffect } from "react"

export function BlogDateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [date, setDate] = useState<DateRange | undefined>()

  useEffect(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    if (from && to) {
      setDate({ from: new Date(from), to: new Date(to) })
    } else if (from) {
        setDate({ from: new Date(from), to: undefined })
    } else {
        setDate(undefined)
    }
  }, [searchParams])

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    const params = new URLSearchParams(searchParams)
    
    if (range?.from) {
      params.set('from', range.from.toISOString())
    } else {
      params.delete('from')
    }

    if (range?.to) {
      params.set('to', range.to.toISOString())
    } else {
      params.delete('to')
    }

    params.set('page', '1')
    router.push(`/admin/blogs?${params.toString()}`)
  }

  const clearFilter = (e: React.MouseEvent) => {
      e.stopPropagation()
      setDate(undefined)
      const params = new URLSearchParams(searchParams)
      params.delete('from')
      params.delete('to')
      params.set('page', '1')
      router.push(`/admin/blogs?${params.toString()}`)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full sm:w-[240px] justify-start text-left font-normal relative",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "yy.MM.dd")} - {format(date.to, "yy.MM.dd")}
              </>
            ) : (
              format(date.from, "yy.MM.dd")
            )
          ) : (
            <span>날짜로 검색</span>
          )}
          {date?.from && (
              <div 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full cursor-pointer"
                onClick={clearFilter}
              >
                  <X className="h-3 w-3" />
              </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={handleSelect}
          numberOfMonths={2}
          locale={ko}
        />
      </PopoverContent>
    </Popover>
  )
}
