import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  resolvePairingAfterEggLay,
  resolvePairingAfterClutchDelete,
  resolvePairingEnterManualCooling,
} from '@/lib/pairing-state'
import type {
  GetRackDataInput,
  GetEggDataInput,
  GetAnimalBreedingHistoryInput,
  CreateZoneInput,
  UpdateZoneInput,
  DeleteZoneInput,
  CreateRackInput,
  UpdateRackInput,
  DeleteRackInput,
  CreatePairingInput,
  UpdatePairingStatusInput,
  UpdatePairingInput,
  DeletePairingInput,
  DeleteClutchInput,
  AssignCellInput,
  UnassignCellInput,
  CreateEggsInput,
  UpdateEggStatusInput,
  ChangeEggTempInput,
  UpdateEggFertilityInput,
  UpdateEggMemoInput,
  UpdateEggEnvironmentInput,
  UpdateEggSiresInput,
  DeleteTemperatureLogInput,
  GetEggRegisterDataInput,
  LinkEggAnimalInput,
} from '@/actions/breeding-management/schemas'

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============ 조회용 타��� ============

export type RackDataZone = {
  id: string
  name: string
  displayOrder: number
  racks: RackDataRack[]
}

export type RackDataRack = {
  id: string
  name: string
  rows: number
  cols: number
  displayOrder: number
  cells: RackDataCell[]
}

export type RackDataCell = {
  id: string
  row: number
  col: number
  animal: RackDataAnimal | null
}

export type RackDataAnimal = {
  id: string
  name: string | null
  uniqueId: string
  gender: string
  species: string | null
  morph: string | null
  imageUrl: string | null
  hatchDate: string | null // ISO yyyy-MM-dd, 해칭일
  acquisitionDate: string // ISO yyyy-MM-dd, 등록일
}

export type RackDataPairingMale = {
  id: string
  name: string | null
  uniqueId: string
  gender: string
  species: string | null
  morph: string | null
  imageUrl: string | null
}

export type RackDataPairingEgg = {
  id: string
  layDate: string
  status: string
  fertileStatus: string
  checked: boolean
  maleId: string | null
  maleName: string | null
}

// 페어링은 수컷 1:1 (현실 모델과 일치)
export type RackDataPairing = {
  id: string
  femaleId: string
  date: string
  status: string
  memo: string | null
  maleId: string
  male: RackDataPairingMale
  eggs: RackDataPairingEgg[]
  // 쿨링+무정란 산란 시 5일 후 DONE 전환 예약 시각 (ISO); 배란기(WAITING) 표시 & 자동 마감에 사용
  endScheduledAt: string | null
  // 관리자가 시즌 종료 액션으로 강제 쿨링 진입한 시각 (ISO); 유정란 산란 시 자동 해제
  manuallyCoolingAt: string | null
}

export type RackDataResult = {
  zones: RackDataZone[]
  pairings: RackDataPairing[]
  unassignedAnimals: RackDataAnimal[]
  // 암컷별 가장 최근 산란일(yyyy-MM-dd). 페어 소속 + 페어 없는(단독) 산란 모두 포함.
  // 셀/상세 패널에서 "5일 내 산란 = 배란기(WAITING)" 판정에 사용.
  latestEggLayDateByFemaleId: Record<string, string>
  // 암컷별 가장 최근 산란(클러치)에 기록된 최신 온도(°C). 산란 등록 시 기본 온도 자동 채움에 사용.
  latestEggTempByFemaleId: Record<string, number>
}

export type EggParentInfo = {
  id: string
  name: string | null
  uniqueId: string
  gender: string
  species: string | null
  morph: string | null
  imageUrl: string | null
  // sireCandidates 전용: 해당 암컷과의 가장 최근 메이팅 날짜 (yyyy-MM-dd). 일반 부모 정보 시 null.
  latestPairingDate?: string | null
}

export type EggDataItem = {
  id: string
  // 페어 없이 등록된 유정란은 pairingId/maleId/male 모두 null 가능
  pairingId: string | null
  femaleId: string
  femaleName: string | null
  maleId: string | null
  female: EggParentInfo
  male: EggParentInfo | null
  // 2순위 페어링 (불확실 산란) — 설정되지 않으면 null
  pairingId2: string | null
  maleId2: string | null
  male2: EggParentInfo | null
  // 페어링 변경 후보 = 해당 암컷의 모든 페어링에 등장한 수컷들
  sireCandidates: EggParentInfo[]
  layDate: string
  checked: boolean
  fertileStatus: string
  humidity: number | null
  substrate: string | null
  status: string
  hatchDate: string | null
  memo: string | null
  hatchedAnimalId: string | null
  temperatureLogs: { id: number; temp: number; startDate: string }[]
}

// ============ 개체별 브리딩 기록 타입 ============

export type AnimalBreedingEgg = {
  id: string
  layDate: string
  status: string
  fertileStatus: string
  checked: boolean
  hatchDate: string | null
}

export type AnimalBreedingPairing = {
  id: string
  date: string
  status: string
  memo: string | null
  partnerNames: string[]
  partnerMorphs: string[]
  eggs: AnimalBreedingEgg[]
}

export type AnimalBreedingHistoryResult = {
  pairings: AnimalBreedingPairing[]
}

// ============ 개체별 브리딩 기록 조회 ============

