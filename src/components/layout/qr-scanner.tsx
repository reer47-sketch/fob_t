"use client"

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Camera, ScanLine, Video, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ScanMode = 'live' | 'video' | 'photo'

interface QrScannerProps {
  onScanned: (animalId: string) => void
}

export function QrScanner({ onScanned }: QrScannerProps) {
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [isPhotoScanning, setIsPhotoScanning] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [mode, setMode] = useState<ScanMode>('live')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const isProcessingRef = useRef(false)
  const lastProcessedIdRef = useRef<string | null>(null)

  const extractIdFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      return pathParts[pathParts.length - 1] || null
    } catch {
      return url
    }
  }

  const handleQRResult = async (decodedText: string) => {
    if (isProcessingRef.current) return
    const animalId = extractIdFromUrl(decodedText)
    if (!animalId) {
      toast.error('유효하지 않은 QR 코드입니다')
      return
    }
    if (lastProcessedIdRef.current === animalId) return
    isProcessingRef.current = true
    lastProcessedIdRef.current = animalId
    try {
      onScanned(animalId)
    } finally {
      isProcessingRef.current = false
    }
  }

  const loadCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      const backCameras = devices.filter((d) =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('후면') ||
        d.label.toLowerCase().includes('rear')
      )
      const unique = backCameras.filter((c, i, self) =>
        i === self.findIndex((x) => x.id === c.id)
      )
      const normal = unique.find((c) =>
        !c.label.toLowerCase().includes('ultra') &&
        !c.label.toLowerCase().includes('wide') &&
        !c.label.toLowerCase().includes('초광각')
      )
      setSelectedCameraId(normal?.id || unique[0]?.id || devices[0]?.id || null)
    } catch (err) {
      console.error('카메라 목록 로드 오류:', err)
    }
  }

  const initScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-scanner-reader')
      scannerRef.current = html5QrCode
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
            advanced: [{ zoom: 3 }],
          } as unknown as MediaTrackConstraints,
        },
        handleQRResult,
        () => {}
      )
    } catch (err) {
      console.error('QR Scanner error:', err)
      toast.error('카메라를 시작할 수 없습니다')
    }
  }

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

  const startCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          advanced: [{ zoom: 3 }],
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
    }
  }

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop())
      cameraStreamRef.current = null
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null
    }
  }

  const captureAndDecode = async () => {
    if (!cameraVideoRef.current) return
    setIsCapturing(true)
    lastProcessedIdRef.current = null
    try {
      const video = cameraVideoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context 생성 실패')
      ctx.drawImage(video, 0, 0)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob 생성 실패'))), 'image/jpeg', 1.0)
      })
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      const t = toast.loading('QR 코드를 찾는 중...')
      try {
        const html5QrCode = new Html5Qrcode('qr-scanner-temp')
        const result = await html5QrCode.scanFile(file, false)
        toast.dismiss(t)
        await handleQRResult(result)
      } catch {
        toast.dismiss(t)
        toast.error('QR 코드를 찾을 수 없습니다. 다시 시도해주세요.')
      }
    } catch {
      toast.error('사진 촬영에 실패했습니다')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handlePhotoScan(file)
    e.target.value = ''
  }

  const handlePhotoScan = async (file: File) => {
    setIsPhotoScanning(true)
    lastProcessedIdRef.current = null
    const t = toast.loading('사진에서 QR 코드를 찾는 중...')
    try {
      const html5QrCode = new Html5Qrcode('qr-scanner-temp')
      const result = await html5QrCode.scanFile(file, false)
      toast.dismiss(t)
      await handleQRResult(result)
    } catch {
      toast.dismiss(t)
      toast.error('QR 코드를 찾을 수 없습니다. 다시 시도해주세요.')
    } finally {
      setIsPhotoScanning(false)
    }
  }

  const handleModeChange = async (newMode: ScanMode) => {
    if (newMode === mode) return
    await stopScanner()
    stopCameraStream()
    setMode(newMode)
  }

  useEffect(() => {
    loadCameras()
    return () => {
      stopScanner()
      stopCameraStream()
    }
  }, [])

  useEffect(() => {
    if (mode === 'live' && selectedCameraId) {
      const start = async () => {
        await stopScanner()
        stopCameraStream()
        setTimeout(() => initScanner(), 100)
      }
      start()
    } else if (mode === 'video') {
      stopScanner()
      setTimeout(() => startCameraStream(), 100)
    } else {
      stopScanner()
      stopCameraStream()
    }
  }, [mode, selectedCameraId])

  const guideText: Record<ScanMode, string> = {
    live: '개체 QR 코드를 카메라에 비춰주세요',
    video: 'QR 코드가 화면에 잘 보이도록 맞춰주세요',
    photo: '카메라로 QR 코드를 촬영해주세요',
  }

  return (
    <>
      <style jsx global>{`
        #qr-scanner-reader {
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
        }
        #qr-scanner-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0.5rem !important;
        }
        #qr-scanner-reader__scan_region {
          width: 100% !important;
          height: 100% !important;
        }
        #qr-scanner-reader__dashboard_section {
          display: none !important;
        }
        #qr-scanner-temp {
          display: none !important;
        }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <div id="qr-scanner-temp" />

      <div className="flex flex-col h-full">
        <p className="text-center text-sm text-gray-500 pb-3">{guideText[mode]}</p>

        {/* 스캔 영역 */}
        <div className="flex-1 w-full relative overflow-hidden rounded-lg bg-black">
          <div
            id="qr-scanner-reader"
            className={cn('absolute inset-0', mode !== 'live' && 'hidden')}
          />
          <video
            ref={cameraVideoRef}
            autoPlay
            playsInline
            muted
            className={cn('absolute inset-0 w-full h-full object-cover', mode !== 'video' && 'hidden')}
          />
          {mode === 'photo' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
              <Camera className="w-16 h-16 opacity-40" />
              <p className="text-sm opacity-60">아래 버튼을 눌러 촬영해주세요</p>
            </div>
          )}
        </div>

        {/* 모드별 액션 버튼 */}
        {mode === 'video' && (
          <div className="pt-3">
            <Button onClick={captureAndDecode} disabled={isCapturing} className="w-full font-bold" size="lg">
              {isCapturing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />처리 중...</> : '촬영하기'}
            </Button>
          </div>
        )}
        {mode === 'photo' && (
          <div className="pt-3">
            <Button onClick={() => fileInputRef.current?.click()} disabled={isPhotoScanning} className="w-full font-bold" size="lg">
              {isPhotoScanning ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />스캔 중...</> : '사진 촬영'}
            </Button>
          </div>
        )}

        {/* 모드 선택 탭 */}
        <div className="pt-3">
          <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
            <button
              onClick={() => handleModeChange('photo')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                mode === 'photo' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Camera className="w-4 h-4" strokeWidth={2} />
              사진
            </button>
            <button
              onClick={() => handleModeChange('video')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                mode === 'video' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Video className="w-4 h-4" strokeWidth={2} />
              카메라
            </button>
            <button
              onClick={() => handleModeChange('live')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                mode === 'live' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <ScanLine className="w-4 h-4" strokeWidth={2} />
              실시간
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
