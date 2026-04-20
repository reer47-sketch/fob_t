'use client'

import { useCallback, useState } from 'react'
import {
  ResponsiveDrawer,
  ResponsiveDrawerContent,
  ResponsiveDrawerHeader,
} from '@/components/ui/responsive-drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Download, Ruler } from 'lucide-react'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'
import {
  HeaderLabel,
  ClutchLabel,
  CLUTCH_SLOTS_PER_LABEL,
  type ClutchLabelItem,
  type PairingLabelData,
  type PairingLabelSettings,
} from './pairing-label-renderer'

interface PairingLabelSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: PairingLabelData | null
}

const PREVIEW_SCALE = 0.75

export function PairingLabelSheet({ open, onOpenChange, data }: PairingLabelSheetProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [widthStr, setWidthStr] = useState('50')
  const [heightStr, setHeightStr] = useState('20')

  const width = Math.max(30, Number(widthStr) || 30)
  const height = Math.max(10, Number(heightStr) || 10)
  const settings: PairingLabelSettings = { width, height }

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  // 3슬롯 단위로 청킹. 클러치가 1개라도 1장의 라벨을 생성(빈 슬롯은 상단 정렬 후 비움)
  const clutchChunks: ClutchLabelItem[][] = (() => {
    if (!data) return []
    if (data.clutches.length === 0) return [[]]
    const out: ClutchLabelItem[][] = []
    for (let i = 0; i < data.clutches.length; i += CLUTCH_SLOTS_PER_LABEL) {
      out.push(data.clutches.slice(i, i + CLUTCH_SLOTS_PER_LABEL))
    }
    return out
  })()

  const handleDownload = useCallback(async () => {
    if (!data) return

    setIsDownloading(true)
    const downloadPromise = async () => {
      const files: File[] = []
      const downloadData: { fileName: string; dataUrl: string }[] = []

      // Header label
      const headerEl = document.getElementById('pairing-label-header')
      if (headerEl) {
        try {
          const dataUrl = await toPng(headerEl, { cacheBust: true, pixelRatio: 3 })
          const fileName = `${data.femaleName}x${data.maleName}-header.png`
          files.push(new File([dataUrlToBlob(dataUrl)], fileName, { type: 'image/png' }))
          downloadData.push({ fileName, dataUrl })
        } catch (err) {
          console.error('Failed to generate header label', err)
        }
      }

      // Clutch labels (3슬롯 청크 단위)
      for (let chunkIdx = 0; chunkIdx < clutchChunks.length; chunkIdx++) {
        const el = document.getElementById(`pairing-label-clutch-chunk-${chunkIdx}`)
        if (!el) continue
        try {
          const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 3 })
          const startIdx = chunkIdx * CLUTCH_SLOTS_PER_LABEL + 1
          const endIdx = startIdx + clutchChunks[chunkIdx].length - 1
          const suffix = clutchChunks[chunkIdx].length > 0
            ? (startIdx === endIdx ? `${startIdx}차` : `${startIdx}-${endIdx}차`)
            : '빈슬롯'
          const fileName = `${data.femaleName}x${data.maleName}-${suffix}.png`
          files.push(new File([dataUrlToBlob(dataUrl)], fileName, { type: 'image/png' }))
          downloadData.push({ fileName, dataUrl })
        } catch (err) {
          console.error('Failed to generate clutch label chunk', err)
        }
      }

      if (downloadData.length === 0) throw new Error('생성된 라벨이 없습니다')

      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isIOS && navigator.share) {
        try {
          await navigator.share({ files, title: '산란 라벨' })
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
        }
      }

      for (const { fileName, dataUrl } of downloadData) {
        const link = document.createElement('a')
        link.download = fileName
        link.href = dataUrl
        link.click()
        await new Promise((r) => setTimeout(r, 300))
      }
    }

    toast.promise(downloadPromise(), {
      loading: '라벨 이미지 생성 중...',
      success: '다운로드가 완료되었습니다',
      error: (e) => `다운로드 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`,
    })
    setIsDownloading(false)
  }, [data])

  if (!data) return null

  return (
    <ResponsiveDrawer open={open} onOpenChange={onOpenChange}>
      <ResponsiveDrawerContent
        size="tall"
        className="data-[vaul-drawer-direction=right]:sm:max-w-[580px]"
      >
        {/* Header */}
        <ResponsiveDrawerHeader
          title="산란 라벨 다운로드"
          onClose={() => onOpenChange(false)}
        />

        {/* Body */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Settings */}
          <div className="px-5 py-4 border-b shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                라벨 규격
              </h3>
              <span className="text-xs text-muted-foreground">
                {width}mm x {height}mm
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pw" className="text-xs text-muted-foreground">가로 (mm)</Label>
                <input
                  id="pw"
                  type="number"
                  min={30}
                  max={200}
                  value={widthStr}
                  onChange={(e) => setWidthStr(e.target.value)}
                  onBlur={() => { if (!widthStr || Number(widthStr) < 30) setWidthStr('30') }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ph" className="text-xs text-muted-foreground">세로 (mm)</Label>
                <input
                  id="ph"
                  type="number"
                  min={10}
                  max={100}
                  value={heightStr}
                  onChange={(e) => setHeightStr(e.target.value)}
                  onBlur={() => { if (!heightStr || Number(heightStr) < 10) setHeightStr('10') }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col bg-gray-50/50 flex-1 min-h-0">
            <div className="px-4 py-3 border-b bg-white/50 flex justify-between items-center shrink-0">
              <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded">
                LIVE PREVIEW
              </span>
              <p className="text-xs text-muted-foreground">
                {width}mm x {height}mm 규격 미리보기
              </p>
            </div>

            <ScrollArea className="flex-1 h-full w-full">
              <div className="p-6 flex flex-wrap gap-8 pb-20 w-full justify-center">
                {/* Header label */}
                <div className="relative group">
                  <div
                    id="pairing-label-header"
                    className="origin-top-left"
                    style={{ width: width * 8 * PREVIEW_SCALE, height: height * 8 * PREVIEW_SCALE }}
                  >
                    <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
                      <HeaderLabel data={data} settings={settings} />
                    </div>
                  </div>
                  <div className="absolute -top-6 left-0 right-0 text-center">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                      메이팅 · 산란 요약
                    </span>
                  </div>
                </div>

                {/* Clutch labels — 3슬롯 단위 청크 */}
                {clutchChunks.map((chunk, chunkIdx) => {
                  const startIdx = chunkIdx * CLUTCH_SLOTS_PER_LABEL + 1
                  const endIdx = startIdx + chunk.length - 1
                  const labelText = chunk.length === 0
                    ? '빈 라벨'
                    : (startIdx === endIdx ? `${startIdx}차` : `${startIdx}~${endIdx}차`)
                  return (
                    <div key={chunkIdx} className="relative group">
                      <div
                        id={`pairing-label-clutch-chunk-${chunkIdx}`}
                        className="origin-top-left"
                        style={{ width: width * 8 * PREVIEW_SCALE, height: height * 8 * PREVIEW_SCALE }}
                      >
                        <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
                          <ClutchLabel clutches={chunk} settings={settings} />
                        </div>
                      </div>
                      <div className="absolute -top-6 left-0 right-0 text-center">
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                          {labelText} · 3슬롯
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end bg-white shrink-0 z-10">
          <Button onClick={handleDownload} disabled={isDownloading} className="gap-2 px-8 font-bold shadow-md">
            <Download className="w-4 h-4" />
            이미지 다운로드
          </Button>
        </div>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  )
}
