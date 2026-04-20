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
import { Textarea } from '@/components/ui/textarea'
import { CodeCategory } from '@prisma/client'

type Code = {
  id: string
  code: string
  name: string
  category: CodeCategory
  description: string | null
  displayOrder: number
  _count: {
    animalCodes: number
  }
}

type CodeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: Code | null
  category: CodeCategory | null
  categoryLabel: string
  onSave: (data: {
    category: CodeCategory
    code: string
    name: string
    description?: string
    displayOrder?: number
  }) => Promise<void>
}

const CATEGORY_LABELS: Record<CodeCategory, string> = {
  CATEGORY: '카테고리',
  SPECIES: '종',
  MORPH: '모프',
  TRAIT: '형질',
  COLOR: '색깔',
}

export function CodeDialog({
  open,
  onOpenChange,
  code,
  category,
  categoryLabel,
  onSave,
}: CodeDialogProps) {
  const [codeValue, setCodeValue] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [displayOrder, setDisplayOrder] = useState<number>(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (code) {
      setCodeValue(code.code)
      setName(code.name)
      setDescription(code.description || '')
      setDisplayOrder(code.displayOrder)
    } else {
      setCodeValue('')
      setName('')
      setDescription('')
      setDisplayOrder(0)
    }
  }, [code, open])

  const handleSave = async () => {
    if (!category) return

    setSaving(true)
    try {
      await onSave({
        category,
        code: codeValue,
        name,
        description: description || undefined,
        displayOrder,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const title = code
    ? `${CATEGORY_LABELS[code.category]} 수정`
    : `${categoryLabel} 추가`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">코드 *</Label>
            <Input
              id="code"
              value={codeValue}
              onChange={(e) => setCodeValue(e.target.value.toUpperCase())}
              placeholder="예: NM, RD"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 노말, 레드"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="선택사항"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">순서 *</Label>
            <Input
              id="displayOrder"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
              min={0}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!codeValue || !name || saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