export async function getAnimalBreedingHistoryService(
  input: GetAnimalBreedingHistoryInput,
  tenantId: string,
): Promise<ServiceResponse<AnimalBreedingHistoryResult>> {
  try {
    const animal = await prisma.animal.findFirst({
      where: { id: input.animalId, tenantId, isDel: false },
      select: { gender: true },
    })
    if (!animal) return { success: false, error: '개체를 찾을 수 없습니다' }

    const isFemale = animal.gender === 'FEMALE'

    const pairingsRaw = await prisma.pairing.findMany({
      where: {
        tenantId,
        ...(isFemale
          ? { femaleId: input.animalId }
          : { maleId: input.animalId }),
      },
      include: {
        female: {
          select: {
            name: true,
            uniqueId: true,
            codes: {
              where: { isPrimary: true, code: { category: 'MORPH' } },
              include: { code: { select: { name: true } } },
            },
          },
        },
        male: {
          select: {
            name: true,
            uniqueId: true,
            codes: {
              where: { isPrimary: true, code: { category: 'MORPH' } },
              include: { code: { select: { name: true } } },
            },
          },
        },
        eggs: {
          select: {
            id: true,
            layDate: true,
            status: true,
            fertileStatus: true,
            checked: true,
            hatchDate: true,
          },
          orderBy: { layDate: 'asc' },
        },
        // 2순위 페어링으로 등록된 알도 함께 표시
        eggs2: {
          select: {
            id: true,
            layDate: true,
            status: true,
            fertileStatus: true,
            checked: true,
            hatchDate: true,
          },
          orderBy: { layDate: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    })

    const pairings: AnimalBreedingPairing[] = pairingsRaw.map(p => {
      // 상대방 이름/모프 추출 (페어링은 1:1이므로 단일값을 배열 1개로 감쌈)
      let partnerNames: string[]
      let partnerMorphs: string[]

      if (isFemale) {
        partnerNames = [p.male.name ?? p.male.uniqueId]
        partnerMorphs = [p.male.codes[0]?.code.name ?? '']
      } else {
        partnerNames = [p.female.name ?? p.female.uniqueId]
        partnerMorphs = [p.female.codes[0]?.code.name ?? '']
      }

      // 1순위/2순위 알을 합쳐서 산란일 순으로 정렬 (id 중복 제거)
      const mergedEggsMap = new Map<string, (typeof p.eggs)[number]>()
      for (const e of [...p.eggs, ...p.eggs2]) {
        mergedEggsMap.set(e.id, e)
      }
      const mergedEggs = Array.from(mergedEggsMap.values()).sort(
        (a, b) => a.layDate.getTime() - b.layDate.getTime(),
      )

      return {
        id: p.id,
        date: p.date.toISOString().slice(0, 10),
        status: p.status,
        memo: p.memo,
        partnerNames,
        partnerMorphs,
        eggs: mergedEggs.map(e => ({
          id: e.id,
          layDate: e.layDate.toISOString().slice(0, 10),
          status: e.status,
          fertileStatus: e.fertileStatus,
          checked: e.checked,
          hatchDate: e.hatchDate?.toISOString().slice(0, 10) ?? null,
        })),
      }
    })

    // 페어 없이 기록된 산란 (암컷만, 무정란 단독 기록) — 가상 엔트리로 묶어서 함께 반환
    if (isFemale) {
      const orphanEggs = await prisma.egg.findMany({
        where: {
          femaleId: input.animalId,
          pairingId: null,
          female: { tenantId },
        },
        select: {
          id: true,
          layDate: true,
          status: true,
          fertileStatus: true,
          checked: true,
          hatchDate: true,
        },
        orderBy: { layDate: 'asc' },
      })
      if (orphanEggs.length > 0) {
        const firstDate = orphanEggs[0].layDate.toISOString().slice(0, 10)
        pairings.push({
          id: `orphan-${input.animalId}`,
          date: firstDate,
          status: 'DONE',
          memo: null,
          partnerNames: ['페어 없이 기록'],
          partnerMorphs: [''],
          eggs: orphanEggs.map(e => ({
            id: e.id,
            layDate: e.layDate.toISOString().slice(0, 10),
            status: e.status,
            fertileStatus: e.fertileStatus,
            checked: e.checked,
            hatchDate: e.hatchDate?.toISOString().slice(0, 10) ?? null,
          })),
        })
      }
    }

    return { success: true, data: { pairings } }
  } catch (error) {
    console.error('getAnimalBreedingHistoryService error:', error)
    return { success: false, error: '브리딩 기록 조회 실패' }
  }
}

// ============ 렉사 데이터 조회 ============

export async function getRackDataService(
  input: GetRackDataInput,
  tenantId: string,
): Promise<ServiceResponse<RackDataResult>> {
  try {
    // 종료 예약(endScheduledAt) 만료된 페어링을 DONE으로 마감 — 조회 직전 실행
    await prisma.pairing.updateMany({
      where: {
        tenantId,
        endScheduledAt: { not: null, lte: new Date() },
        status: { not: 'DONE' },
      },
      data: { status: 'DONE', doneAt: new Date() },
    })

    // 구역 + 렉사 + 셀 + 개체 한번에 조회
    const zones = await prisma.zone.findMany({
      where: { tenantId },
      orderBy: { displayOrder: 'asc' },
      include: {
        racks: {
          orderBy: { displayOrder: 'asc' },
          include: {
            cells: {
              orderBy: [{ row: 'asc' }, { col: 'asc' }],
              include: {
                animal: {
                  select: {
                    id: true,
                    name: true,
                    uniqueId: true,
                    gender: true,
                    hatchDate: true,
                    acquisitionDate: true,
                    images: { take: 1, orderBy: { createdAt: 'desc' }, select: { imageUrl: true } },
                    codes: {
                      where: {
                        OR: [
                          { isPrimary: true, code: { category: 'MORPH' } },
                          { code: { category: 'SPECIES' } },
                        ],
                      },
                      include: { code: { select: { name: true, category: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // 페어링 조회 (DONE/COOLING 제외하지 않고 전부)
    const pairingsRaw = await prisma.pairing.findMany({
      where: { tenantId },
      include: {
        male: {
          select: {
            id: true,
            name: true,
            uniqueId: true,
            gender: true,
            images: { take: 1, orderBy: { createdAt: 'desc' }, select: { imageUrl: true } },
            codes: {
              where: {
                OR: [
                  { isPrimary: true, code: { category: 'MORPH' } },
                  { code: { category: 'SPECIES' } },
                ],
              },
              include: { code: { select: { name: true, category: true } } },
            },
          },
        },
        eggs: {
          select: {
            id: true,
            layDate: true,
            status: true,
            fertileStatus: true,
            checked: true,
            maleId: true,
            male: { select: { name: true } },
          },
          orderBy: { layDate: 'desc' },
        },
      },
      orderBy: { date: 'desc' },
    })
    // endScheduledAt select — include 에 포함되지 않은 스칼라 필드이므로 위 쿼리에서 자동 포함됨

    // 렉사에 배정된 개체 ID
    const assignedAnimalIds = new Set<string>()
    zones.forEach(z => z.racks.forEach(r => r.cells.forEach(c => {
      if (c.animalId) assignedAnimalIds.add(c.animalId)
    })))

    // 미배정 개체 (isBreeding = true인 것만)
    const unassigned = await prisma.animal.findMany({
      where: {
        tenantId,
        isDel: false,
        isBreeding: true,
        id: { notIn: Array.from(assignedAnimalIds) },
      },
      select: {
        id: true,
        name: true,
        uniqueId: true,
        gender: true,
        hatchDate: true,
        acquisitionDate: true,
        images: { take: 1, orderBy: { createdAt: 'desc' }, select: { imageUrl: true } },
        codes: {
          where: {
            OR: [
              { isPrimary: true, code: { category: 'MORPH' } },
              { code: { category: 'SPECIES' } },
            ],
          },
          include: { code: { select: { name: true, category: true } } },
        },
      },
      orderBy: { name: 'asc' },
    })

    // 변환
    const zonesData: RackDataZone[] = zones.map(z => ({
      id: z.id,
      name: z.name,
      displayOrder: z.displayOrder,
      racks: z.racks.map(r => ({
        id: r.id,
        name: r.name,
        rows: r.rows,
        cols: r.cols,
        displayOrder: r.displayOrder,
        cells: r.cells.map(c => ({
          id: c.id,
          row: c.row,
          col: c.col,
          animal: c.animal ? {
            id: c.animal.id,
            name: c.animal.name,
            uniqueId: c.animal.uniqueId,
            gender: c.animal.gender,
            species: c.animal.codes.find(ac => ac.code.category === 'SPECIES')?.code.name ?? null,
            morph: c.animal.codes.find(ac => ac.code.category === 'MORPH')?.code.name ?? null,
            imageUrl: c.animal.images[0]?.imageUrl ?? null,
            hatchDate: c.animal.hatchDate ? c.animal.hatchDate.toISOString().slice(0, 10) : null,
            acquisitionDate: c.animal.acquisitionDate.toISOString().slice(0, 10),
          } : null,
        })),
      })),
    }))

    const pairingsData: RackDataPairing[] = pairingsRaw.map(p => ({
      id: p.id,
      femaleId: p.femaleId,
      date: p.date.toISOString().slice(0, 10),
      status: p.status,
      memo: p.memo,
      maleId: p.maleId,
      male: {
        id: p.male.id,
        name: p.male.name,
        uniqueId: p.male.uniqueId,
        gender: p.male.gender,
        species: p.male.codes.find(ac => ac.code.category === 'SPECIES')?.code.name ?? null,
        morph: p.male.codes.find(ac => ac.code.category === 'MORPH')?.code.name ?? null,
        imageUrl: p.male.images[0]?.imageUrl ?? null,
      },
      eggs: p.eggs.map(e => ({
        id: e.id,
        layDate: e.layDate.toISOString().slice(0, 10),
        status: e.status,
        fertileStatus: e.fertileStatus,
        checked: e.checked,
        maleId: e.maleId,
        maleName: e.male?.name ?? null,
      })),
      endScheduledAt: p.endScheduledAt?.toISOString() ?? null,
      manuallyCoolingAt: p.manuallyCoolingAt?.toISOString() ?? null,
    }))

    const unassignedAnimals: RackDataAnimal[] = unassigned.map(a => ({
      id: a.id,
      name: a.name,
      uniqueId: a.uniqueId,
      gender: a.gender,
      species: a.codes.find(ac => ac.code.category === 'SPECIES')?.code.name ?? null,
      morph: a.codes.find(ac => ac.code.category === 'MORPH')?.code.name ?? null,
      imageUrl: a.images[0]?.imageUrl ?? null,
      hatchDate: a.hatchDate ? a.hatchDate.toISOString().slice(0, 10) : null,
      acquisitionDate: a.acquisitionDate.toISOString().slice(0, 10),
    }))

    // 암컷별 최신 산란일 집계 (페어 소속 + 단독 산란 모두 포함).
    // 단독 산란은 pairings에 실리지 않으므로 derive에서 놓치게 된다 → 여기서 통합해 공급.
    // Egg에 tenantId 스칼라가 없어 female 관계로 소유권 필터링.
    const latestEggsGrouped = await prisma.egg.groupBy({
      by: ['femaleId'],
      where: { female: { tenantId } },
      _max: { layDate: true },
    })
    const latestEggLayDateByFemaleId: Record<string, string> = {}
    for (const row of latestEggsGrouped) {
      const maxDate = row._max?.layDate
      if (maxDate) {
        latestEggLayDateByFemaleId[row.femaleId] = maxDate.toISOString().slice(0, 10)
      }
    }

    // 암컷별 "가장 최근 클러치"에 달린 온도 로그 중 가장 최신 값 — 다음 산란 등록 시 기본 온도로 사용.
    // 같은 클러치에 여러 알이 있고 각자 온도 이력이 갈라졌을 수 있으므로 클러치 전체의 최신 startDate 로그를 채택.
    const latestEggTempByFemaleId: Record<string, number> = {}
    const latestClutchFilters = Object.entries(latestEggLayDateByFemaleId).map(([femaleId, layDate]) => ({
      femaleId,
      layDate: new Date(layDate),
    }))
    if (latestClutchFilters.length > 0) {
      const latestTempLogs = await prisma.temperatureLog.findMany({
        where: {
          egg: { female: { tenantId }, OR: latestClutchFilters },
        },
        orderBy: { startDate: 'desc' },
        select: { temp: true, egg: { select: { femaleId: true } } },
      })
      for (const log of latestTempLogs) {
        const fid = log.egg.femaleId
        if (latestEggTempByFemaleId[fid] === undefined) {
          latestEggTempByFemaleId[fid] = log.temp
        }
      }
    }

    return { success: true, data: { zones: zonesData, pairings: pairingsData, unassignedAnimals, latestEggLayDateByFemaleId, latestEggTempByFemaleId } }
  } catch (error) {
    console.error('getRackDataService error:', error)
    return { success: false, error: '렉사 데이터 조회 실패' }
  }
}

// ============ 알 데이터 조회 ============

export async function getEggDataService(
  input: GetEggDataInput,
  tenantId: string,
): Promise<ServiceResponse<EggDataItem[]>> {
  try {
    // 알 관리엔 유정란만 노출 (무정란/미확인은 제외)
    // 페어 없이 등록된 유정란도 포함하기 위해 tenant 검증은 암컷(Animal) 기준으로 수행.
    const where: Prisma.EggWhereInput = {
      female: { tenantId },
      fertileStatus: 'FERTILE',
      ...(input.status && { status: input.status }),
    }

    const animalSelect = {
      id: true,
      name: true,
      uniqueId: true,
      gender: true,
      images: { take: 1, orderBy: { createdAt: 'desc' as const }, select: { imageUrl: true } },
      codes: {
        where: {
          OR: [
            { isPrimary: true, code: { category: 'MORPH' as const } },
            { code: { category: 'SPECIES' as const } },
          ],
        },
        include: { code: { select: { name: true, category: true } } },
      },
    }

    const eggs = await prisma.egg.findMany({
      where,
      include: {
        female: { select: animalSelect },
        male: { select: animalSelect },
        male2: { select: animalSelect },
        temperatureLogs: { orderBy: { startDate: 'asc' } },
      },
      orderBy: { layDate: 'desc' },
    })

    // 페어링 변경 후보 = 해당 암컷의 모든 페어링에 등장한 수컷들
    // (여러 알이 같은 암컷을 공유할 수 있어서 한 번에 조회)
    // 같은 수컷이 여러 메이팅에 등장하면 가장 최근 date를 latestPairingDate로 채움.
    const femaleIds = Array.from(new Set(eggs.map(e => e.femaleId)))
    const candidatePairings = femaleIds.length > 0
      ? await prisma.pairing.findMany({
          where: { tenantId, femaleId: { in: femaleIds } },
          select: {
            femaleId: true,
            date: true,
            male: { select: animalSelect },
          },
          orderBy: { date: 'desc' },
        })
      : []
    const candidatesByFemale = new Map<string, EggParentInfo[]>()
    for (const p of candidatePairings) {
      const list = candidatesByFemale.get(p.femaleId) ?? []
      const existing = list.find(c => c.id === p.male.id)
      if (!existing) {
        // orderBy date desc 이므로 첫 등장이 최신
        list.push({ ...toParentInfo(p.male), latestPairingDate: p.date.toISOString().slice(0, 10) })
      }
      candidatesByFemale.set(p.femaleId, list)
    }

    function toParentInfo(a: typeof eggs[number]['female']): EggParentInfo {
      return {
        id: a.id,
        name: a.name,
        uniqueId: a.uniqueId,
        gender: a.gender,
        species: a.codes.find(ac => ac.code.category === 'SPECIES')?.code.name ?? null,
        morph: a.codes.find(ac => ac.code.category === 'MORPH')?.code.name ?? null,
        imageUrl: a.images[0]?.imageUrl ?? null,
      }
    }

    // 알 관리(인큐)는 유정란만 노출. 페어 없이 등록된 유정란은 pairingId/maleId/male 이 null.
    const items: EggDataItem[] = eggs.map(e => ({
      id: e.id,
      pairingId: e.pairingId,
      femaleId: e.femaleId,
      femaleName: e.female.name,
      maleId: e.maleId,
      female: toParentInfo(e.female),
      male: e.male ? toParentInfo(e.male) : null,
      pairingId2: e.pairingId2,
      maleId2: e.maleId2,
      male2: e.male2 ? toParentInfo(e.male2) : null,
      sireCandidates: candidatesByFemale.get(e.femaleId) ?? [],
      layDate: e.layDate.toISOString().slice(0, 10),
      checked: e.checked,
      fertileStatus: e.fertileStatus,
      humidity: e.humidity,
      substrate: e.substrate,
      status: e.status,
      hatchDate: e.hatchDate?.toISOString().slice(0, 10) ?? null,
      memo: e.memo,
      hatchedAnimalId: e.hatchedAnimalId,
      temperatureLogs: e.temperatureLogs.map(t => ({
        id: t.id,
        temp: t.temp,
        startDate: t.startDate.toISOString().slice(0, 10),
      })),
    }))

    return { success: true, data: items }
  } catch (error) {
    console.error('getEggDataService error:', error)
    return { success: false, error: '알 데이터 조회 실패' }
  }
}

// ============ 구역 생성 ============

export async function createZoneService(
  input: CreateZoneInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    // 다음 displayOrder 계산
    const maxOrder = await prisma.zone.aggregate({
      where: { tenantId },
      _max: { displayOrder: true },
    })
    const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description,
        displayOrder: nextOrder,
      },
    })

    return { success: true, data: { id: zone.id } }
  } catch (error) {
    console.error('createZoneService error:', error)
    return { success: false, error: '구역 생성 실패' }
  }
}

// ============ 구역 수정 ============

export async function updateZoneService(
  input: UpdateZoneInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const zone = await prisma.zone.findFirst({
      where: { id: input.zoneId, tenantId },
    })
    if (!zone) return { success: false, error: '구역을 찾을 수 없습니다' }

    await prisma.zone.update({
      where: { id: input.zoneId },
      data: {
        name: input.name,
        description: input.description,
      },
    })

    return { success: true, data: { id: input.zoneId } }
  } catch (error) {
    console.error('updateZoneService error:', error)
    return { success: false, error: '구역 수정 실패' }
  }
}

// ============ 구역 삭제 ============

export async function deleteZoneService(
  input: DeleteZoneInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const zone = await prisma.zone.findFirst({
      where: { id: input.zoneId, tenantId },
      include: { racks: { select: { id: true } } },
    })
    if (!zone) return { success: false, error: '구역을 찾을 수 없습니다' }
    if (zone.racks.length > 0) return { success: false, error: '렉사가 있는 구역은 삭제할 수 없습니다' }

    await prisma.zone.delete({ where: { id: input.zoneId } })

    return { success: true, data: { id: input.zoneId } }
  } catch (error) {
    console.error('deleteZoneService error:', error)
    return { success: false, error: '구역 삭제 실패' }
  }
}

// ============ 렉사 생성 ============

export async function createRackService(
  input: CreateRackInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    // 구역 소유권 확인
    const zone = await prisma.zone.findFirst({
      where: { id: input.zoneId, tenantId },
    })
    if (!zone) return { success: false, error: '구역을 찾을 수 없습니다' }

    // 다음 displayOrder
    const maxOrder = await prisma.rack.aggregate({
      where: { zoneId: input.zoneId },
      _max: { displayOrder: true },
    })
    const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1

    // 렉사 + 셀 생성
    const rack = await prisma.rack.create({
      data: {
        zoneId: input.zoneId,
        name: input.name,
        rows: input.rows,
        cols: input.cols,
        displayOrder: nextOrder,
        cells: {
          create: Array.from({ length: input.rows * input.cols }, (_, i) => ({
            row: Math.floor(i / input.cols),
            col: i % input.cols,
          })),
        },
      },
    })

    return { success: true, data: { id: rack.id } }
  } catch (error) {
    console.error('createRackService error:', error)
    return { success: false, error: '렉사 생성 실패' }
  }
}

// ============ 렉사 수정 ============

export async function updateRackService(
  input: UpdateRackInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const rack = await prisma.rack.findFirst({
      where: { id: input.rackId },
      include: { zone: true },
    })
    if (!rack || rack.zone.tenantId !== tenantId) {
      return { success: false, error: '렉사를 찾을 수 없습니다' }
    }

    const newRows = input.rows ?? rack.rows
    const newCols = input.cols ?? rack.cols

    // 행/열 줄일 때 해당 위치에 개체가 있는지 확인
    if (newRows < rack.rows || newCols < rack.cols) {
      const occupiedInRemoved = await prisma.rackCell.findFirst({
        where: {
          rackId: input.rackId,
          animalId: { not: null },
          OR: [
            ...(newRows < rack.rows ? [{ row: { gte: newRows } }] : []),
            ...(newCols < rack.cols ? [{ col: { gte: newCols } }] : []),
          ],
        },
      })
      if (occupiedInRemoved) {
        return { success: false, error: '제거할 행/열에 배정된 개체가 있습니다. 먼저 개체를 빼주세요.' }
      }
    }

    await prisma.$transaction(async (tx) => {
      // 렉사 기본 정보 업데이트
      await tx.rack.update({
        where: { id: input.rackId },
        data: { name: input.name, rows: newRows, cols: newCols },
      })

      // 줄어든 행/열의 셀 삭제
      if (newRows < rack.rows || newCols < rack.cols) {
        await tx.rackCell.deleteMany({
          where: {
            rackId: input.rackId,
            OR: [
              { row: { gte: newRows } },
              { col: { gte: newCols } },
            ],
          },
        })
      }

      // 늘어난 영역에 새 셀 생성
      if (newRows > rack.rows || newCols > rack.cols) {
        const newCells: { rackId: string; row: number; col: number }[] = []
        for (let r = 0; r < newRows; r++) {
          for (let c = 0; c < newCols; c++) {
            if (r >= rack.rows || c >= rack.cols) {
              newCells.push({ rackId: input.rackId, row: r, col: c })
            }
          }
        }
        if (newCells.length > 0) {
          await tx.rackCell.createMany({ data: newCells, skipDuplicates: true })
        }
      }
    })

    return { success: true, data: { id: input.rackId } }
  } catch (error) {
    console.error('updateRackService error:', error)
    return { success: false, error: '렉사 수정 실패' }
  }
}

// ============ 렉사 삭제 ============

export async function deleteRackService(
  input: DeleteRackInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const rack = await prisma.rack.findFirst({
      where: { id: input.rackId },
      include: {
        zone: true,
        cells: { where: { animalId: { not: null } }, select: { id: true } },
      },
    })
    if (!rack || rack.zone.tenantId !== tenantId) {
      return { success: false, error: '렉사를 찾을 수 없습니다' }
    }
    if (rack.cells.length > 0) {
      return { success: false, error: '개체가 배정된 렉사는 삭제할 수 없습니다' }
    }

    // 셀 먼저 삭제 → 렉사 삭제
    await prisma.$transaction([
      prisma.rackCell.deleteMany({ where: { rackId: input.rackId } }),
      prisma.rack.delete({ where: { id: input.rackId } }),
    ])

    return { success: true, data: { id: input.rackId } }
  } catch (error) {
    console.error('deleteRackService error:', error)
    return { success: false, error: '렉사 삭제 실패' }
  }
}

// ============ 페어링 생성 ============

export async function createPairingService(
  input: CreatePairingInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const pairing = await prisma.pairing.create({
      data: {
        tenantId,
        femaleId: input.femaleId,
        maleId: input.maleId,
        date: new Date(input.date),
        status: 'MATING', // 생성 즉시 산란 중으로 시작 (WAITING 스킵)
        memo: input.memo,
      },
    })

    return { success: true, data: { id: pairing.id } }
  } catch (error) {
    console.error('createPairingService error:', error)
    return { success: false, error: '페어링 생성 실패' }
  }
}

// ============ 페어링 상태 변경 ============

export async function updatePairingStatusService(
  input: UpdatePairingStatusInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    // 소유권 확인
    const pairing = await prisma.pairing.findFirst({
      where: { id: input.pairingId, tenantId },
    })
    if (!pairing) return { success: false, error: '페어링을 찾을 수 없습니다' }

    const updateData: Prisma.PairingUpdateInput = { status: input.status }
    if (input.status === 'DONE') {
      updateData.doneAt = new Date()
    }

    await prisma.pairing.update({
      where: { id: input.pairingId },
      data: updateData,
    })

    return { success: true, data: { id: input.pairingId } }
  } catch (error) {
    console.error('updatePairingStatusService error:', error)
    return { success: false, error: '페어링 상태 변경 실패' }
  }
}

// ============ 페어링 정보 수정 (시작일/메모) ============

export async function updatePairingService(
  input: UpdatePairingInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const pairing = await prisma.pairing.findFirst({
      where: { id: input.pairingId, tenantId },
      include: { eggs: { orderBy: { layDate: 'asc' }, take: 1, select: { layDate: true } } },
    })
    if (!pairing) return { success: false, error: '페어링을 찾을 수 없습니다' }

    const newDate = new Date(input.date)
    // 새 메이팅 날짜가 기존 최초 산란일보다 뒤일 수는 없음 (계보 모순)
    const firstEgg = pairing.eggs[0]
    if (firstEgg && newDate.getTime() > firstEgg.layDate.getTime()) {
      return { success: false, error: '메이팅 날짜는 최초 산란일보다 이전이어야 합니다' }
    }

    await prisma.pairing.update({
      where: { id: input.pairingId },
      data: {
        date: newDate,
        memo: input.memo ?? null,
      },
    })

    return { success: true, data: { id: input.pairingId } }
  } catch (error) {
    console.error('updatePairingService error:', error)
    return { success: false, error: '페어링 수정 실패' }
  }
}

// ============ 페어링 삭제 ============
// Pairing → Egg 가 onDelete: Cascade 이므로 알/온도로그가 함께 삭제된다.
// 부화 개체가 연결된 알이 하나라도 있으면 차단한다 (데이터 고아 방지).
export async function deletePairingService(
  input: DeletePairingInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const pairing = await prisma.pairing.findFirst({
      where: { id: input.pairingId, tenantId },
      include: {
        eggs: { select: { id: true, hatchedAnimalId: true } },
      },
    })
    if (!pairing) return { success: false, error: '페어링을 찾을 수 없습니다' }

    const hasHatched = pairing.eggs.some(e => e.hatchedAnimalId)
    if (hasHatched) {
      return { success: false, error: '부화 개체가 연결된 알이 있어 삭제할 수 없습니다' }
    }

    await prisma.pairing.delete({ where: { id: input.pairingId } })

    return { success: true, data: { id: input.pairingId } }
  } catch (error) {
    console.error('deletePairingService error:', error)
    return { success: false, error: '페어링 삭제 실패' }
  }
}

// ============ 산란(클러치) 삭제 ============
// 같은 페어링 × 산란일의 알 전체 삭제. 부화 개체 연결 시 차단.
export async function deleteClutchService(
  input: DeleteClutchInput,
  tenantId: string,
): Promise<ServiceResponse<{ count: number }>> {
  try {
    const layDate = new Date(input.layDate)

    // 페어 있는 클러치 vs 페어 없는(orphan) 클러치 분기
    const where: Prisma.EggWhereInput = { layDate }
    let pairingForRecovery: { id: string; status: string; endScheduledAt: Date | null } | null = null

    if (input.pairingId) {
      const pairing = await prisma.pairing.findFirst({
        where: { id: input.pairingId, tenantId },
        select: { id: true, status: true, endScheduledAt: true },
      })
      if (!pairing) return { success: false, error: '페어링을 찾을 수 없습니다' }
      where.pairingId = input.pairingId
      pairingForRecovery = pairing
    } else if (input.femaleId) {
      // orphan: 페어 없이 등록된 단독 산란 — 암컷 소유권 확인
      const female = await prisma.animal.findFirst({
        where: { id: input.femaleId, tenantId, isDel: false },
        select: { id: true },
      })
      if (!female) return { success: false, error: '암컷을 찾을 수 없습니다' }
      where.pairingId = null
      where.femaleId = input.femaleId
    } else {
      return { success: false, error: 'pairingId 또는 femaleId가 필요합니다' }
    }

    const eggs = await prisma.egg.findMany({
      where,
      select: { id: true, hatchedAnimalId: true },
    })
    if (eggs.length === 0) return { success: false, error: '삭제할 산란 기록이 없습니다' }

    const hasHatched = eggs.some(e => e.hatchedAnimalId)
    if (hasHatched) {
      return { success: false, error: '부화 개체가 연결된 알이 있어 삭제할 수 없습니다' }
    }

    const result = await prisma.egg.deleteMany({ where })

    // 상태 복구: 삭제된 클러치가 쿨링+무정란으로 종료 예약을 걸어둔 것이었을 수 있으므로
    // endScheduledAt을 해제해 "유령 WAITING" 상태를 방지한다.
    if (pairingForRecovery) {
      const patch = resolvePairingAfterClutchDelete({
        currentStatus: pairingForRecovery.status,
        endScheduledAt: pairingForRecovery.endScheduledAt,
      })
      if (Object.keys(patch).length > 0) {
        await prisma.pairing.update({ where: { id: pairingForRecovery.id }, data: patch })
      }
    }

    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error('deleteClutchService error:', error)
    return { success: false, error: '산란 삭제 실패' }
  }
}

// ============ 셀 배정 ============

export async function assignCellService(
  input: AssignCellInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    // 셀 소유권 확인 (zone → tenant)
    const cell = await prisma.rackCell.findFirst({
      where: { id: input.cellId },
      include: { rack: { include: { zone: true } } },
    })
    if (!cell || cell.rack.zone.tenantId !== tenantId) {
      return { success: false, error: '셀을 찾을 수 없습니다' }
    }

    await prisma.rackCell.update({
      where: { id: input.cellId },
      data: { animalId: input.animalId },
    })

    return { success: true, data: { id: input.cellId } }
  } catch (error) {
    console.error('assignCellService error:', error)
    return { success: false, error: '개체 배정 실패' }
  }
}

// ============ 셀 배정 해제 ============

export async function unassignCellService(
  input: UnassignCellInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const cell = await prisma.rackCell.findFirst({
      where: { id: input.cellId },
      include: { rack: { include: { zone: true } } },
    })
    if (!cell || cell.rack.zone.tenantId !== tenantId) {
      return { success: false, error: '셀을 찾을 수 없습니다' }
    }

    await prisma.rackCell.update({
      where: { id: input.cellId },
      data: { animalId: null },
    })

    return { success: true, data: { id: input.cellId } }
  } catch (error) {
    console.error('unassignCellService error:', error)
    return { success: false, error: '배정 해제 실패' }
  }
}

// ============ 산란 등록 ============

export async function createEggsService(
  input: CreateEggsInput,
  tenantId: string,
): Promise<ServiceResponse<{ count: number }>> {
  try {
    const pairingIds = input.pairingIds ?? []
    const uniquePairingIds = Array.from(new Set(pairingIds))
    if (uniquePairingIds.length !== pairingIds.length) {
      return { success: false, error: '같은 페어링을 중복 선택할 수 없습니다' }
    }

    // 암컷 소유권 확인 (페어 없는 산란에서도 필요)
    const female = await prisma.animal.findFirst({
      where: { id: input.femaleId, tenantId, isDel: false },
      select: { id: true, gender: true },
    })
    if (!female) return { success: false, error: '암컷을 찾을 수 없습니다' }
    if (female.gender !== 'FEMALE') {
      return { success: false, error: '암컷 개체가 아닙니다' }
    }

    // 페어링 조회 (있을 때만)
    const pairings = uniquePairingIds.length > 0
      ? await prisma.pairing.findMany({
          where: { id: { in: uniquePairingIds }, tenantId },
          include: {
            eggs: { orderBy: { layDate: 'desc' }, take: 1, select: { layDate: true } },
          },
        })
      : []
    if (pairings.length !== uniquePairingIds.length) {
      return { success: false, error: '페어링을 찾을 수 없습니다' }
    }
    for (const p of pairings) {
      if (p.femaleId !== input.femaleId) {
        return { success: false, error: '해당 암컷의 페어링이 아닙니다' }
      }
    }

    const pairingMap = new Map(pairings.map(p => [p.id, p]))
    const primary = pairingIds[0] ? pairingMap.get(pairingIds[0]) ?? null : null
    const secondary = pairingIds[1] ? pairingMap.get(pairingIds[1]) ?? null : null

    const fertileCount = input.fertileCount ?? 0
    const infertileCount = input.infertileCount ?? 0
    const totalCount = fertileCount + infertileCount
    const hasInfertile = infertileCount > 0

    await prisma.$transaction(async (tx) => {
      const baseData = {
        pairingId: primary?.id ?? null,
        femaleId: input.femaleId,
        maleId: primary?.maleId ?? null,
        pairingId2: secondary?.id ?? null,
        maleId2: secondary?.maleId ?? null,
        layDate: new Date(input.layDate),
        humidity: input.humidity,
        substrate: input.substrate,
        memo: input.memo,
        checked: true,
      }

      // 유정란 → INCUBATING + 온도 로그
      for (let i = 0; i < fertileCount; i++) {
        await tx.egg.create({
          data: {
            ...baseData,
            fertileStatus: 'FERTILE',
            status: 'INCUBATING',
            ...(input.temperature === undefined
              ? {}
              : {
                  temperatureLogs: {
                    create: {
                      temp: input.temperature,
                      startDate: new Date(input.layDate),
                    },
                  },
                }),
          },
        })
      }

      // 무정란 → FAILED (인큐 진입 안 함)
      for (let i = 0; i < infertileCount; i++) {
        await tx.egg.create({
          data: {
            ...baseData,
            fertileStatus: 'INFERTILE',
            status: 'FAILED',
          },
        })
      }

      // 각 페어링 상태 전이 — 규칙은 src/lib/pairing-state.ts의 resolvePairingAfterEggLay에 통합.
      // DONE 페어는 산란 기록은 허용(과거 백필 용도)하지만 상태는 되살리지 않는다.
      const now = new Date()
      for (const pairing of pairings) {
        const patch = resolvePairingAfterEggLay({
          currentStatus: pairing.status,
          manuallyCoolingAt: pairing.manuallyCoolingAt,
          lastEggDateBeforeThisLay: pairing.eggs[0]?.layDate ?? null,
          layDate: new Date(input.layDate),
          hasFertile: fertileCount > 0,
          hasInfertile,
          now,
        })
        if (Object.keys(patch).length > 0) {
          await tx.pairing.update({ where: { id: pairing.id }, data: patch })
        }
      }

      // 페어 없이 산란한 경우: 활성 페어에 mutation을 가하지 않는다.
      // "페어 없는 암컷의 산란 후 5일 배란기" 표시는 클라이언트가
      // latestEggLayDateByFemaleId를 기반으로 렌더링 시점에 계산한다.
    })

    return { success: true, data: { count: totalCount } }
  } catch (error) {
    console.error('createEggsService error:', error)
    return { success: false, error: '산란 등록 실패' }
  }
}

// ============ 시즌 종료 (수동 쿨링 진입) ============

export async function enterManualCoolingService(
  input: { pairingId: string },
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const pairing = await prisma.pairing.findFirst({
      where: { id: input.pairingId, tenantId },
      select: { id: true },
    })
    if (!pairing) return { success: false, error: '페어링을 찾을 수 없습니다' }

    await prisma.pairing.update({
      where: { id: input.pairingId },
      data: resolvePairingEnterManualCooling(new Date()),
    })

    return { success: true, data: { id: input.pairingId } }
  } catch (error) {
    console.error('enterManualCoolingService error:', error)
    return { success: false, error: '쿨링 전환 실패' }
  }
}

