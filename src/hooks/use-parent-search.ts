import { useState } from 'react'
import { searchParentAnimals } from '@/actions/animals/search-parent-animals'
import { ParentInfo } from '@/components/shared/parent-list'

type ParentType = 'father' | 'mother'

export function useParentSearch(type: ParentType, excludeAnimalId?: string) {
  const [searchId, setSearchId] = useState('')
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ParentInfo[]>([])

  const handleSearch = async (currentParents: ParentInfo[]) => {
    if (!searchId.trim()) {
      setError('개체 ID를 입력해주세요')
      return
    }

    if (currentParents.length >= 2) {
      setError('최대 2개까지만 추가할 수 있습니다')
      return
    }

    // 이미 추가된 개체인지 확인
    if (currentParents.some((p) => p.uniqueId === searchId.trim())) {
      setError('이미 추가된 개체입니다')
      return
    }

    setSearching(true)
    setError('')
    setSearchResults([])

    try {
      const result = await searchParentAnimals(
        searchId.trim(),
        type === 'father' ? 'MALE' : 'FEMALE',
        excludeAnimalId
      )

      if (!result.success) {
        const errorMessage =
          'error' in result
            ? result.error
            : `브리딩 가능한 ${type === 'father' ? '수컷' : '암컷'} 개체를 찾을 수 없습니다`
        setError(errorMessage)
        return
      }

      // 타입 가드: success가 true일 때만 data에 접근
      if ('data' in result) {
        // 결과를 ParentInfo 배열로 변환
        const parentInfos: ParentInfo[] = result.data.map((animal) => ({
          id: animal.id,
          name: animal.name,
          uniqueId: animal.uniqueId,
          gender: animal.gender,
          imageUrl: animal.imageUrl,
          speciesName: animal.speciesName,
          morphName: animal.morphName,
        }))

        setSearchResults(parentInfos)
      }
    } catch (error) {
      console.error(`${type} search error:`, error)
      setError('개체 검색 중 오류가 발생했습니다')
    } finally {
      setSearching(false)
    }
  }

  const clearError = () => setError('')
  const clearSearchResults = () => setSearchResults([])

  return {
    searchId,
    setSearchId,
    error,
    searching,
    searchResults,
    handleSearch,
    clearError,
    clearSearchResults,
  }
}
