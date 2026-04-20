'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { getAnimalBreedingHistory } from '@/actions/breeding-management/get-animal-breeding-history'
import type { AnimalBreedingPairing } from '@/services/breeding-management-service'

interface AnimalBreedingHistoryProps {
  animalId: string
  gender: string
}

const pairingStatusLabels: Record<string, string> = {
  WAITING: '대기',
  MATING: '메이팅',
  LAYING_SOON: '산란임박',
  LAID: '산란',
  DONE: '완료',
  COOLING: '쿨링',
}

const pairingStatusColors: Record<string, string> = {
  WAITING: 'bg-neutral-100 text-neutral-600',
  MATING: 'bg-orange-50 text-orange-600',
  LAYING_SOON: 'bg-red-50 text-red-600',
  LAID: 'bg-violet-50 text-violet-600',
  DONE: 'bg-green-50 text-green-700',
  COOLING: 'bg-sky-50 text-sky-600',
}

const eggStatusLabels: Record<string, string> = {
  INCUBATING: '인큐중',
  HATCHED: '부화',
  FAILED: '실패',
}

const fertileLabels: Record<string, string> = {
  UNKNOWN: '미확인',
  FERTILE: '유정',
  INFERTILE: '무정',
}

function EggTable({ eggs }: { eggs: AnimalBreedingPairing['eggs'] }) {
  if (eggs.length === 0) return null

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="text-left text-muted-foreground font-medium py-1.5 pr-3">#</th>
            <th className="text-left text-muted-foreground font-medium py-1.5 pr-3">산란일</th>
            <th className="text-left text-muted-foreground font-medium py-1.5 pr-3">유정란</th>
            <th className="text-left text-muted-foreground font-medium py-1.5">상태</th>
          </tr>
        </thead>
        <tbody>
          {eggs.map((egg, i) => (
            <tr key={egg.id} className="border-b border-neutral-50 last:border-0">
              <td className="py-1.5 pr-3 text-muted-foreground">{i + 1}</td>
              <td className="py-1.5 pr-3">{egg.layDate}</td>
              <td className="py-1.5 pr-3">
                <span className={
                  egg.fertileStatus === 'FERTILE' ? 'text-green-600 font-medium' :
                  egg.fertileStatus === 'INFERTILE' ? 'text-red-500' :
                  'text-muted-foreground'
                }>
                  {fertileLabels[egg.fertileStatus] ?? egg.fertileStatus}
                </span>
              </td>
              <td className="py-1.5">
                <Badge variant="outline" className={`text-xs font-normal ${
                  egg.status === 'HATCHED' ? 'border-green-200 text-green-700 bg-green-50' :
                  egg.status === 'FAILED' ? 'border-red-200 text-red-600 bg-red-50' :
                  'border-violet-200 text-violet-600 bg-violet-50'
                }`}>
                  {eggStatusLabels[egg.status] ?? egg.status}
                  {egg.hatchDate ? ` (${egg.hatchDate})` : ''}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PairingCard({ pairing, gender }: { pairing: AnimalBreedingPairing; gender: string }) {
  const partnerLabel = gender === 'FEMALE' ? '수컷' : '암컷'
  const eggSummary = pairing.eggs.length > 0
    ? {
        total: pairing.eggs.length,
        fertile: pairing.eggs.filter(e => e.fertileStatus === 'FERTILE').length,
        hatched: pairing.eggs.filter(e => e.status === 'HATCHED').length,
        failed: pairing.eggs.filter(e => e.status === 'FAILED').length,
      }
    : null

  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-3 space-y-2">
      {/* 헤더: 날짜 + 상태 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{pairing.date}</span>
        <Badge className={`text-xs font-normal ${pairingStatusColors[pairing.status] ?? ''}`}>
          {pairingStatusLabels[pairing.status] ?? pairing.status}
        </Badge>
      </div>

      {/* 상대 정보 */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{partnerLabel}:</span>
        {pairing.partnerNames.map((name, i) => (
          <span key={i} className="text-sm">
            {name}
            {pairing.partnerMorphs[i] && (
              <span className="text-xs text-muted-foreground ml-1">
                ({pairing.partnerMorphs[i]})
              </span>
            )}
            {i < pairing.partnerNames.length - 1 && <span className="text-muted-foreground">, </span>}
          </span>
        ))}
      </div>

      {/* 알 요약 */}
      {eggSummary && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>산란 {eggSummary.total}개</span>
          {eggSummary.fertile > 0 && <span className="text-green-600">유정 {eggSummary.fertile}</span>}
          {eggSummary.hatched > 0 && <span className="text-green-700">부화 {eggSummary.hatched}</span>}
          {eggSummary.failed > 0 && <span className="text-red-500">실패 {eggSummary.failed}</span>}
        </div>
      )}

      {/* 산란표 */}
      <EggTable eggs={pairing.eggs} />

      {/* 메모 */}
      {pairing.memo && (
        <p className="text-xs text-muted-foreground mt-1">{pairing.memo}</p>
      )}
    </div>
  )
}

export function AnimalBreedingHistory({ animalId, gender }: AnimalBreedingHistoryProps) {
  const [pairings, setPairings] = useState<AnimalBreedingPairing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const result = await getAnimalBreedingHistory({ animalId })
      if (!cancelled && result.success) {
        setPairings(result.data.pairings)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [animalId])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold min-w-0">브리딩 기록</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : pairings.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          페어링 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {pairings.map(p => (
            <PairingCard key={p.id} pairing={p} gender={gender} />
          ))}
        </div>
      )}
    </div>
  )
}