// ============ 개별 알의 아비 변경 ============

export async function updateEggSireService(
  input: { eggId: string; maleId: string },
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    // 소유권 확인
    const egg = await prisma.egg.findFirst({
      where: { id: input.eggId, female: { tenantId } },
      select: { id: true, femaleId: true },
    })
    if (!egg) return { success: false, error: '알을 찾을 수 없습니다' }

    // 지정 수컷이 해당 암컷의 페어링 이력에 존재하는지 확인 (씨바꿈 후보 제한)
    const historical = await prisma.pairing.findFirst({
      where: { tenantId, femaleId: egg.femaleId, maleId: input.maleId },
      select: { id: true },
    })
    if (!historical) {
      return { success: false, error: '해당 암컷과 페어링 이력이 없는 수컷입니다' }
    }

    await prisma.egg.update({
      where: { id: input.eggId },
      data: { maleId: input.maleId },
    })

    return { success: true, data: { id: input.eggId } }
  } catch (error) {
    console.error('updateEggSireService error:', error)
    return { success: false, error: '알 아비 변경 실패' }
  }
}

// ============ 알 상태 변경 ============

export async function updateEggStatusService(
  input: UpdateEggStatusInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const egg = await prisma.egg.findFirst({
      where: { id: input.eggId, female: { tenantId } },
    })
    if (!egg) return { success: false, error: '알을 찾을 수 없습니다' }

    // INCUBATING → HATCHED/FAILED, HATCHED/FAILED → INCUBATING (되돌리기)
    if (input.status === 'INCUBATING') {
      if (egg.status === 'INCUBATING') return { success: false, error: '이미 인큐중입니다' }
      if (egg.hatchedAnimalId) return { success: false, error: '이미 개체 등록된 알은 되돌릴 수 없습니다' }
    } else {
      if (egg.status !== 'INCUBATING') return { success: false, error: '인큐중인 알만 상태를 변경할 수 있습니다' }
    }

    await prisma.egg.update({
      where: { id: input.eggId },
      data: {
        status: input.status,
        hatchDate: input.status === 'HATCHED'
          ? (input.date ? new Date(input.date) : new Date())
          : input.status === 'INCUBATING' ? null : undefined,
      },
    })

    return { success: true, data: { id: input.eggId } }
  } catch (error) {
    console.error('updateEggStatusService error:', error)
    return { success: false, error: '알 상태 변경 실패' }
  }
}

