'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Check, RotateCcw } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import { updateAnimalParents } from '@/actions/animals/update-animal-parents'
import { ParentInfoAlert } from '@/components/shared/parent-info-alert'
import { ParentSearchInput } from '@/components/shared/parent-search-input'
import { ParentList, ParentInfo } from '@/components/shared/parent-list'
import { ParentSearchResults } from '@/components/shared/parent-search-results'
import { useParentSearch } from '@/hooks/use-parent-search'

interface Parent {
  id: string
  name: string | null
  uniqueId: string
  gender: string
  images?: Array<{
    imageUrl: string
  }>
  codes?: Array<{
    code: {
      id: string
      category: string
      name: string
    }
  }>
}

interface AnimalParent {
  parentType: 'FATHER' | 'MOTHER'
  parent: Parent
}

interface AnimalParentInfoProps {
  animalId: string
  acquisitionType: 'ADOPTION' | 'HATCHING'
  parents: AnimalParent[]
  onUpdate?: () => void
}

export function AnimalParentInfo({
  animalId,
  acquisitionType,
  parents,
  onUpdate,
}: AnimalParentInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    name: string
    uniqueId: string
  } | null>(null)
  const isMobile = useIsMobile()

  // 부모 상태
  const [fathers, setFathers] = useState<ParentInfo[]>([])
  const [mothers, setMothers] = useState<ParentInfo[]>([])

  // Custom hooks for search
  const fatherSearch = useParentSearch('father', animalId)
  const motherSearch = useParentSearch('mother', animalId)

  const isHatching = acquisitionType === 'HATCHING'

  // 현재 부모 정보 가져오기
  const currentFathers = parents
    .filter((p) => p.parentType === 'FATHER')
    .map((p) => p.parent)
  const currentMothers = parents
    .filter((p) => p.parentType === 'MOTHER')
    .map((p) => p.parent)

  const handleEdit = () => {
    setIsEditing(true)
    // 현재 부모 정보로 초기화
    setFathers(
      currentFathers.map((p) => ({
        id: p.id,
        name: p.name,
        uniqueId: p.uniqueId,
        gender: p.gender,
        imageUrl: p.images?.[0]?.imageUrl,
        speciesName: p.codes?.find((c) => c.code.category === 'SPECIES')?.code
          .name,
        morphName: p.codes?.find((c) => c.code.category === 'MORPH')?.code.name,
      }))
    )
    setMothers(
      currentMothers.map((p) => ({
        id: p.id,
        name: p.name,
        uniqueId: p.uniqueId,
        gender: p.gender,
        imageUrl: p.images?.[0]?.imageUrl,
        speciesName: p.codes?.find((c) => c.code.category === 'SPECIES')?.code
          .name,
        morphName: p.codes?.find((c) => c.code.category === 'MORPH')?.code.name,
      }))
    )
    fatherSearch.setSearchId('')
    motherSearch.setSearchId('')
    fatherSearch.clearError()
    motherSearch.clearError()
    fatherSearch.clearSearchResults()
    motherSearch.clearSearchResults()
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFathers([])
    setMothers([])
    fatherSearch.setSearchId('')
    motherSearch.setSearchId('')
    fatherSearch.clearError()
    motherSearch.clearError()
    fatherSearch.clearSearchResults()
    motherSearch.clearSearchResults()
  }

  // 부 검색
  const handleSearchFather = () => {
    fatherSearch.handleSearch(fathers)
  }

  // 모 검색
  const handleSearchMother = () => {
    motherSearch.handleSearch(mothers)
  }

  // 검색 결과에서 부 선택
  const handleSelectFather = (parent: ParentInfo) => {
    setFathers([...fathers, parent])
    fatherSearch.clearSearchResults()
    fatherSearch.setSearchId('')
  }

  // 검색 결과에서 모 선택
  const handleSelectMother = (parent: ParentInfo) => {
    setMothers([...mothers, parent])
    motherSearch.clearSearchResults()
    motherSearch.setSearchId('')
  }

  // 부 삭제
  const handleRemoveFather = (uniqueId: string) => {
    setFathers(fathers.filter((f) => f.uniqueId !== uniqueId))
  }

  // 모 삭제
  const handleRemoveMother = (uniqueId: string) => {
    setMothers(mothers.filter((m) => m.uniqueId !== uniqueId))
  }

  const handleSave = async () => {
    // 해칭인 경우 부모 유효성 검사
    if (isHatching && (fathers.length === 0 || mothers.length === 0)) {
      toast.warning('저장 실패', {
        description: '해칭 개체는 부와 모를 각각 최소 1개씩 입력해야 합니다.',
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await updateAnimalParents({
        animalId,
        father1Id: fathers[0]?.id || null,
        father2Id: fathers[1]?.id || null,
        mother1Id: mothers[0]?.id || null,
        mother2Id: mothers[1]?.id || null,
      })

      if (result.success) {
        toast.success('저장 완료', {
          description: '부모 정보가 업데이트되었습니다.',
        })
        setIsEditing(false)
        onUpdate?.()
      } else {
        toast.warning('저장 실패', {
          description: result.error || '부모 정보 업데이트에 실패했습니다.',
        })
      }
    } catch (error) {
      toast.warning('저장 실패', {
        description: '부모 정보 업데이트 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const genderToText = (g: string) => {
    return g === 'MALE' ? '수컷' : g === 'FEMALE' ? '암컷' : '미구분'
  }

  const renderParentCard = (parent: Parent, label: string) => {
    const speciesName = parent.codes?.find((c) => c.code.category === 'SPECIES')
      ?.code.name
    const morphName = parent.codes?.find((c) => c.code.category === 'MORPH')?.code
      .name
    const imageUrl = parent.images?.[0]?.imageUrl

    if (isMobile) {
      return (
        <div
          key={parent.id}
          className="rounded-xl overflow-hidden bg-gray-50 active:opacity-80 transition-opacity"
          onClick={() => imageUrl && setSelectedImage({
            url: imageUrl,
            name: parent.name || parent.uniqueId,
            uniqueId: parent.uniqueId,
          })}
        >
          <div className="relative aspect-square bg-gray-100">
            {imageUrl ? (
              <img src={imageUrl} alt={parent.name || '부모 개체'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[13px]">
                없음
              </div>
            )}
            <span className="absolute top-2 left-2 bg-black/50 text-white text-[11px] px-2 py-0.5 rounded-full">
              {label}
            </span>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-[14px] font-medium truncate">{parent.name || parent.uniqueId}</p>
            {morphName && (
              <p className="text-[13px] text-muted-foreground truncate mt-0.5">{morphName}</p>
            )}
          </div>
        </div>
      )
    }

    return (
      <Card key={parent.id} className="p-0 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* 왼쪽: 이미지 */}
            <div className="w-24 h-24 shrink-0 relative rounded-lg overflow-hidden bg-muted">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={parent.name || '부모 개체'}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    setSelectedImage({
                      url: imageUrl,
                      name: parent.name || parent.uniqueId,
                      uniqueId: parent.uniqueId,
                    })
                  }
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  이미지 없음
                </div>
              )}
            </div>

            {/* 오른쪽: 기본 정보 */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-xs text-muted-foreground font-medium mb-2">
                {label}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground min-w-[60px] shrink-0">
                    개체명
                  </span>
                  <span className="text-sm font-medium">
                    {parent.name || parent.uniqueId}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground min-w-[60px] shrink-0">
                    개체ID
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {parent.uniqueId}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground min-w-[60px] shrink-0">
                    성별
                  </span>
                  <span className="text-xs font-medium">
                    {genderToText(parent.gender)}
                  </span>
                </div>
                {(speciesName || morphName) && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground min-w-[60px] shrink-0">
                      종·모프
                    </span>
                    <span className="text-xs font-medium">
                      {[speciesName, morphName].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">부모 정보</h3>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-7 w-7 shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-7 w-7"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7 w-7"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className={isMobile ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
          {/* 읽기 모드 */}
          {currentFathers.length === 0 && currentMothers.length === 0 ? (
            <div className={`text-sm text-muted-foreground py-4 text-center ${isMobile ? 'col-span-2' : ''}`}>
              등록된 부모 정보가 없습니다.
            </div>
          ) : (
            <>
              {currentFathers.map((father, index) =>
                renderParentCard(father, `부(父) ${index + 1}`)
              )}
              {currentMothers.map((mother, index) =>
                renderParentCard(mother, `모(母) ${index + 1}`)
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 편집 모드 */}
          <ParentInfoAlert isHatching={isHatching} />

          {/* 부 (Father) */}
          <div className="space-y-3">
            <div className="text-sm font-medium">
              부 {isHatching && <span className="text-red-500">*</span>}
            </div>

            {/* 검색 입력 */}
            {fathers.length < 2 && (
              <div className="relative">
                <ParentSearchInput
                  searchId={fatherSearch.searchId}
                  onSearchIdChange={(value) => {
                    fatherSearch.setSearchId(value)
                    fatherSearch.clearError()
                    fatherSearch.clearSearchResults()
                  }}
                  onSearch={handleSearchFather}
                  searching={fatherSearch.searching}
                  error={fatherSearch.error}
                  disabled={fathers.length >= 2}
                  placeholder="개체 ID 또는 이름으로 검색"
                />

                {/* 검색 결과 */}
                {fatherSearch.searchResults.length > 0 && (
                  <ParentSearchResults
                    results={fatherSearch.searchResults}
                    onSelect={handleSelectFather}
                    currentParents={fathers}
                  />
                )}
              </div>
            )}

            {/* 추가된 부 목록 */}
            <ParentList
              parents={fathers}
              onRemove={handleRemoveFather}
              emptyMessage="개체 ID로 부를 검색하여 추가하세요"
            />
          </div>

          {/* 모 (Mother) */}
          <div className="space-y-3">
            <div className="text-sm font-medium">
              모 {isHatching && <span className="text-red-500">*</span>}
            </div>

            {/* 검색 입력 */}
            {mothers.length < 2 && (
              <div className="relative">
                <ParentSearchInput
                  searchId={motherSearch.searchId}
                  onSearchIdChange={(value) => {
                    motherSearch.setSearchId(value)
                    motherSearch.clearError()
                    motherSearch.clearSearchResults()
                  }}
                  onSearch={handleSearchMother}
                  searching={motherSearch.searching}
                  error={motherSearch.error}
                  disabled={mothers.length >= 2}
                  placeholder="개체 ID 또는 이름으로 검색"
                />

                {/* 검색 결과 */}
                {motherSearch.searchResults.length > 0 && (
                  <ParentSearchResults
                    results={motherSearch.searchResults}
                    onSelect={handleSelectMother}
                    currentParents={mothers}
                  />
                )}
              </div>
            )}

            {/* 추가된 모 목록 */}
            <ParentList
              parents={mothers}
              onRemove={handleRemoveMother}
              emptyMessage="개체 ID로 모를 검색하여 추가하세요"
            />
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
