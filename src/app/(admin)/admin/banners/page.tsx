'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { BannerTable } from './_components/banner-table'
import { BannerDialog } from './_components/banner-dialog'
import { getBanners } from '@/actions/banners/get-banners'
import { reorderBanners } from '@/actions/banners/reorder-banners'
import { Banner } from '@prisma/client'
import { toast } from 'sonner'

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)

  const loadBanners = useCallback(async () => {
    try {
      const result = await getBanners({ page: 1, pageSize: 100 })
      if (result.success) {
        setBanners(result.data.banners)
      } else {
        toast.error(result.error || '배너 목록을 불러오는데 실패했습니다.')
      }
    } catch {
      toast.error('배너 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBanners()
  }, [loadBanners])

  const handleAdd = () => {
    setEditingBanner(null)
    setDialogOpen(true)
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    loadBanners()
  }

  const handleReorder = async (orderedIds: string[]) => {
    const reorderedBanners = orderedIds
      .map((id) => banners.find((b) => b.id === id))
      .filter((b): b is Banner => b !== undefined)
    setBanners(reorderedBanners)

    const result = await reorderBanners({ orderedIds })
    if (!result.success) {
      toast.error(result.error || '순서 변경에 실패했습니다.')
      loadBanners()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={handleAdd} className="gap-2 bg-[#58BA2E] hover:bg-[#58BA2E]/90">
          <PlusCircle className="h-4 w-4" />
          새 배너 등록
        </Button>
      </div>

      <BannerTable banners={banners} onEdit={handleEdit} onReorder={handleReorder} onDelete={loadBanners} />

      <BannerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        banner={editingBanner}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
