'use client'

import { Label } from '@/components/ui/label'
import { AcquisitionType } from '@prisma/client'
import { ParentInfoAlert } from '@/components/shared/parent-info-alert'
import { ParentSearchInput } from '@/components/shared/parent-search-input'
import { ParentList, ParentInfo } from '@/components/shared/parent-list'
import { ParentSearchResults } from '@/components/shared/parent-search-results'
import { useParentSearch } from '@/hooks/use-parent-search'

interface Step4ParentSelectionProps {
  acquisitionType: AcquisitionType | null
  fathers: ParentInfo[]
  mothers: ParentInfo[]
  onFathersChange: (fathers: ParentInfo[]) => void
  onMothersChange: (mothers: ParentInfo[]) => void
}

export function Step4ParentSelection({
  acquisitionType,
  fathers,
  mothers,
  onFathersChange,
  onMothersChange,
}: Step4ParentSelectionProps) {
  const fatherSearch = useParentSearch('father')
  const motherSearch = useParentSearch('mother')

  const isHatching = acquisitionType === 'HATCHING'

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
    onFathersChange([...fathers, parent])
    fatherSearch.clearSearchResults()
    fatherSearch.setSearchId('')
  }

  // 검색 결과에서 모 선택
  const handleSelectMother = (parent: ParentInfo) => {
    onMothersChange([...mothers, parent])
    motherSearch.clearSearchResults()
    motherSearch.setSearchId('')
  }

  // 부 삭제
  const handleRemoveFather = (uniqueId: string) => {
    onFathersChange(fathers.filter((f) => f.uniqueId !== uniqueId))
  }

  // 모 삭제
  const handleRemoveMother = (uniqueId: string) => {
    onMothersChange(mothers.filter((m) => m.uniqueId !== uniqueId))
  }

  return (
    <div className="space-y-6">
      <ParentInfoAlert isHatching={isHatching} />

      {/* 부 (Father) */}
      <div className="space-y-3">
        <Label className="text-base">
          부 {isHatching && <span className="text-red-500">*</span>}
        </Label>

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
        <Label className="text-base">
          모 {isHatching && <span className="text-red-500">*</span>}
        </Label>

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
  )
}
