'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Category = {
  id: string
  code: string
  name: string
}

type CategoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onSave: (data: { code: string; name: string }) => Promise<void>
}

export function CategoryDialog({ open, onOpenChange, category, onSave }: CategoryDialogProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (category) {
      setCode(category.code)
      setName(category.name)
    } else {
      setCode('')
      setName('')
    }
  }, [category, open])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ code, name })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? '카테고리 수정' : '카테고리 추가'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category-code">코드 *</Label>
            <Input
              id="category-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="예: LIZARD"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-name">이름 *</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 도마뱀"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!code || !name || saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
