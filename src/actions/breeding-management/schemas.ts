import { z } from 'zod'

// ============ 조회 ============

export const getRackDataSchema = z.object({
  zoneId: z.string().optional(),
})
export type GetRackDataInput = z.infer<typeof getRackDataSchema>

export const getEggDataSchema = z.object({
  status: z.enum(['INCUBATING', 'HATCHED', 'FAILED']).optional(),
})
export type GetEggDataInput = z.infer<typeof getEggDataSchema>

// ============ 구역 관리 ============

export const createZoneSchema = z.object({
  name: z.string().min(1).max(20),
  description: z.string().optional(),
})
export type CreateZoneInput = z.infer<typeof createZoneSchema>

export const updateZoneSchema = z.object({
  zoneId: z.string(),
  name: z.string().min(1).max(20),
  description: z.string().optional(),
})
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>

export const deleteZoneSchema = z.object({
  zoneId: z.string(),
})
export type DeleteZoneInput = z.infer<typeof deleteZoneSchema>

// ============ 렉사 관리 ============

export const createRackSchema = z.object({
  zoneId: z.string(),
  name: z.string().min(1).max(30),
  rows: z.number().min(1).max(20),
  cols: z.number().min(1).max(10),
})
export type CreateRackInput = z.infer<typeof createRackSchema>

export const updateRackSchema = z.object({
  rackId: z.string(),
  name: z.string().min(1).max(30),
  rows: z.number().min(1).max(20).optional(),
  cols: z.number().min(1).max(20).optional(),
})
export type UpdateRackInput = z.infer<typeof updateRackSchema>

export const deleteRackSchema = z.object({
  rackId: z.string(),
})
export type DeleteRackInput = z.infer<typeof deleteRackSchema>

// ============ 페어링 ============

// 메이팅은 물리적으로 1:1이므로 수컷 1마리 고정
export const createPairingSchema = z.object({
  femaleId: z.string(),
  maleId: z.string(),
  date: z.string(), // ISO date
  memo: z.string().optional(),
})
export type CreatePairingInput = z.infer<typeof createPairingSchema>

export const updatePairingStatusSchema = z.object({
  pairingId: z.string(),
  status: z.enum(['WAITING', 'MATING', 'LAYING_SOON', 'LAID', 'DONE', 'COOLING']),
})
export type UpdatePairingStatusInput = z.infer<typeof updatePairingStatusSchema>

// 메이팅 정보 수정 (시작일, 메모) — 수컷 변경은 지원하지 않음 (이력 보존 + 산란 계보 무결성)
export const updatePairingSchema = z.object({
  pairingId: z.string(),
  date: z.string(), // ISO date
  memo: z.string().optional(),
})
export type UpdatePairingInput = z.infer<typeof updatePairingSchema>

export const deletePairingSchema = z.object({
  pairingId: z.string(),
})
export type DeletePairingInput = z.infer<typeof deletePairingSchema>

// 시즌 종료(쿨링 진입) — 페어를 강제 쿨링 상태로. 유정란 산란 시 자동 해제됨.
export const enterManualCoolingSchema = z.object({
  pairingId: z.string(),
})
export type EnterManualCoolingInput = z.infer<typeof enterManualCoolingSchema>

// 같은 페어링의 특정 산란일(클러치) 전체 삭제.
// 페어 없이 등록된 단독 산란은 pairingId를 비우고 femaleId만 전달.
export const deleteClutchSchema = z.object({
  pairingId: z.string().optional(),
  femaleId: z.string().optional(),
  layDate: z.string(), // ISO date
}).refine(v => Boolean(v.pairingId) || Boolean(v.femaleId), {
  message: 'pairingId 또는 femaleId 중 하나는 필요합니다',
  path: ['pairingId'],
})
export type DeleteClutchInput = z.infer<typeof deleteClutchSchema>

// ============ 셀 배정 ============

export const assignCellSchema = z.object({
  cellId: z.string(),
  animalId: z.string(),
})
export type AssignCellInput = z.infer<typeof assignCellSchema>

export const unassignCellSchema = z.object({
  cellId: z.string(),
})
export type UnassignCellInput = z.infer<typeof unassignCellSchema>