// ============ 온도 변경 ============

export async function changeEggTempService(
  input: ChangeEggTempInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const egg = await prisma.egg.findFirst({
      where: { id: input.eggId, female: { tenantId }, status: 'INCUBATING' },
      include: { temperatureLogs: { orderBy: { startDate: 'asc' } } },
    })
    if (!egg) return { success: false, error: '인큐중인 알을 찾을 수 없습니다' }

    const startDate = new Date(input.startDate)
    const firstLogDate = egg.temperatureLogs[0]?.startDate
    // 변경 시점은 산란일/최초 로그 이후, 미래 X
    if (firstLogDate && startDate < firstLogDate) {
      return { success: false, error: '산란일 이전 날짜로는 설정할 수 없습니다' }
    }
    if (startDate > new Date()) {
      return { success: false, error: '미래 날짜로는 설정할 수 없습니다' }
    }

    await prisma.temperatureLog.create({
      data: {
        eggId: input.eggId,
        temp: input.temperature,
        startDate,
      },
    })

    return { success: true, data: { id: input.eggId } }
  } catch (error) {
    console.error('changeEggTempService error:', error)
    return { success: false, error: '온도 변경 실패' }
  }
}

// ============ 페어링(수컷) 전체 교체 — 1~2개 ============

export async function updateEggSiresService(
  input: UpdateEggSiresInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const uniq = Array.from(new Set(input.maleIds))
    if (uniq.length !== input.maleIds.length) {
      return { success: false, error: '같은 수컷을 중복 선택할 수 없습니다' }
    }

    const egg = await prisma.egg.findFirst({
      where: { id: input.eggId, female: { tenantId } },
      select: { id: true, femaleId: true },
    })
    if (!egg) return { success: false, error: '알을 찾을 수 없습니다' }

    // 각 maleId별 페어링 조회 (해당 암컷과의 이력)
    const pairings = await prisma.pairing.findMany({
      where: { tenantId, femaleId: egg.femaleId, maleId: { in: uniq } },
      select: { id: true, maleId: true },
    })
    // maleId → pairingId 매핑 (같은 암/수 페어링이 여러 개면 첫 번째 사용)
    const pairingByMale = new Map<string, string>()
    for (const p of pairings) {
      if (!pairingByMale.has(p.maleId)) pairingByMale.set(p.maleId, p.id)
    }
    for (const mid of uniq) {
      if (!pairingByMale.has(mid)) {
        return { success: false, error: '해당 암컷과 페어링 이력이 없는 수컷입니다' }
      }
    }

    const primaryMaleId = input.maleIds[0]
    const secondaryMaleId = input.maleIds[1] ?? null

    await prisma.egg.update({
      where: { id: input.eggId },
      data: {
        pairingId: pairingByMale.get(primaryMaleId)!,
        maleId: primaryMaleId,
        pairingId2: secondaryMaleId ? pairingByMale.get(secondaryMaleId)! : null,
        maleId2: secondaryMaleId,
      },
    })

    return { success: true, data: { id: input.eggId } }
  } catch (error) {
    console.error('updateEggSiresService error:', error)
    return { success: false, error: '페어링 수정 실패' }
  }
}

