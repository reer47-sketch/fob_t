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

type Species = {
  id: string
  code: string
  name: string
  scientificName?: string | null
}

type SpeciesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  species: Species | null
  onSave: (data: { code: string; name: string; scientificName: string; description?: string }) => Promise<void>
}

export function SpeciesDialog({ open, onOpenChange, species, onSave }: SpeciesDialogProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [scientificName, setScientificName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (species) {
      setCode(species.code)
      setName(species.name)
      setScientificName(species.scientificName || '')
      setDescription('')
    } else {
      setCode('')
      setName('')
      setScientificName('')
      setDescription('')
    }
  }, [species, open])

  const handleSave = async () => {
    if (!scientificName) return

    setSaving(true)
    try {
      await onSave({
        code,
        name,
        scientificName,
        description: description || undefined
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{species ? '종 수정' : '종 추가'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">코드 *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="예: CG"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 크레스티드 게코"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scientificName">학명 *</Label>
            <Input
              id="scientificName"
              value={scientificName}
              onChange={(e) => setScientificName(e.target.value)}
              placeholder="예: Correlophus ciliatus"
            />
          </div>

          {!species && (
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
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!code || !name || !scientificName || saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