// ============ 산란 등록 ============

// 한 산란(= 1개 이상의 알)에 페어링을 최대 2개까지 등록 가능.
// 유정란/무정란 수량을 각각 입력 (한 번의 산란에 동시 등록 가능). 합 1~4개.
// maleId/maleId2는 서버에서 pairing.maleId로 자동 결정.
// pairingIds 빈 배열 = 페어 없이 기록 (단독 산란).
export const createEggsSchema = z.object({
  femaleId: z.string(),
  layDate: z.string(), // ISO date
  pairingIds: z.array(z.string()).max(2).default([]),
  fertileCount: z.number().int().min(0).max(4).default(0),
  infertileCount: z.number().int().min(0).max(4).default(0),
  temperature: z.number().min(20).max(28).optional(),
  humidity: z.number().optional(),
  substrate: z.string().optional(),
  memo: z.string().optional(),
}).refine(
  (v) => v.fertileCount + v.infertileCount >= 1 && v.fertileCount + v.infertileCount <= 4,
  { message: '유정/무정 합계는 1~4 사이여야 합니다', path: ['fertileCount'] },
)
export type CreateEggsInput = z.infer<typeof createEggsSchema>

// 개별 알의 아비 변경 (알 관리 페이지에서 사용)
export const updateEggSireSchema = z.object({
  eggId: z.string(),
  maleId: z.string(),
})
export type UpdateEggSireInput = z.infer<typeof updateEggSireSchema>

// 알의 페어링(수컷) 전체 교체 — 1~2개 가능. 2개일 때 첫 번째가 primary, 두 번째가 secondary.
// 1개만 전달하면 secondary는 해제(null).
export const updateEggSiresSchema = z.object({
  eggId: z.string(),
  maleIds: z.array(z.string()).min(1).max(2),
})
export type UpdateEggSiresInput = z.infer<typeof updateEggSiresSchema>

// ============ 알 관리 ============

export const updateEggStatusSchema = z.object({
  eggId: z.string(),
  status: z.enum(['INCUBATING', 'HATCHED', 'FAILED']),
  date: z.string().optional(),
})
export type UpdateEggStatusInput = z.infer<typeof updateEggStatusSchema>

export const changeEggTempSchema = z.object({
  eggId: z.string(),
  temperature: z.number().min(20).max(28),
  startDate: z.string(), // ISO date (yyyy-MM-dd) — 변경 시점
})
export type ChangeEggTempInput = z.infer<typeof changeEggTempSchema>

// 습도·바닥재 등 인큐 환경 수정
export const updateEggEnvironmentSchema = z.object({
  eggId: z.string(),
  humidity: z.number().min(0).max(100).nullable().optional(),
  substrate: z.string().max(30).nullable().optional(),
})
export type UpdateEggEnvironmentInput = z.infer<typeof updateEggEnvironmentSchema>

export const getAnimalBreedingHistorySchema = z.object({
  animalId: z.string(),
})
export type GetAnimalBreedingHistoryInput = z.infer<typeof getAnimalBreedingHistorySchema>

export const updateEggMemoSchema = z.object({
  eggId: z.string(),
  memo: z.string().max(200),
})
export type UpdateEggMemoInput = z.infer<typeof updateEggMemoSchema>

export const deleteTemperatureLogSchema = z.object({
  eggId: z.string(),
  logId: z.number(),
})
export type DeleteTemperatureLogInput = z.infer<typeof deleteTemperatureLogSchema>

export const updateEggFertilitySchema = z.object({
  eggId: z.string(),
  checked: z.boolean().optional(),
  fertileStatus: z.enum(['UNKNOWN', 'FERTILE', 'INFERTILE']).optional(),
})
export type UpdateEggFertilityInput = z.infer<typeof updateEggFertilitySchema>

// ============ 부화 개체 등록 ============

export const getEggRegisterDataSchema = z.object({
  eggId: z.string(),
})
export type GetEggRegisterDataInput = z.infer<typeof getEggRegisterDataSchema>

export const linkEggAnimalSchema = z.object({
  eggId: z.string(),
  animalId: z.string(),
})
export type LinkEggAnimalInput = z.infer<typeof linkEggAnimalSchema>