// ============ 인큐 환경 수정 (습도·바닥재·산란일) ============

export async function updateEggEnvironmentService(
  input: UpdateEggEnvironmentInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const egg = await prisma.egg.findFirst({
      where: { id: input.eggId, female: { tenantId } },
      select: { id: true },
    })
    if (!egg) return { success: false, error: '알을 찾을 수 없습니다' }

    await prisma.egg.update({
      where: { id: input.eggId },
      data: {
        ...(input.humidity !== undefined && { humidity: input.humidity }),
        ...(input.substrate !== undefined && {
          substrate: input.substrate && input.substrate.trim() ? input.substrate.trim() : null,
        }),
      },
    })

    return { success: true, data: { id: input.eggId } }
  } catch (error) {
    console.error('updateEggEnvironmentService error:', error)
    return { success: false, error: '환경 수정 실패' }
  }
}

// ============ 알 캔들링 업데이트 ============

export async function updateEggFertilityService(
  input: UpdateEggFertilityInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const egg = await prisma.egg.findFirst({
      where: { id: input.eggId, female: { tenantId } },
    })
    if (!egg) return { success: false, error: '알을 찾을 수 없습니다' }

    await prisma.egg.update({
      where: { id: input.eggId },
      data: {
        ...(input.checked !== undefined && { checked: input.checked }),
        ...(input.fertileStatus !== undefined && { fertileStatus: input.fertileStatus }),
      },
    })

    return { success: true, data: { id: input.eggId } }
  } catch (error) {
    console.error('updateEggFertilityService error:', error)
    return { success: false, error: '캔들링 업데이트 실패' }
  }
}

