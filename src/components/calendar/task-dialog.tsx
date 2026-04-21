'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCalendarTask } from '@/actions/calendar/task-actions'
import { toast } from 'sonner'
import { TaskCategory } from '@prisma/client'

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'CLEANING',     label: '사육장 청소' },
  { value: 'RACK_SETUP',   label: '렉사 설치' },
  { value: 'FEEDING_PREP', label: '먹이 준비' },
  { value: 'HEALTH_CHECK', label: '건강 체크' },
  { value: 'OTHER',        label: '기타' },
]

interface TaskDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultDate?: string
  onCreated?: () => void
}

export function TaskDialog({ open, onOpenChange, defaultDate, onCreated }: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate ?? new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState<TaskCategory>('OTHER')
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('제목을 입력해주세요.')
    setLoading(true)
    const res = await createCalendarTask({ title: title.trim(), date: new Date(date), category, memo: memo || undefined })
    setLoading(false)
    if (res.success) {
      toast.success('태스크가 추가됐어요.')
      setTitle(''); setMemo('')
      onOpenChange(false)
      onCreated?.()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>태스크 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>제목</Label>
            <Input placeholder="사육장 청소, 렉사 설치 등" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>날짜</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>카테고리</Label>
            <Select value={category} onValueChange={v => setCategory(v as TaskCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>메모 (선택)</Label>
            <Input placeholder="메모를 입력하세요" value={memo} onChange={e => setMemo(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleSubmit} disabled={loading}>추가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
