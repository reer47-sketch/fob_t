'use client'

export interface PairingLabelSettings {
  width: number
  height: number
}

export type ClutchLabelItem = {
  index: number
  layDate: string
  count: number
  fertile: number
  infertile: number
  unknown: number
}

export type PairingLabelData = {
  femaleName: string
  maleName: string
  species: string
  femaleMorph: string
  maleMorph: string
  matingDate: string
  clutches: ClutchLabelItem[]
}

const COL = { index: '15%', layDate: '33%', count: '17%', fertile: '35%' } as const

const CARD = 'bg-white rounded-2xl overflow-hidden shadow-[0_10px_40px_-12px_rgba(0,0,0,0.15)] border border-gray-100'

interface HeaderLabelProps {
  data: PairingLabelData
  settings: PairingLabelSettings
}

interface ClutchLabelProps {
  clutches: ClutchLabelItem[]
  settings: PairingLabelSettings
}

export const CLUTCH_SLOTS_PER_LABEL = 3

export function HeaderLabel({ data, settings }: HeaderLabelProps) {
  const W = settings.width * 8
  const H = settings.height * 8
  const fs = Math.max(8, Math.min(18, H * 0.13))

  return (
    <div className={CARD} style={{ width: W, height: H }}>
      {/* 메이팅 정보 */}
      <div
        className="flex flex-col justify-center"
        style={{ height: H * 0.6, padding: `0 ${fs * 1.2}px`, gap: fs * 0.2 }}
      >
        {data.species && (
          <div
            className="text-neutral-400 font-medium leading-tight truncate"
            style={{ fontSize: fs * 0.65 }}
          >
            {data.species}
          </div>
        )}
        <div className="font-bold leading-tight truncate" style={{ fontSize: fs * 0.95 }}>
          {data.maleName}{data.maleMorph ? <span className="text-neutral-400 font-medium" style={{ fontSize: fs * 0.7 }}> {data.maleMorph}</span> : null}
          <span className="text-neutral-300 mx-1">×</span>
          {data.femaleName}{data.femaleMorph ? <span className="text-neutral-400 font-medium" style={{ fontSize: fs * 0.7 }}> {data.femaleMorph}</span> : null}
        </div>
        <div className="text-neutral-400 font-medium leading-tight" style={{ fontSize: fs * 0.7 }}>
          메이팅 {data.matingDate}
        </div>
      </div>

      {/* 컬럼 헤더 행 */}
      <div
        className="flex items-center bg-neutral-100/80"
        style={{ height: H * 0.4, padding: `0 ${fs * 1.2}px`, fontSize: fs * 0.75 }}
      >
        <span className="font-bold text-neutral-400 text-center" style={{ width: COL.index }}>차수</span>
        <span className="font-bold text-neutral-400 text-center" style={{ width: COL.layDate }}>산란일</span>
        <span className="font-bold text-neutral-400 text-center" style={{ width: COL.count }}>수량</span>
        <span className="font-bold text-neutral-400 text-center" style={{ width: COL.fertile }}>유/무정</span>
      </div>
    </div>
  )
}

export function ClutchLabel({ clutches, settings }: ClutchLabelProps) {
  const W = settings.width * 8
  const H = settings.height * 8
  const rowH = H / CLUTCH_SLOTS_PER_LABEL
  const fs = Math.max(7, Math.min(16, rowH * 0.45))

  // 3슬롯 고정 — 부족하면 빈 행으로 채워 상단 정렬, 덧붙임 운영용
  const slots: (ClutchLabelItem | null)[] = Array.from({ length: CLUTCH_SLOTS_PER_LABEL }, (_, i) => clutches[i] ?? null)

  return (
    <div className={CARD} style={{ width: W, height: H }}>
      <div className="flex flex-col h-full">
        {slots.map((clutch, i) => {
          const fertileText = clutch
            ? [
                clutch.fertile > 0 ? `유${clutch.fertile}` : '',
                clutch.infertile > 0 ? `무${clutch.infertile}` : '',
                clutch.unknown > 0 ? `?${clutch.unknown}` : '',
              ].filter(Boolean).join(' ')
            : ''

          return (
            <div
              key={i}
              className={`flex items-center ${i < CLUTCH_SLOTS_PER_LABEL - 1 ? 'border-b border-neutral-100' : ''}`}
              style={{ height: rowH, padding: `0 ${fs * 1.2}px`, fontSize: fs }}
            >
              {clutch ? (
                <>
                  <span className="font-bold text-neutral-800 text-center" style={{ width: COL.index }}>
                    {clutch.index}차
                  </span>
                  <span className="text-neutral-600 text-center" style={{ width: COL.layDate }}>
                    {clutch.layDate}
                  </span>
                  <span className="font-semibold text-neutral-800 text-center" style={{ width: COL.count }}>
                    {clutch.count}
                  </span>
                  <span className="text-neutral-500 text-center" style={{ width: COL.fertile }}>
                    {fertileText || '-'}
                  </span>
                </>
              ) : (
                <span className="w-full" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
