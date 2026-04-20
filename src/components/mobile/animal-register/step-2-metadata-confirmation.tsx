'use client'

import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, MapPin } from 'lucide-react'

interface Step2MetadataConfirmationProps {
  imagePreview: string | null
  metadata: {
    capturedAt: Date | null
    capturedAtSource: 'exif' | 'fallback' | null
    location: { lat: number; lng: number } | null
    locationSource: 'exif' | 'browser' | null
  }
}

export function Step2MetadataConfirmation({
  imagePreview,
  metadata,
}: Step2MetadataConfirmationProps) {
  return (
    <div className="flex flex-col">
      {/* 메타데이터 카드 - 상단 */}
      <div className="pb-3 bg-white">
        <Card>
          <CardContent className="space-y-4">
            {/* 촬영 일시 */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">촬영 일시</p>
                <p className="text-sm text-gray-600 mt-1">
                  {metadata.capturedAt
                    ? format(metadata.capturedAt, 'yyyy년 MM월 dd일 HH:mm:ss')
                    : '알 수 없음'}
                </p>
              </div>
            </div>

            {/* 위치 */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">위치</p>
                <p className="text-sm text-gray-600 mt-1">
                  {metadata.location
                    ? `위도: ${metadata.location.lat.toFixed(6)}, 경도: ${metadata.location.lng.toFixed(6)}`
                    : '위치 정보 없음'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 사진 미리보기 */}
      {imagePreview && (
        <div className="mt-4 relative bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={imagePreview}
            alt="촬영된 사진"
            className="w-full max-h-[400px] object-contain"
          />
        </div>
      )}
    </div>
  )
}
