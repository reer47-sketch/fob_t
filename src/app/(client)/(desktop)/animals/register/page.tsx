'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import exifr from 'exifr'
import { Gender, AcquisitionType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Loader2, Camera, CheckCircle2, Home, Eye } from 'lucide-react'
import { createAnimal } from '@/actions/animals/create-animal'
import { getEggRegisterData } from '@/actions/breeding-management/register-hatched-animal'
import { linkEggAnimal } from '@/actions/breeding-management/link-egg-animal'
import type { EggRegisterData } from '@/services/breeding-management-service'
import { StepProgressBar } from '@/components/mobile/animal-register/step-progress-bar'
import { Step1PhotoCapture } from '@/components/mobile/animal-register/step-1-photo-capture'
import { Step2MetadataConfirmation } from '@/components/mobile/animal-register/step-2-metadata-confirmation'
import { Step3BasicInfo } from '@/components/mobile/animal-register/step-3-basic-info'
import { Step4ParentSelection } from '@/components/mobile/animal-register/step-4-parent-selection'
import { Step5FinalReview } from '@/components/mobile/animal-register/step-5-final-review'
import { CameraInputHandle } from '@/components/ui/camera-input'
import { AnimalDetailSheet } from '@/app/(client)/(desktop)/animals/_components/animal-detail-sheet'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

// 스텝 정의
const STEPS = [
  { title: '사진 등록' },
  { title: '정보 확인' },
  { title: '필수 정보' },
  { title: '부모 정보' },
  { title: '최종 확인' },
]

// 코드 타입
interface Code {
  id: string
  code: string
  name: string
  category?: string
}

// 부모 정보 타입
interface ParentInfo {
  id: string
  name: string | null
  uniqueId: string
  gender: string
  imageUrl?: string
  speciesName?: string
  morphName?: string
}

// 폼 데이터 타입
interface RegistrationFormData {
  // Step 1
  imageFile: File | null
  imagePreview: string | null

  // Step 2
  metadata: {
    capturedAt: Date | null
    capturedAtSource: 'exif' | 'fallback' | null
    location: { lat: number; lng: number } | null
    locationSource: 'exif' | 'browser' | null
  }

  // Step 3
  speciesId: string | null
  primaryMorphId: string | null
  comboMorphIds: string[]
  name: string
  gender: Gender | null
  acquisitionType: AcquisitionType | null
  acquisitionDate: Date | null
  hatchDate: Date | null
  isBreeding: boolean

  // Step 4
  fathers: ParentInfo[]
  mothers: ParentInfo[]
}

