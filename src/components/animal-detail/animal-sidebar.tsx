import { Separator } from '@/components/ui/separator'
import { AnimalImageGallery } from './animal-image-gallery'
import { AnimalQRCode } from './animal-qr-code'
import type { OwnerInfo } from '@/services/animal-service'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface AnimalImage {
  id: string
  imageUrl: string
  displayOrder: number
  description: string | null
  createdAt: Date
}

interface AnimalSidebarProps {
  images: AnimalImage[]
  animalName: string | null
  animalId: string
  qrCodeDataUrl: string
  qrLinkUrl: string
  owner: OwnerInfo
  onUpdate?: () => void
}

export function AnimalSidebar({ images, animalName, animalId, qrCodeDataUrl, qrLinkUrl, owner, onUpdate }: AnimalSidebarProps) {
  return (
    <div className="w-60 flex flex-col gap-4">
      <AnimalImageGallery
        images={images}
        animalName={animalName}
        animalId={animalId}
        onUpdate={onUpdate}
      />
      <Separator />
      <AnimalQRCode qrCodeDataUrl={qrCodeDataUrl} />
      <Separator />
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">소유자 정보</h4>
        {owner ? (
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">이름:</span> {owner.name}</p>
            <p><span className="text-muted-foreground">연락처:</span> {owner.phone}</p>
            {owner.address && (
              <p><span className="text-muted-foreground">주소:</span> {owner.address}</p>
            )}
            <p><span className="text-muted-foreground">분양일:</span> {format(new Date(owner.adoptionDate), 'yyyy-MM-dd', { locale: ko })}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">미분양</p>
        )}
      </div>
    </div>
  )
}