// ============ 메모 수정 ============

export async function updateEggMemoService(
  input: UpdateEggMemoInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const egg = await prisma.egg.findFirst({
      where: { id: input.eggId, female: { tenantId } },
    })
    if (!egg) return { success: false, error: '알을 찾을 수 없습니다' }

    await prisma.egg.update({
      where: { id: input.eggId },
      data: { memo: input.memo || null },
    })

    return { success: true, data: { id: input.eggId } }
  } catch (error) {
    console.error('updateEggMemoService error:', error)
    return { success: false, error: '메모 수정 실패' }
  }
}

// ============ 온도 로그 삭제 ============

export async function deleteTemperatureLogService(
  input: DeleteTemperatureLogInput,
  tenantId: string,
): Promise<ServiceResponse<{ id: string }>> {
  try {
    const egg = await prisma.egg.findFirst({
      where: { id: input.eggId, female: { tenantId } },
      include: { temperatureLogs: { orderBy: { startDate: 'asc' } } },
    })
    if (!egg) return { success: false, error: '알을 찾을 수 없습니다' }

    // 첫 번째 온도 로그는 삭제 불가
    if (egg.temperatureLogs.length <= 1) {
      return { success: false, error: '최소 1개의 온도 기록은 유지해야 합니다' }
    }
    if (egg.temperatureLogs[0].id === input.logId) {
      return { success: false, error: '초기 온도 기록은 삭제할 수 없습니다' }
    }

    const log = egg.temperatureLogs.find(l => l.id === input.logId)
    if (!log) return { success: false, error: '온도 기록을 찾을 수 없습니다' }

    await prisma.temperatureLog.delete({ where: { id: input.logId } })

    return { success: true, data: { id: input.eggId } }
  } catch (error) {
    console.error('deleteTemperatureLogService error:', error)
    return { success: false, error: '온도 기록 삭제 실패' }
  }
}

