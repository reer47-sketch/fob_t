'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Banner } from '@prisma/client'
import { createBanner } from '@/actions/banners/create-banner'
import { updateBanner } from '@/actions/banners/update-banner'
import { uploadImage } from '@/actions/common/upload-image'
import { toast } from 'sonner'
import { Upload, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface BannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  banner: Banner | null
  onSuccess: () => void
}

export function BannerDialog({ open, onOpenChange, banner, onSuccess }: BannerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    displayOrder: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl || '',
        displayOrder: banner.displayOrder,
        isActive: banner.isActive,
        startDate: banner.startDate
          ? format(new Date(banner.startDate), "yyyy-MM-dd'T'HH:mm")
          : '',
        endDate: banner.endDate
          ? format(new Date(banner.endDate), "yyyy-MM-dd'T'HH:mm")
          : '',
      })
    } else {
      setFormData({
        title: '',
        imageUrl: '',
        linkUrl: '',
        displayOrder: 0,
        isActive: false,
        startDate: '',
        endDate: '',
      })
    }
  }, [banner, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'banners')

      const result = await uploadImage(formDataUpload)
      if (result.success) {
        setFormData((prev) => ({ ...prev, imageUrl: result.url }))
        toast.success('이미지가 업로드되었습니다.')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }

    if (!formData.imageUrl) {
      toast.error('이미지를 업로드해주세요.')
      return
    }

    setLoading(true)
    try {
      const data = {
        title: formData.title,
        imageUrl: formData.imageUrl,
        linkUrl: formData.linkUrl || null,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      }

      const result = banner
        ? await updateBanner({ id: banner.id, ...data })
        : await createBanner(data)

      if (result.success) {
        toast.success(banner ? '배너가 수정되었습니다.' : '배너가 등록되었습니다.')
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{banner ? '배너 수정' : '새 배너 등록'}</DialogTitle>
            <DialogDescription>
              {banner ? '배너 정보를 수정합니다.' : '새로운 배너를 등록합니다.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 overflow-y-auto scrollbar-thin">
            <div className="grid gap-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="배너 제목을 입력하세요"
              />
            </div>

            <div className="grid gap-2">
              <Label>이미지 *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {formData.imageUrl ? (
                <div className="flex justify-center">
                  <div className="relative w-40 aspect-3/4 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={formData.imageUrl}
                      alt="Banner preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1.5 right-1.5 h-6 w-6"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        클릭하여 이미지 업로드
                      </span>
                    </div>
                  )}
                </Button>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="linkUrl">링크 URL</Label>
              <Input
                id="linkUrl"
                value={formData.linkUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))
                }
                placeholder="https://example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="displayOrder">표시 순서</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    displayOrder: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">노출 시작일</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">노출 종료일</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">활성화</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {banner ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
