"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { getTenantSpeciesAction } from "@/actions/tenant-codes/get-tenant-species"
import { setTenantSpeciesAction } from "@/actions/tenant-codes/set-tenant-species"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

type Species = {
  id: string
  code: string
  name: string
  scientificName: string | null
  selected: boolean
}

type CategoryWithSpecies = {
  id: string
  code: string
  name: string
  species: Species[]
}

interface SpeciesSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  required?: boolean
}

export function SpeciesSettingsDialog({ open, onOpenChange, required }: SpeciesSettingsDialogProps) {
  const [categories, setCategories] = useState<CategoryWithSpecies[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getTenantSpeciesAction()
      if (result.success && result.data) {
        setCategories(result.data)
        setExpandedIds(result.data.filter((c: CategoryWithSpecies) => c.species.some(sp => sp.selected)).map((c: CategoryWithSpecies) => c.id))
      }
    } catch (error) {
      console.error("Failed to load species settings:", error)
      toast.error("종 설정을 불러오는데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSpecies = (categoryId: string, speciesId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              species: cat.species.map(sp =>
                sp.id === speciesId ? { ...sp, selected: !sp.selected } : sp
              ),
            }
          : cat
      )
    )
  }

  const handleToggleCategory = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id !== categoryId) return cat
        const allSelected = cat.species.every(sp => sp.selected)
        return {
          ...cat,
          species: cat.species.map(sp => ({ ...sp, selected: !allSelected })),
        }
      })
    )
  }

  const handleSave = async () => {
    const selectedIds = categories.flatMap(cat =>
      cat.species.filter(sp => sp.selected).map(sp => sp.id)
    )

    setSaving(true)
    try {
      const result = await setTenantSpeciesAction({ speciesIds: selectedIds })
      if (result.success) {
        toast.success("종 설정이 저장되었습니다.")
        onOpenChange(false)
      } else {
        toast.error(result.error || "종 설정 저장에 실패했습니다.")
      }
    } catch (error) {
      console.error("Failed to save species settings:", error)
      toast.error("종 설정 저장에 실패했습니다.")
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = categories.reduce(
    (sum, cat) => sum + cat.species.filter(sp => sp.selected).length,
    0
  )

  return (
    <Dialog open={open} onOpenChange={required ? undefined : onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[80vh] flex flex-col"
        showCloseButton={!required}
        onInteractOutside={required ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={required ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>관리 종 선택</DialogTitle>
          <DialogDescription>
            관리할 종을 선택하세요. 선택한 종만 개체 등록, 검색 등에 표시됩니다.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            등록된 카테고리가 없습니다. 관리자에게 문의해주세요.
          </div>
        ) : (
          <Accordion type="multiple" value={expandedIds} onValueChange={setExpandedIds} className="overflow-y-auto flex-1 pr-1">
            {categories.map(category => {
              const allSelected =
                category.species.length > 0 && category.species.every(sp => sp.selected)
              const someSelected = category.species.some(sp => sp.selected) && !allSelected

              return (
                <AccordionItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-3 px-1">
                    <Checkbox
                      id={`cat-${category.id}`}
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={() => handleToggleCategory(category.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <AccordionTrigger className="flex-1 py-3">
                      <span className="font-semibold text-sm">
                        {category.name}
                        <span className="text-xs text-muted-foreground ml-2 font-normal">
                          ({category.species.filter(sp => sp.selected).length}/{category.species.length})
                        </span>
                      </span>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent>
                    <div className="pl-7 space-y-2.5 pb-1">
                      {category.species.length === 0 ? (
                        <p className="text-sm text-muted-foreground">등록된 종이 없습니다.</p>
                      ) : (
                        category.species.map(sp => (
                          <div key={sp.id} className="flex items-start gap-3">
                            <Checkbox
                              id={`sp-${sp.id}`}
                              checked={sp.selected}
                              onCheckedChange={() => handleToggleSpecies(category.id, sp.id)}
                            />
                            <label htmlFor={`sp-${sp.id}`} className="cursor-pointer select-none">
                              <div className="text-sm font-medium">{sp.name}</div>
                              {sp.scientificName && (
                                <div className="text-xs text-muted-foreground italic">
                                  {sp.scientificName}
                                </div>
                              )}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">{selectedCount}개 종 선택됨</span>
          <div className="flex gap-2">
            {!required && (
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                취소
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || loading || selectedCount === 0}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