// ============ 부화 알 → 개체등록용 데이터 조회 ============

export type EggRegisterData = {
  eggId: string
  hatchDate: string | null
  femaleId: string
  // 페어 없이 등록된 유정란은 아비 정보가 없음
  maleId: string | null
  maleId2: string | null
  speciesId: string | null
  primaryMorphId: string | null
  female: EggParentInfo
  male: EggParentInfo | null
  male2: EggParentInfo | null
}

export async function getEggRegisterDataService(
  input: GetEggRegisterDataInput,
  tenantId: string,
): Promise<ServiceResponse<EggRegisterData>> {
  try {
    const animalSelect = {
      id: true,
      name: true,
      uniqueId: true,
      gender: true,
      images: { take: 1, orderBy: { createdAt: 'desc' as const }, select: { imageUrl: true } },
      codes: {
        where: {
          OR: [
            { isPrimary: true, code: { category: 'MORPH' as const } },
            { code: { category: 'SPECIES' as const } },
          ],
        },
        include: { code: { select: { id: true, name: true, category: true } } },
      },
    }

    const egg = await prisma.egg.findFirst({
      where: { id: input.eggId, female: { tenantId } },
      include: {
        female: { select: animalSelect },
        male: { select: animalSelect },
        male2: { select: animalSelect },
      },
    })
    if (!egg) return { success: false, error: '알을 찾을 수 없습니다' }
    if (egg.status !== 'HATCHED') return { success: false, error: '부화 완료된 알만 개체 등록할 수 있습니다' }
    if (egg.hatchedAnimalId) return { success: false, error: '이미 개체 등록된 알입니다' }

    const toParentInfo = (a: NonNullable<typeof egg.female>): EggParentInfo => ({
      id: a.id,
      name: a.name,
      uniqueId: a.uniqueId,
      gender: a.gender,
      species: a.codes.find(ac => ac.code.category === 'SPECIES')?.code.name ?? null,
      morph: a.codes.find(ac => ac.code.category === 'MORPH')?.code.name ?? null,
      imageUrl: a.images[0]?.imageUrl ?? null,
    })

    const speciesCode = egg.female.codes.find(ac => ac.code.category === 'SPECIES')
    const morphCode = egg.female.codes.find(ac => ac.code.category === 'MORPH')

    return {
      success: true,
      data: {
        eggId: egg.id,
        hatchDate: egg.hatchDate?.toISOString().slice(0, 10) ?? null,
        femaleId: egg.femaleId,
        maleId: egg.maleId,
        maleId2: egg.maleId2,
        speciesId: speciesCode?.codeId ?? null,
        primaryMorphId: morphCode?.codeId ?? null,
        female: toParentInfo(egg.female),
        male: egg.male ? toParentInfo(egg.male) : null,
        male2: egg.male2 ? toParentInfo(egg.male2) : null,
      },
    }
  } catch (error) {
    console.error('getEggRegisterDataService error:', error)
    return { success: false, error: '알 데이터 조회 실패' }
  }
}

// ============ 알-개체 연결 ============

export async function linkEggAnimalService(
  input: LinkEggAnimalInput,
  tenantId: string,
): Promise<ServiceResponse<{ eggId: string }>> {
  try {
    const egg = await prisma.egg.findFirst({
      where: { id: input.eggId, female: { tenantId } },
    })
    if (!egg) return { success: false, error: '알을 찾을 수 없습니다' }
    if (egg.hatchedAnimalId) return { success: false, error: '이미 개체 등록된 알입니다' }

    await prisma.egg.update({
      where: { id: input.eggId },
      data: { hatchedAnimalId: input.animalId },
    })

    return { success: true, data: { eggId: input.eggId } }
  } catch (error) {
    console.error('linkEggAnimalService error:', error)
    return { success: false, error: '알-개체 연결 실패' }
  }
}
