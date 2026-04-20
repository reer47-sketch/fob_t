'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { FoodType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { QrCode, X, Check, AlertCircle, CalendarIcon, Loader2, Camera, ScanLine, Video } from 'lucide-react'
import { getAnimalDetail } from '@/actions/animals/get-animal-detail'
import { createFeeding } from '@/actions/feeding/create-feeding'

// 먹이 종류 라벨
const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  CRICKET: '귀뚜라미',
  MEALWORM: '밀웜',
  FEED: '사료',
  VEGETABLE: '야채/과일',
  MOUSE: '쥐',
  FROZEN_CHICK: '냉짱',
  FRUIT_FLY: '초파리',
  OTHER: '기타',
}

interface ScannedAnimal {
  id: string
  name: string | null
  uniqueId: string
  imageUrl: string | null
}

export default function Feeding() {
  const [formData, setFormData] = useState({
    date: new Date(),
    foodType: '' as FoodType | '',
    superfood: false,
    quantity: '',
    memo: '',
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [scannedAnimals, setScannedAnimals] = useState<ScannedAnimal[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPhotoScanning, setIsPhotoScanning] = useState(false)
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [isCameraSheetOpen, setIsCameraSheetOpen] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const isProcessingRef = useRef(false)
  const lastProcessedIdRef = useRef<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // QR 코드에서 ID 추출
  const extractIdFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      // 마지막 path segment가 id
      return pathParts[pathParts.length - 1] || null
    } catch {
      // URL이 아닌 경우 그대로 ID로 사용
      return url
    }
  }

  // QR 스캔 결과 처리
  const handleQRResult = async (decodedText: string) => {
    // 처리 중이면 무시
    if (isProcessingRef.current) {
      return
    }

    const animalId = extractIdFromUrl(decodedText)
    if (!animalId) {
      toast.error('유효하지 않은 QR 코드입니다')
      return
    }

    // 마지막으로 처리한 ID와 같으면 무시 (카메라를 계속 대고 있는 경우)
    if (lastProcessedIdRef.current === animalId) {
      return
    }

    // 이미 추가된 개체인지 확인
    const existingAnimal = scannedAnimals.find((animal) => animal.id === animalId)
    if (existingAnimal) {
      toast.custom(
        () => (
          <div
            style={{ backgroundColor: '#F5A623' }}
            className="text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[280px] animate-in slide-in-from-top-5 duration-300"
          >
            <div className="bg-white/20 rounded-full p-2">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">이미 추가됨</p>
              <p className="text-white/90 text-sm">{existingAnimal.name || existingAnimal.uniqueId}</p>
            </div>
          </div>
        ),
        { duration: 2000 }
      )
      lastProcessedIdRef.current = animalId
      return
    }

    // 처리 시작
    isProcessingRef.current = true
    lastProcessedIdRef.current = animalId

    try {
      // 개체 정보 조회
      const result = await getAnimalDetail(animalId)
      if (result.success && 'data' in result && result.data) {
        const animal = result.data
        const imageUrl = animal.images?.[0]?.imageUrl || null

        setScannedAnimals((prev) => [
          ...prev,
          {
            id: animal.id,
            name: animal.name,
            uniqueId: animal.uniqueId,
            imageUrl,
          },
        ])

        toast.custom(
          () => (
            <div
              style={{ backgroundColor: '#58BA2E' }}
              className="text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[280px] animate-in slide-in-from-top-5 duration-300"
            >
              <div className="bg-white/20 rounded-full p-2">
                <Check className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">스캔 완료!</p>
                <p className="text-white/90 text-sm">{animal.name || animal.uniqueId}</p>
              </div>
            </div>
          ),
          { duration: 2000 }
        )
      } else {
        toast.error('개체 정보를 찾을 수 없습니다')
      }
    } finally {
      // 처리 완료
      isProcessingRef.current = false
    }
  }

  // 카메라 목록 가져오기
  const loadCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      const backCameras = devices.filter((device) =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('후면') ||
        device.label.toLowerCase().includes('rear')
      )

      // 카메라 ID 중복 제거
      const uniqueCameras = backCameras.filter((camera, index, self) =>
        index === self.findIndex((c) => c.id === camera.id)
      )

      // 일반 카메라 우선 선택 (광각이 아닌 카메라)
      const normalCamera = uniqueCameras.find((camera) =>
        !camera.label.toLowerCase().includes('ultra') &&
        !camera.label.toLowerCase().includes('wide') &&
        !camera.label.toLowerCase().includes('초광각')
      )

      // 일반 카메라가 있으면 선택, 없으면 첫 번째 후면 카메라 선택
      setSelectedCameraId(normalCamera?.id || uniqueCameras[0]?.id || devices[0]?.id || null)
    } catch (err) {
      console.error('카메라 목록 로드 오류:', err)
    }
  }

  // 스캐너 시작
  const initScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode

      // 선택된 카메라 ID로 시작
      const cameraId = selectedCameraId || { facingMode: 'environment' }

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 16 / 9,
          disableFlip: true,
          videoConstraints: {
            width: { ideal: 3840 },
            height: { ideal: 2160 },
            facingMode: 'environment',
            advanced: [
              { zoom: 3 },
            ]
          } as unknown as MediaTrackConstraints
        },
        handleQRResult,
        () => {}
      )
    } catch (err) {
      console.error('QR Scanner error:', err)
      toast.error('카메라를 시작할 수 없습니다')
      setIsSheetOpen(false)
    }
  }

  // 스캐너 중지
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
        lastProcessedIdRef.current = null
      } catch (err) {
        console.error('Stop scanner error:', err)
      }
    }
  }

  // 사진에서 QR 코드 스캔
  const handlePhotoScan = async (file: File) => {
    setIsPhotoScanning(true)

    // 사진 스캔 시 lastProcessedIdRef 초기화 (새로운 스캔 시도)
    lastProcessedIdRef.current = null

    // 스캔 시작 토스트
    const scanningToast = toast.loading('사진에서 QR 코드를 찾는 중...')

    try {
      const html5QrCode = new Html5Qrcode('temp-qr-reader')
      const result = await html5QrCode.scanFile(file, false)
      toast.dismiss(scanningToast)
      await handleQRResult(result)
    } catch (err) {
      console.error('Photo scan error:', err)
      toast.dismiss(scanningToast)
      toast.error('QR 코드를 찾을 수 없습니다. 다시 시도해주세요.')
    } finally {
      setIsPhotoScanning(false)
    }
  }

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handlePhotoScan(file)
    }
    // input 초기화 (같은 파일을 다시 선택할 수 있도록)
    e.target.value = ''
  }

  // 카메라 스트림 시작
  const startCameraStream = async () => {
    try {
      // 후면 카메라 우선 선택
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          advanced: [
            { zoom: 3 },
          ]
        } as unknown as MediaTrackConstraints,
        audio: false,
      })

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream
        cameraStreamRef.current = stream
      }
    } catch (err) {
      console.error('카메라 스트림 시작 오류:', err)
      toast.error('카메라를 시작할 수 없습니다')
      setIsCameraSheetOpen(false)
    }
  }

  // 카메라 스트림 중지
  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null
    }
  }

  // 사진 촬영 및 QR 디코딩
  const captureAndDecode = async () => {
    if (!cameraVideoRef.current) return

    setIsCapturing(true)
    lastProcessedIdRef.current = null

    try {
      // 캔버스에 현재 프레임 그리기
      const video = cameraVideoRef.current

      // 디버깅: 실제 비디오 해상도 확인
      console.log('Video dimensions:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        clientWidth: video.clientWidth,
        clientHeight: video.clientHeight
      })

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas context를 생성할 수 없습니다')
      }

      ctx.drawImage(video, 0, 0)

      // 캔버스를 Blob으로 변환 (품질 높임)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Blob 생성 실패'))
        }, 'image/jpeg', 1.0)
      })

      console.log('Captured image size:', blob.size, 'bytes')

      // Blob을 File로 변환
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })

      // QR 디코딩
      const scanningToast = toast.loading('사진에서 QR 코드를 찾는 중...')

      try {
        const html5QrCode = new Html5Qrcode('temp-qr-reader')
        const result = await html5QrCode.scanFile(file, false)
        toast.dismiss(scanningToast)

        await handleQRResult(result)
      } catch (err) {
        console.error('QR 디코딩 오류:', err)
        toast.dismiss(scanningToast)
        toast.error('QR 코드를 찾을 수 없습니다. 다시 시도해주세요.')
      }
    } catch (err) {
      console.error('사진 촬영 오류:', err)
      toast.error('사진 촬영에 실패했습니다')
    } finally {
      setIsCapturing(false)
    }
  }

  // 카메라 목록 로드
  useEffect(() => {
    loadCameras()
  }, [])

  // Sheet 열릴 때 스캐너 시작
  useEffect(() => {
    if (isSheetOpen && selectedCameraId) {
      const restartScanner = async () => {
        await stopScanner()
        // DOM이 렌더링된 후 스캐너 초기화
        setTimeout(() => {
          initScanner()
        }, 100)
      }
      restartScanner()
    } else {
      stopScanner()
    }
  }, [isSheetOpen, selectedCameraId])

  // 컴포넌트 언마운트 시 스캐너 정리
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
      }
      stopCameraStream()
    }
  }, [])

  // 카메라 Sheet 열릴 때 스트림 시작
  useEffect(() => {
    if (isCameraSheetOpen) {
      // DOM이 렌더링된 후 스트림 시작
      setTimeout(() => {
        startCameraStream()
      }, 100)
    } else {
      stopCameraStream()
    }
  }, [isCameraSheetOpen])

  // 개체 제거
  const removeAnimal = (animalId: string) => {
    setScannedAnimals((prev) => prev.filter((animal) => animal.id !== animalId))
    // 개체 제거 시 lastProcessedIdRef 초기화 (같은 개체를 다시 스캔할 수 있도록)
    if (lastProcessedIdRef.current === animalId) {
      lastProcessedIdRef.current = null
    }
  }

  // 저장 가능 여부 확인
  const canSave = scannedAnimals.length > 0 && formData.foodType !== ''

  const handleSave = async () => {
    if (!canSave) {
      if (scannedAnimals.length === 0) {
        toast.error('최소 1개 이상의 개체를 스캔해주세요')
        return
      }
      if (!formData.foodType) {
        toast.error('먹이 종류를 선택해주세요')
        return
      }
      return
    }

    setIsSaving(true)

    try {
      const result = await createFeeding({
        animalIds: scannedAnimals.map((animal) => animal.id),
        foodType: formData.foodType as FoodType,
        superfood: formData.superfood,
        feedingDate: formData.date,
        quantity: formData.quantity || null,
        memo: formData.memo || null,
      })

      if (result.success) {
        toast.success(`${scannedAnimals.length}개체 피딩 정보가 저장되었습니다`)
        // 폼 초기화
        setFormData({
          date: new Date(),
          foodType: '',
          superfood: false,
          quantity: '',
          memo: '',
        })
        setScannedAnimals([])
      } else {
        toast.error(result.error || '저장 중 오류가 발생했습니다')
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        #qr-reader {
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0.5rem !important;
        }
        #qr-reader__scan_region {
          width: 100% !important;
          height: 100% !important;
        }
        #qr-reader__dashboard_section {
          display: none !important;
        }
        #temp-qr-reader {
          display: none !important;
        }
      `}</style>
      <div className="min-h-dvh bg-white flex flex-col">
      {/* 헤더 */}
      {/* <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-base font-semibold text-gray-700">피딩 정보</h1>
        </div>
      </div> */}

      {/* 컨텐츠 */}
      <div className="flex-1 flex flex-col px-4 pb-24 overflow-y-auto">
        {/* 상단 입력 폼 */}
        <div className="space-y-4">
          {/* 날짜 */}
          <div className="space-y-2">
            <Label>날짜</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.date, 'yyyy-MM-dd')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={ko}
                  selected={formData.date}
                  onSelect={(date) => {
                    if (date) {
                      setFormData((prev) => ({ ...prev, date }))
                    }
                    setIsCalendarOpen(false)
                  }}
                  className='[--cell-size:2.5rem]'
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 먹이 종류 */}
          <div className="space-y-2">
            <Label>먹이 종류 <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(FOOD_TYPE_LABELS).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, foodType: value as FoodType }))
                  }
                  className={
                    formData.foodType === value
                      ? 'w-full rounded-full bg-primary/10 text-primary border-primary text-sm'
                      : 'w-full rounded-full text-sm'
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* 슈퍼푸드 */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() =>
                setFormData((prev) => ({ ...prev, superfood: !prev.superfood }))
              }
              className={
                formData.superfood
                  ? 'w-full rounded-full bg-orange-50 text-orange-600 border-orange-300'
                  : 'w-full rounded-full text-gray-600'
              }
            >
              {formData.superfood ? '✓ 슈퍼푸드 추가됨' : '슈퍼푸드 추가'}
            </Button>
          </div>

          {/* 급여량 */}
          <div className="space-y-2">
            <Label htmlFor="quantity">급여량</Label>
            <input
              id="quantity"
              name="quantity"
              placeholder="급여량을 입력하세요 (예: 귀뚜라미 5마리)"
              value={formData.quantity}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label htmlFor="memo">메모</Label>
            <Textarea
              id="memo"
              name="memo"
              placeholder="메모를 입력하세요"
              value={formData.memo}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>

        {/* 스캔된 개체 리스트 */}
        <div className="flex-1 mt-6 pb-20">
          {scannedAnimals.length > 0 && (
            <div className="space-y-2">
              <Label>스캔된 개체 ({scannedAnimals.length})</Label>
              <div className="space-y-2">
                {scannedAnimals.map((animal) => (
                  <div
                    key={animal.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {/* 사진 */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                      {animal.imageUrl ? (
                        <img
                          src={animal.imageUrl}
                          alt={animal.name || '개체 이미지'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {animal.name || '이름 없음'}
                      </p>
                      <p className="text-xs text-gray-500">{animal.uniqueId}</p>
                    </div>

                    {/* 삭제 버튼 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAnimal(animal.id)}
                      className="shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 스캔된 개체가 없을 때 안내 */}
          {scannedAnimals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <QrCode className="w-12 h-12 mb-3" />
              <p className="text-sm">QR 스캔으로 개체를 추가해주세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 저장 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <Button
          onClick={handleSave}
          className="w-full text-md font-bold"
          size='lg'
          disabled={!canSave || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              저장 중...
            </>
          ) : (
            '저장'
          )}
        </Button>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 임시 QR 리더 (사진 스캔용) */}
      <div id="temp-qr-reader" />

      {/* 우측 하단 플로팅 버튼 (Pills 형태) */}
      <div className="fixed bottom-24 right-4 z-50">
        <div className="flex items-center gap-0 bg-white border-2 border-gray-200 rounded-full shadow-xl">
          {/* 사진 촬영 버튼 (네이티브) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isPhotoScanning}
            className="w-14 h-14 flex items-center justify-center text-gray-700 hover:text-primary hover:bg-gray-50 transition-all duration-200 rounded-l-full disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="사진 촬영"
          >
            {isPhotoScanning ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Camera className="w-6 h-6" strokeWidth={2} />
            )}
          </button>

          {/* 구분선 */}
          <div className="w-px h-8 bg-gray-200" />

          {/* 카메라 프리뷰 버튼 (웹) */}
          <button
            onClick={() => setIsCameraSheetOpen(true)}
            className="w-14 h-14 flex items-center justify-center text-gray-700 hover:text-primary hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="카메라 프리뷰"
          >
            <Video className="w-6 h-6" strokeWidth={2} />
          </button>

          {/* 구분선 */}
          <div className="w-px h-8 bg-gray-200" />

          {/* QR 실시간 스캔 버튼 */}
          <button
            onClick={() => setIsSheetOpen(true)}
            className="w-14 h-14 flex items-center justify-center text-gray-700 hover:text-primary hover:bg-gray-50 transition-all duration-200 rounded-r-full"
            aria-label="QR 실시간 스캔"
          >
            <ScanLine className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* QR 실시간 스캐너 Bottom Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[85dvh] rounded-t-xl p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="pb-4">
              <SheetTitle>QR 실시간 스캔</SheetTitle>
            </SheetHeader>

            {/* 안내 문구 */}
            <p className="text-center text-sm text-gray-500 pb-4">
              개체 QR 코드를 카메라에 비춰주세요
            </p>

            {/* QR 스캐너 영역 */}
            <div className="flex-1 w-full relative overflow-hidden rounded-lg">
              <div
                id="qr-reader"
                className="absolute inset-0"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 카메라 촬영 Bottom Sheet */}
      <Sheet open={isCameraSheetOpen} onOpenChange={setIsCameraSheetOpen}>
        <SheetContent side="bottom" className="h-[85dvh] rounded-t-xl p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="pb-4">
              <SheetTitle>카메라 촬영</SheetTitle>
            </SheetHeader>

            {/* 안내 문구 */}
            <p className="text-center text-sm text-gray-500 pb-4">
              QR 코드가 화면에 잘 보이도록 맞춰주세요
            </p>

            {/* 카메라 프리뷰 영역 */}
            <div className="flex-1 w-full relative overflow-hidden rounded-lg bg-black">
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* 촬영 버튼 */}
            <div className="pt-6 pb-4">
              <Button
                onClick={captureAndDecode}
                disabled={isCapturing}
                className="w-full text-md font-bold"
                size="lg"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    처리 중...
                  </>
                ) : (
                  '촬영하기'
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </>
  )
}
