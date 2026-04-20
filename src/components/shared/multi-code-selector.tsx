'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronDown } from 'lucide-react'
import { getSpeciesAction } from '@/actions/codes/get-species'
import { getChildCodesAction } from '@/actions/codes/get-child-codes'
import type { CodeCategory } from '@prisma/client'

interface CodeItem {
  id: string
  code: string
  name: string
}

interface MultiCodeSelectorProps {
  category: CodeCategory
  selectedCodeIds: string[]
  onChange: (codeIds: string[]) => void
  placeholder?: string
}

export function MultiCodeSelector({
  category,
  selectedCodeIds,
  onChange,
  placeholder = '선택하세요',
}: MultiCodeSelectorProps) {
  const [codes, setCodes] = useState<CodeItem[]>([])
  const [species, setSpecies] = useState<CodeItem[]>([])
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  // 종 목록 로드 (MORPH, TRAIT인 경우)
  useEffect(() => {
    async function loadSpecies() {
      if (category === 'MORPH' || category === 'TRAIT' || category === 'COLOR') {
        const result = await getSpeciesAction()
        if (result.success && result.data) {
          setSpecies(result.data)
          // 첫 번째 종 자동 선택
          if (result.data.length > 0) {
            setSelectedSpeciesId(result.data[0].id)
          }
        }
      }
    }
    loadSpecies()
  }, [category])

  // 코드 목록 로드
  useEffect(() => {
    async function loadCodes() {
      if (category === 'MORPH' || category === 'TRAIT' || category === 'COLOR') {
        if (!selectedSpeciesId) return

        const result = await getChildCodesAction(selectedSpeciesId)
        if (result.success && result.data) {
          if (category === 'MORPH') {
            setCodes(result.data.morphs)
          } else if (category === 'TRAIT') {
            setCodes(result.data.traits)
          } else if (category === 'COLOR') {
            setCodes(result.data.colors)
          }
        }
      }
    }
    loadCodes()
  }, [category, selectedSpeciesId])

  const handleToggle = (codeId: string) => {
    const isSelected = selectedCodeIds.includes(codeId)
    if (isSelected) {
      onChange(selectedCodeIds.filter((id) => id !== codeId))
    } else {
      onChange([...selectedCodeIds, codeId])
    }
  }

  const getDisplayText = () => {
    if (selectedCodeIds.length === 0) {
      return placeholder
    }
    const selectedNames = codes
      .filter((code) => selectedCodeIds.includes(code.id))
      .map((code) => code.name)

    if (selectedNames.length === 0) {
      return `${selectedCodeIds.length}개 선택됨`
    }

    if (selectedNames.length === 1) {
      return selectedNames[0]
    }

    return `${selectedNames[0]} 외 ${selectedNames.length - 1}개`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto">
          {/* 종 선택 (MORPH, TRAIT인 경우) */}
          {(category === 'MORPH' || category === 'TRAIT' || category === 'COLOR') && species.length > 0 && (
            <div className="border-b p-2">
              <select
                className="w-full px-2 py-1 text-sm border rounded"
                value={selectedSpeciesId}
                onChange={(e) => setSelectedSpeciesId(e.target.value)}
              >
                {species.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 코드 목록 */}
          <div className="p-2 space-y-2">
            {codes.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                선택 가능한 항목이 없습니다
              </div>
            ) : (
              codes.map((code) => (
                <div key={code.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`code-${code.id}`}
                    checked={selectedCodeIds.includes(code.id)}
                    onCheckedChange={() => handleToggle(code.id)}
                  />
                  <Label
                    htmlFor={`code-${code.id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {code.name}
                  </Label>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
