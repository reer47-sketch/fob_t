'use client'

import { format } from 'date-fns'
import { Gender, AcquisitionType } from '@prisma/client'
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface Code {
  id: string
  code: string
  name: string
  category?: string
}

interface ParentInfo {
  id: string
  name: string | null
  uniqueId: string
  gender: string
  imageUrl?: string
  speciesName?: string
  morphName?: string
}

interface Step5FinalReviewProps {
  imagePreview: string | null
  speciesId: string | null
  primaryMorphId: string | null
  comboMorphIds: string[]
  name: string
  gender: Gender | null
  acquisitionType: AcquisitionType | null
  acquisitionDate: Date | null
  hatchDate: Date | null
  isBreeding: boolean
  fathers: ParentInfo[]
  mothers: ParentInfo[]
  speciesList: Code[]
  morphList: Code[]
}

export function Step5FinalReview({
  imagePreview,
  speciesId,
  primaryMorphId,
  comboMorphIds,
  name,
  gender,
  acquisitionType,
  acquisitionDate,
  hatchDate,
  isBreeding,
  fathers,
  mothers,
  speciesList,
  morphList,
}: Step5FinalReviewProps) {
  // 종 이름 찾기
  const speciesName = speciesList.find((s) => s.id === speciesId)?.name || ''

  // 모프 이름 찾기
  const primaryMorphName = morphList.find((m) => m.id === primaryMorphId)?.name || ''

  // 콤보 모프 이름들 찾기
  const comboMorphNames = comboMorphIds
    .map(id => morphList.find(m => m.id === id)?.name)
    .filter(Boolean) as string[]

  return (
    <div className="space-y-4">
      {/* 사진 */}
      {imagePreview && (
        <div className="w-full aspect-video relative rounded-lg overflow-hidden bg-gray-100">
          <img
            src={imagePreview}
            alt="촬영된 사진"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <Card>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <span className="text-sm font-medium text-gray-700">이름</span>
            <span className="col-span-2 text-sm text-gray-900">{name}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-sm font-medium text-gray-700">성별</span>
            <span className="col-span-2 text-sm text-gray-900">
              {gender === 'MALE'
                ? '수컷'
                : gender === 'FEMALE'
                  ? '암컷'
                  : '미확인'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-sm font-medium text-gray-700">
              입양/해칭
            </span>
            <span className="col-span-2 text-sm text-gray-900">
              {acquisitionType === 'ADOPTION' ? '입양' : '해칭'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-sm font-medium text-gray-700">
              등록일
            </span>
            <span className="col-span-2 text-sm text-gray-900">
              {acquisitionDate && format(acquisitionDate, 'yyyy년 MM월 dd일')}
            </span>
          </div>
          {hatchDate && (
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium text-gray-700">해칭일</span>
              <span className="col-span-2 text-sm text-gray-900">
                {format(hatchDate, 'yyyy년 MM월 dd일')}
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <span className="text-sm font-medium text-gray-700">종</span>
            <span className="col-span-2 text-sm text-gray-900">
              {speciesName || '미선택'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-sm font-medium text-gray-700">모프</span>
            <span className="col-span-2 text-sm text-gray-900">
              {primaryMorphName || '미선택'}
            </span>
          </div>
          {comboMorphNames.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium text-gray-700">콤보 모프</span>
              <span className="col-span-2 text-sm text-gray-900">
                {comboMorphNames.join(', ')}
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <span className="text-sm font-medium text-gray-700">
              브리딩 대상
            </span>
            <span className="col-span-2 text-sm text-gray-900">
              {isBreeding ? '예' : '아니오'}
            </span>
          </div>

          {/* 부모 정보 */}
          {(fathers.length > 0 || mothers.length > 0) && (
            <>
              {fathers.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <span className="text-sm font-medium text-gray-700">부</span>
                  <div className="col-span-2 space-y-1">
                    {fathers.map((father) => (
                      <div key={father.id} className="text-sm text-gray-900">
                        {father.name || '이름 없음'} ({father.uniqueId})
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {mothers.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm font-medium text-gray-700">모</span>
                  <div className="col-span-2 space-y-1">
                    {mothers.map((mother) => (
                      <div key={mother.id} className="text-sm text-gray-900">
                        {mother.name || '이름 없음'} ({mother.uniqueId})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