export default function AnimalRegister() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eggId = searchParams.get('eggId')
  const { state: sidebarState } = useSidebar()
  const cameraInputRef = useRef<CameraInputHandle>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registeredAnimal, setRegisteredAnimal] = useState<any>(null)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)

  // 알에서 넘어온 경우 데이터 보관
  const [eggData, setEggData] = useState<EggRegisterData | null>(null)

  // 종/모프 데이터 저장 (Step 3에서 로드한 데이터를 Step 5에서 재사용)
  const [speciesList, setSpeciesList] = useState<Code[]>([])
  const [morphList, setMorphList] = useState<Code[]>([])

  // 폼 데이터
  const [formData, setFormData] = useState<RegistrationFormData>({
    imageFile: null,
    imagePreview: null,
    metadata: {
      capturedAt: null,
      capturedAtSource: null,
      location: null,
      locationSource: null,
    },
    speciesId: null,
    primaryMorphId: null,
    comboMorphIds: [],
    name: '',
    gender: null,
    acquisitionType: null,
    acquisitionDate: null,
    hatchDate: null,
    isBreeding: false,
    fathers: [],
    mothers: [],
  })

  // eggId가 있으면 알 데이터 fetch → 폼 자동 세팅
  useEffect(() => {
    if (!eggId) return
    ;(async () => {
      const result = await getEggRegisterData({ eggId })
      if (!result.success || !('data' in result)) return
      const data = result.data
      setEggData(data)

      const hatchDate = data.hatchDate ? new Date(data.hatchDate) : new Date()
      setFormData((prev) => ({
        ...prev,
        acquisitionType: 'HATCHING' as AcquisitionType,
        acquisitionDate: hatchDate,
        hatchDate,
        gender: 'UNKNOWN',
        speciesId: data.speciesId,
        primaryMorphId: data.primaryMorphId,
        fathers: [
          ...(data.male ? [{
            id: data.male.id,
            name: data.male.name,
            uniqueId: data.male.uniqueId,
            gender: data.male.gender,
            imageUrl: data.male.imageUrl ?? undefined,
            speciesName: data.male.species ?? undefined,
            morphName: data.male.morph ?? undefined,
          }] : []),
          ...(data.male2 ? [{
            id: data.male2.id,
            name: data.male2.name,
            uniqueId: data.male2.uniqueId,
            gender: data.male2.gender,
            imageUrl: data.male2.imageUrl ?? undefined,
            speciesName: data.male2.species ?? undefined,
            morphName: data.male2.morph ?? undefined,
          }] : []),
        ],
        mothers: [{
          id: data.female.id,
          name: data.female.name,
          uniqueId: data.female.uniqueId,
          gender: data.female.gender,
          imageUrl: data.female.imageUrl ?? undefined,
          speciesName: data.female.species ?? undefined,
          morphName: data.female.morph ?? undefined,
        }],
      }))
    })()
  }, [eggId])

  // capturedAt이 변경되면 acquisitionDate를 자동으로 설정
  useEffect(() => {
    if (formData.metadata.capturedAt && !formData.acquisitionDate) {
      // capturedAt의 시간까지 그대로 acquisitionDate에 설정
      setFormData((prev) => ({ ...prev, acquisitionDate: formData.metadata.capturedAt }))
    }
  }, [formData.metadata.capturedAt, formData.acquisitionDate])

  // currentStep이 변경될 때마다 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  // 브라우저 뒤로가기 방지 및 탭 닫기 경고
  useEffect(() => {
    if (currentStep === 6) return // 성공 화면에서는 방지하지 않음

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    const handlePopState = () => {
      if (window.confirm('진행 중인 등록이 취소됩니다. 나가시겠습니까?')) {
        router.push('/animals')
      } else {
        window.history.pushState(null, '', window.location.href)
      }
    }

    window.history.pushState(null, '', window.location.href)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [currentStep, router])


  // Step 1: 사진 촬영
  const handleImageCapture = async (file: File) => {
    const preview = URL.createObjectURL(file)

    // EXIF 메타데이터 추출
    try {
      const exifData = await exifr.parse(file)

      let capturedAt: Date | null = null
      let location: { lat: number; lng: number } | null = null

      let capturedAtSource: 'exif' | 'fallback' = 'fallback'
      let locationSource: 'exif' | 'browser' | null = null

      // 촬영 날짜 추출
      if (exifData?.DateTimeOriginal) {
        capturedAt = new Date(exifData.DateTimeOriginal)
        capturedAtSource = 'exif'
      } else if (exifData?.DateTime) {
        capturedAt = new Date(exifData.DateTime)
        capturedAtSource = 'exif'
      }

      // GPS 위치 추출
      if (exifData?.latitude && exifData?.longitude) {
        location = {
          lat: exifData.latitude,
          lng: exifData.longitude,
        }
        locationSource = 'exif'
      }

      // EXIF 데이터가 없으면 fallback
      if (!capturedAt) {
        capturedAt = new Date()
        capturedAtSource = 'fallback'
      }

      if (!location && navigator.geolocation) {
        // 브라우저 위치 정보 요청 (비동기)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData((prev) => ({
              ...prev,
              metadata: {
                ...prev.metadata,
                location: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                },
                locationSource: 'browser',
              },
            }))
          },
          (error) => {
            console.warn('Geolocation error:', error)
          }
        )
      }

      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: preview,
        metadata: {
          capturedAt,
          capturedAtSource,
          location,
          locationSource,
        },
      }))

      // 사진 촬영 후 자동으로 다음 단계로 이동
      setCurrentStep(2)
    } catch (error) {
      console.error('EXIF parsing error:', error)
      // EXIF 파싱 실패 시 기본값 설정
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: preview,
        metadata: {
          capturedAt: new Date(),
          capturedAtSource: 'fallback',
          location: null,
          locationSource: null,
        },
      }))

      // 사진 촬영 후 자동으로 다음 단계로 이동
      setCurrentStep(2)
    }
  }

  // 다음 단계로 이동
  const handleNext = () => {
    setError(null)

    // 각 스텝별 유효성 검증
    if (currentStep === 1 && !formData.imageFile) {
      setError('사진을 촬영하거나 업로드해주세요')
      return
    }

    if (currentStep === 3) {
      if (!formData.speciesId) {
        setError('종을 선택해주세요')
        return
      }
      if (!formData.primaryMorphId) {
        setError('모프를 선택해주세요')
        return
      }
      if (!formData.gender) {
        setError('성별을 선택해주세요')
        return
      }
      if (!formData.acquisitionType) {
        setError('입양/해칭을 선택해주세요')
        return
      }
      if (!formData.acquisitionDate) {
        setError('입양/해칭 일를 선택해주세요')
        return
      }
    }

    if (currentStep === 4) {
      // 해칭인 경우 부모 정보 필수
      if (formData.acquisitionType === 'HATCHING') {
        if (formData.fathers.length === 0) {
          setError('해칭 개체는 부 정보를 반드시 입력해야 합니다')
          return
        }
        if (formData.mothers.length === 0) {
          setError('해칭 개체는 모 정보를 반드시 입력해야 합니다')
          return
        }
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
  }

  // 이전 단계로 이동
  const handlePrev = () => {
    setError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // 최종 등록
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createAnimal({
        name: formData.name,
        gender: formData.gender!,
        acquisitionType: formData.acquisitionType!,
        acquisitionDate: formData.acquisitionDate!,
        hatchDate: formData.hatchDate || undefined,
        speciesId: formData.speciesId || undefined,
        primaryMorphId: formData.primaryMorphId || undefined,
        comboMorphIds: formData.comboMorphIds,
        imageFile: formData.imageFile || undefined,
        metadata: formData.metadata,
        fathers: formData.fathers.map((f) => f.id),
        mothers: formData.mothers.map((m) => m.id),
        isBreeding: formData.isBreeding,
        isPublic: true,
        parentPublic: true,
      })

      if (result.success && 'data' in result) {
        // 알에서 등록한 경우 알-개체 연결
        if (eggId) {
          await linkEggAnimal({ eggId, animalId: result.data.id })
        }
        // 성공 시 등록된 정보 저장하고 성공 화면 표시
        setRegisteredAnimal(result.data)
        setCurrentStep(6) // 성공 화면으로 이동
      } else {
        setError('error' in result ? result.error : '개체 등록 중 오류가 발생했습니다')
      }
    } catch (err) {
      console.error('Submit error:', err)
      // 네트워크 오류 등 더 자세한 에러 메시지 제공
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('네트워크 연결이 불안정합니다. 다시 시도해주세요.')
      } else if (err instanceof Error) {
        setError(`개체 등록 중 오류가 발생했습니다: ${err.message}`)
      } else {
        setError('개체 등록 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col bg-white relative w-full max-w-3xl mx-auto h-full">

      {/* 컨텐츠 */}
      <div className="flex-1 flex flex-col py-4 pb-20">
        {/* 스텝 프로그레스 바 */}
        {currentStep <= STEPS.length && (
          <div className="pb-6">
            <StepProgressBar steps={STEPS} currentStep={currentStep} />
          </div>
        )}

        {/* Step 1: 사진 촬영 */}
        {currentStep === 1 && (
          <Step1PhotoCapture
            ref={cameraInputRef}
            imagePreview={formData.imagePreview}
            onCapture={handleImageCapture}
            onRemove={() => setFormData(prev => ({ ...prev, imageFile: null, imagePreview: null }))}
          />
        )}

        {/* Step 2: 메타데이터 확인 */}
        {currentStep === 2 && (
          <Step2MetadataConfirmation
            imagePreview={formData.imagePreview}
            metadata={formData.metadata}
          />
        )}

        {/* Step 3: 필수 정보 입력 */}
        {currentStep === 3 && (
          <Step3BasicInfo
            name={formData.name}
            gender={formData.gender}
            acquisitionType={formData.acquisitionType}
            capturedAt={formData.metadata.capturedAt}
            hatchDate={formData.hatchDate}
            speciesId={formData.speciesId}
            primaryMorphId={formData.primaryMorphId}
            comboMorphIds={formData.comboMorphIds}
            isBreeding={formData.isBreeding}
            onNameChange={(value) =>
              setFormData((prev) => ({ ...prev, name: value }))
            }
            onGenderChange={(value) =>
              setFormData((prev) => ({ ...prev, gender: value }))
            }
            onAcquisitionTypeChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                acquisitionType: value,
                // 해칭인 경우 hatchDate를 capturedAt으로 자동 설정
                hatchDate: value === 'HATCHING' ? formData.metadata.capturedAt : prev.hatchDate
              }))
            }
            onHatchDateChange={(value) =>
              setFormData((prev) => ({ ...prev, hatchDate: value }))
            }
            onSpeciesChange={(value) =>
              setFormData((prev) => ({ ...prev, speciesId: value }))
            }
            onPrimaryMorphChange={(value) =>
              setFormData((prev) => ({ ...prev, primaryMorphId: value }))
            }
            onComboMorphsChange={(value) =>
              setFormData((prev) => ({ ...prev, comboMorphIds: value }))
            }
            onIsBreedingChange={(value) =>
              setFormData((prev) => ({ ...prev, isBreeding: value }))
            }
            onSpeciesListChange={(list) => setSpeciesList(list)}
            onMorphListChange={(list) => setMorphList(list)}
          />
        )}

        {/* Step 4: 부모 정보 */}
        {currentStep === 4 && (
          <Step4ParentSelection
            acquisitionType={formData.acquisitionType}
            fathers={formData.fathers}
            mothers={formData.mothers}
            onFathersChange={(fathers) =>
              setFormData((prev) => ({ ...prev, fathers }))
            }
            onMothersChange={(mothers) =>
              setFormData((prev) => ({ ...prev, mothers }))
            }
          />
        )}

        {/* Step 5: 최종 확인 */}
        {currentStep === 5 && (
          <Step5FinalReview
            imagePreview={formData.imagePreview}
            speciesId={formData.speciesId}
            primaryMorphId={formData.primaryMorphId}
            comboMorphIds={formData.comboMorphIds}
            name={formData.name}
            gender={formData.gender}
            acquisitionType={formData.acquisitionType}
            acquisitionDate={formData.acquisitionDate}
            hatchDate={formData.hatchDate}
            isBreeding={formData.isBreeding}
            fathers={formData.fathers}
            mothers={formData.mothers}
            speciesList={speciesList}
            morphList={morphList}
          />
        )}

        {/* Step 6: 등록 성공 */}
        {currentStep === 6 && registeredAnimal && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {/* 성공 아이콘 */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>

            {/* 성공 메시지 */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900">
                등록이 완료되었습니다!
              </h2>
              <p className="text-sm text-gray-600">
                개체가 성공적으로 등록되었습니다.
              </p>
            </div>

            {/* 등록된 정보 */}
            <div className="w-full bg-gray-50 rounded-lg p-6 space-y-4">
              {/* 사진 */}
              {formData.imagePreview && (
                <div className="flex justify-center">
                  <img
                    src={formData.imagePreview}
                    alt="등록된 개체"
                    className="w-48 h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* 정보 목록 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">고유번호</span>
                  <span className="text-sm font-medium text-gray-900">
                    {registeredAnimal.uniqueId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">이름</span>
                  <span className="text-sm font-medium text-gray-900">
                    {registeredAnimal.name}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">성별</span>
                  <span className="text-sm font-medium text-gray-900">
                    {registeredAnimal.gender === 'MALE'
                      ? '수컷'
                      : registeredAnimal.gender === 'FEMALE'
                      ? '암컷'
                      : '미구분'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">입양/해칭</span>
                  <span className="text-sm font-medium text-gray-900">
                    {registeredAnimal.acquisitionType === 'HATCHING'
                      ? '해칭'
                      : '입양'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">등록일</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(
                      registeredAnimal.acquisitionDate
                    ).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                {registeredAnimal.hatchDate && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">해칭일</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(
                        registeredAnimal.hatchDate
                      ).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 z-10 max-w-3xl mx-auto transition-[left] duration-200 ease-linear",
        sidebarState === "collapsed"
          ? "md:left-(--sidebar-width-icon)"
          : "md:left-(--sidebar-width)"
      )}>
        {currentStep === 1 ? (
          // Step 1: 사진 찍기 버튼만 표시
          <Button
            onClick={() => {
              cameraInputRef.current?.openCamera()
            }}
            disabled={isLoading}
            className="w-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            사진 촬영
          </Button>
        ) : currentStep === 6 ? (
          // Step 6: 등록 완료 - 상세 정보 보기 & 목록으로 이동 버튼
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDetailSheetOpen(true)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              개체 상세
            </Button>
            <Button
              onClick={() => router.push('/animals')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              목록으로 이동
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 items-center">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={isLoading}
                className="flex-1"
              >
                이전
              </Button>
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentStep} / {STEPS.length}
            </span>
            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="flex-1"
              >
                다음
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  '등록하기'
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 개체 상세 정보 Sheet */}
      <AnimalDetailSheet
        animalId={registeredAnimal?.id || null}
        open={isDetailSheetOpen}
        onOpenChange={setIsDetailSheetOpen}
      />
    </div>
  )
}
