'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MoreVertical, Eye, CreditCard, Heart } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { AnimalListItem } from '@/services/animal-service'
import { Gender, AcquisitionType, Quality } from '@prisma/client'

interface AnimalListTableProps {
  animals: AnimalListItem[]
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onViewDetail: (animalId: string) => void
  onViewCard: (animalId: string) => void
  onManageBreeding: (animalId: string) => void
}

export function AnimalListTable({
  animals,
  selectedIds,
  onSelectionChange,
  onViewDetail,
  onViewCard,
  onManageBreeding,
}: AnimalListTableProps) {
  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'yyyy-MM-dd', { locale: ko })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(animals.map((animal) => animal.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (animalId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, animalId])
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== animalId))
    }
  }

  const getGenderLabel = (gender: Gender) => {
    switch (gender) {
      case 'MALE':
        return '수컷'
      case 'FEMALE':
        return '암컷'
      case 'UNKNOWN':
        return '미구분'
    }
  }

  const getAcquisitionTypeLabel = (type: AcquisitionType) => {
    return type === 'ADOPTION' ? '입양' : '해칭'
  }

  const getGenderBadgeClass = (gender: Gender) => {
    switch (gender) {
      case 'MALE':
        return 'bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300'
      case 'FEMALE':
        return 'bg-pink-100 text-pink-700 hover:bg-pink-100 dark:bg-pink-950 dark:text-pink-300'
      case 'UNKNOWN':
        return ''
    }
  }

  const getAcquisitionTypeBadgeClass = (type: AcquisitionType) => {
    return type === 'ADOPTION'
      ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300'
      : 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300'
  }

  const getQualityLabel = (quality?: Quality | null) => {
    if (!quality) return '-'
    return quality // S, A, B, C 그대로 표시
  }

  // 코드 카테고리별로 분류
  const getCodesByCategory = (animal: AnimalListItem) => {
    const species = animal.codes.find(c => c.code.category === 'SPECIES')?.code
    const morphCodes = animal.codes.filter(c => c.code.category === 'MORPH')
    const traitCodes = animal.codes.filter(c => c.code.category === 'TRAIT')

    // 대표 모프 찾기 (isPrimary가 true인 것), 없으면 첫 번째
    const primaryMorph = morphCodes.find(c => c.isPrimary) || morphCodes[0]
    const allMorphs = morphCodes.map(c => c.code.name)

    // 형질은 첫 번째 것만
    const primaryTrait = traitCodes[0]
    const allTraits = traitCodes.map(c => c.code.name)

    return {
      species,
      primaryMorph,
      allMorphs,
      primaryTrait,
      allTraits
    }
  }

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden h-full">
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary z-10">
            <TableRow>
              <TableHead className="w-[40px] px-4">
                <Checkbox
                  checked={
                    animals.length > 0 && selectedIds.length === animals.length
                  }
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>개체 이름</TableHead>
              <TableHead>고유개체ID</TableHead>
              <TableHead>종</TableHead>
              <TableHead>모프</TableHead>
              <TableHead>형질</TableHead>
              <TableHead>성별</TableHead>
              <TableHead>입양/해칭</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead>해칭일</TableHead>
              <TableHead>브리딩 대상</TableHead>
              <TableHead>공개여부</TableHead>
              <TableHead>등급</TableHead>
              <TableHead>분양일</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {animals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="h-[400px] text-center text-muted-foreground">
                  개체가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              animals.map((animal) => {
                const { species, primaryMorph, allMorphs, primaryTrait, allTraits } = getCodesByCategory(animal)
                return (
                  <TableRow key={animal.id} data-state={selectedIds.includes(animal.id) && "selected"}>
                    <TableCell className="px-4">
                      <Checkbox
                        checked={selectedIds.includes(animal.id)}
                        onCheckedChange={(checked) => handleSelectOne(animal.id, checked as boolean)}
                        aria-label={`Select ${animal.name || animal.uniqueId}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{animal.name}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => onViewDetail(animal.id)}
                        className="font-mono text-sm hover:underline cursor-pointer bg-transparent border-none p-0"
                      >
                        {animal.uniqueId}
                      </button>
                    </TableCell>
                    <TableCell>
                      {species ? (
                        <Badge variant="secondary">{species.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {primaryMorph ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <Badge variant="outline" className="text-xs">
                                {primaryMorph.code.name}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          {allMorphs.length > 1 && (
                            <TooltipContent>
                              <div className="flex flex-col gap-1">
                                {allMorphs.map((morph, idx) => (
                                  <div key={idx}>{morph}</div>
                                ))}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {primaryTrait ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <Badge variant="outline" className="text-xs">
                                {primaryTrait.code.name}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          {allTraits.length > 1 && (
                            <TooltipContent>
                              <div className="flex flex-col gap-1">
                                {allTraits.map((trait, idx) => (
                                  <div key={idx}>{trait}</div>
                                ))}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getGenderBadgeClass(animal.gender)} variant={animal.gender === 'UNKNOWN' ? 'secondary' : undefined}>
                        {getGenderLabel(animal.gender)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getAcquisitionTypeBadgeClass(animal.acquisitionType)}>
                        {getAcquisitionTypeLabel(animal.acquisitionType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(animal.acquisitionDate)}</TableCell>
                    <TableCell>
                      {animal.hatchDate ? (
                        formatDate(animal.hatchDate)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={animal.isBreeding ? 'default' : 'secondary'}>
                        {animal.isBreeding ? '대상' : '비대상'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={animal.isPublic ? 'default' : 'secondary'}>
                        {animal.isPublic ? '공개' : '비공개'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {animal.detail?.quality ? getQualityLabel(animal.detail.quality) : '-'}
                    </TableCell>
                    <TableCell>
                      {animal.adoption ? (
                        formatDate(animal.adoption.adoptionDate)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetail(animal.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          개체 상세
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem onClick={() => onViewCard(animal.id)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          개체카드
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManageBreeding(animal.id)}>
                          <Heart className="mr-2 h-4 w-4" />
                          브리딩 관리
                        </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
