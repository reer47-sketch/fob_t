import { AnimalBasicInfo } from './animal-basic-info'
import { AnimalDetailedInfo } from './animal-detailed-info'
import { AnimalParentInfo } from './animal-parent-info'
import { AnimalHabitatInfo } from './animal-habitat-info'
import { AnimalLatestFeedingInfo } from './animal-latest-feeding-info'
import { Separator } from '@/components/ui/separator'
import type { AnimalDetailData } from '@/services/animal-service'

interface AnimalInfoContentProps {
  animal: AnimalDetailData
  qrLinkUrl?: string
  onUpdate?: () => void
  onUpdateWithRefresh?: () => void
}

export function AnimalInfoContent({ animal, qrLinkUrl, onUpdate, onUpdateWithRefresh }: AnimalInfoContentProps) {
  // Date를 string으로 변환
  const acquisitionDateString = animal.acquisitionDate.toISOString()
  const hatchDateString = animal.hatchDate?.toISOString() ?? null
  const deathDateString = animal.deathDate?.toISOString() ?? null

  // parentType을 올바른 타입으로 변환
  const parents = animal.parents.map((p) => ({
    parentType: p.parentType as 'FATHER' | 'MOTHER',
    parent: p.parent,
  }))

  return (
    <div className="flex-1 space-y-6 overflow-y-auto">
      <AnimalBasicInfo
        animalId={animal.id}
        name={animal.name}
        uniqueId={animal.uniqueId}
        gender={animal.gender}
        acquisitionType={animal.acquisitionType}
        acquisitionDate={acquisitionDateString}
        hatchDate={hatchDateString}
        deathDate={deathDateString}
        isPublic={animal.isPublic}
        isBreeding={animal.isBreeding}
        parentPublic={animal.parentPublic}
        onUpdate={onUpdateWithRefresh}
        qrLinkUrl={qrLinkUrl}
      />

      <Separator />

      <AnimalDetailedInfo
        animalId={animal.id}
        detail={animal.detail}
        codes={animal.codes}
        onUpdate={onUpdateWithRefresh}
      />

      <Separator />

      <AnimalParentInfo
        animalId={animal.id}
        acquisitionType={animal.acquisitionType}
        parents={parents}
        onUpdate={onUpdate}
      />

      <Separator />

      <AnimalHabitatInfo
        animalId={animal.id}
        detail={animal.detail}
        onUpdate={onUpdate}
      />

      <Separator />

      <AnimalLatestFeedingInfo latestFeeding={animal.latestFeeding} />
    </div>
  )
}
