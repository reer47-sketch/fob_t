import { prisma } from "@/lib/prisma";
import { Gender, AcquisitionType, Adoption } from "@prisma/client";

export interface MonthlyAdoptionStats {
  month: string;
  male: number;
  female: number;
  unknown: number;
  total: number;
}

export interface MonthlyHatchingStats {
  month: string;
  count: number;
}

export interface MonthlyDeathStats {
  month: string;
  count: number;
}

export interface HatchingByPairStats {
  month: string;
  fatherId: string;
  fatherName: string;
  fatherDbId: string;
  motherId: string;
  motherName: string;
  motherDbId: string;
  hatchingCount: number;
}

export interface StatsResult {
  adoptionStats: MonthlyAdoptionStats[];
  hatchingStats: MonthlyHatchingStats[];
  deathStats: MonthlyDeathStats[];
}

export async function getAdoptionStats(
  tenantId: string,
  yearFrom: number,
  monthFrom: number,
  yearTo: number,
  monthTo: number
): Promise<MonthlyAdoptionStats[]> {
  // 날짜 범위 생성
  const startDate = new Date(yearFrom, monthFrom - 1, 1);
  const endDate = new Date(yearTo, monthTo, 0, 23, 59, 59, 999); // 해당 월 마지막 날

  // 분양 통계 (성별별)
  const adoptions = await prisma.adoption.findMany({
    where: {
      animal: {
        tenantId,
        isDel: false,
      },
      adoptionDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      animal: {
        select: {
          gender: true,
        },
      },
    },
  });

  // 월별 성별 집계 (년-월 형식)
  const adoptionMap = new Map<string, MonthlyAdoptionStats>();

  // 모든 월 초기화
  for (let year = yearFrom; year <= yearTo; year++) {
    const startMonth = year === yearFrom ? monthFrom : 1;
    const endMonth = year === yearTo ? monthTo : 12;
    for (let m = startMonth; m <= endMonth; m++) {
      const key = `${year}-${m.toString().padStart(2, '0')}`;
      adoptionMap.set(key, { month: `${year}년 ${m}월`, male: 0, female: 0, unknown: 0, total: 0 });
    }
  }

  adoptions.forEach((adoption: Adoption & { animal: { gender: Gender } }) => {
    const year = adoption.adoptionDate.getFullYear();
    const month = adoption.adoptionDate.getMonth() + 1;
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    const stats = adoptionMap.get(key);
    if (stats) {
      if (adoption.animal.gender === Gender.MALE) {
        stats.male++;
      } else if (adoption.animal.gender === Gender.FEMALE) {
        stats.female++;
      } else {
        stats.unknown++;
      }
      stats.total++;
    }
  });

  return Array.from(adoptionMap.values());
}

export async function getHatchingStats(
  tenantId: string,
  yearFrom: number,
  monthFrom: number,
  yearTo: number,
  monthTo: number
): Promise<MonthlyHatchingStats[]> {
  // 날짜 범위 생성
  const startDate = new Date(yearFrom, monthFrom - 1, 1);
  const endDate = new Date(yearTo, monthTo, 0, 23, 59, 59, 999); // 해당 월 마지막 날

  // 해칭 통계
  const hatchings = await prisma.animal.findMany({
    where: {
      tenantId,
      isDel: false,
      acquisitionType: AcquisitionType.HATCHING,
      hatchDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      hatchDate: true,
    },
  });

  const hatchingMap = new Map<string, number>();

  // 모든 월 초기화
  for (let year = yearFrom; year <= yearTo; year++) {
    const startMonth = year === yearFrom ? monthFrom : 1;
    const endMonth = year === yearTo ? monthTo : 12;
    for (let m = startMonth; m <= endMonth; m++) {
      const key = `${year}-${m.toString().padStart(2, '0')}`;
      hatchingMap.set(key, 0);
    }
  }

  hatchings.forEach((hatching: { hatchDate: Date | null }) => {
    if (hatching.hatchDate) {
      const year = hatching.hatchDate.getFullYear();
      const month = hatching.hatchDate.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      const count = hatchingMap.get(key) || 0;
      hatchingMap.set(key, count + 1);
    }
  });

  return Array.from(hatchingMap.entries()).map(([key, count]) => {
    const [year, month] = key.split('-');
    return {
      month: `${year}년 ${parseInt(month)}월`,
      count,
    };
  });
}

export async function getDeathStats(
  tenantId: string,
  yearFrom: number,
  monthFrom: number,
  yearTo: number,
  monthTo: number
): Promise<MonthlyDeathStats[]> {
  // 날짜 범위 생성
  const startDate = new Date(yearFrom, monthFrom - 1, 1);
  const endDate = new Date(yearTo, monthTo, 0, 23, 59, 59, 999); // 해당 월 마지막 날

  // 폐사 통계
  const deaths = await prisma.animal.findMany({
    where: {
      tenantId,
      isDel: false,
      deathDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      deathDate: true,
    },
  });

  const deathMap = new Map<string, number>();

  // 모든 월 초기화
  for (let year = yearFrom; year <= yearTo; year++) {
    const startMonth = year === yearFrom ? monthFrom : 1;
    const endMonth = year === yearTo ? monthTo : 12;
    for (let m = startMonth; m <= endMonth; m++) {
      const key = `${year}-${m.toString().padStart(2, '0')}`;
      deathMap.set(key, 0);
    }
  }

  deaths.forEach((death: { deathDate: Date | null }) => {
    if (death.deathDate) {
      const year = death.deathDate.getFullYear();
      const month = death.deathDate.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      const count = deathMap.get(key) || 0;
      deathMap.set(key, count + 1);
    }
  });

  return Array.from(deathMap.entries()).map(([key, count]) => {
    const [year, month] = key.split('-');
    return {
      month: `${year}년 ${parseInt(month)}월`,
      count,
    };
  });
}

export async function getHatchingByPairStats(
  tenantId: string,
  yearFrom: number,
  monthFrom: number,
  yearTo: number,
  monthTo: number
): Promise<HatchingByPairStats[]> {
  // 날짜 범위 생성
  const startDate = new Date(yearFrom, monthFrom - 1, 1);
  const endDate = new Date(yearTo, monthTo, 0, 23, 59, 59, 999); // 해당 월 마지막 날

  // 해칭된 개체들과 부모 정보 조회
  const hatchings = await prisma.animal.findMany({
    where: {
      tenantId,
      isDel: false,
      acquisitionType: AcquisitionType.HATCHING,
      hatchDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      hatchDate: true,
      parents: {
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              uniqueId: true,
            },
          },
        },
      },
    },
  });

  // 그룹 월, 부모 ID 조합별로 집계
  const pairMap = new Map<string, HatchingByPairStats>();

  hatchings.forEach((hatching) => {
    if (hatching.hatchDate) {
      const year = hatching.hatchDate.getFullYear();
      const month = hatching.hatchDate.getMonth() + 1;
      const monthStr = `${year}년 ${month}월`;

      // 모든 부모 추출
      const fathers = hatching.parents
        .filter(p => p.parentType === 'FATHER')
        .map(p => p.parent);
      const mothers = hatching.parents
        .filter(p => p.parentType === 'MOTHER')
        .map(p => p.parent);

      // 모든 부-모 조합 생성
      fathers.forEach(father => {
        mothers.forEach(mother => {
          if (father && mother) {
            const key = `${year}-${month.toString().padStart(2, '0')}-${father.id}-${mother.id}`;

            const existing = pairMap.get(key);
            if (existing) {
              existing.hatchingCount++;
            } else {
              pairMap.set(key, {
                month: monthStr,
                fatherId: father.uniqueId,
                fatherName: father.name || father.uniqueId,
                fatherDbId: father.id,
                motherId: mother.uniqueId,
                motherName: mother.name || mother.uniqueId,
                motherDbId: mother.id,
                hatchingCount: 1,
              });
            }
          }
        });
      });
    }
  });

  // 월별, 부모 ID별로 정렬
  return Array.from(pairMap.values()).sort((a, b) => {
    // 월 비교
    const monthCompare = a.month.localeCompare(b.month);
    if (monthCompare !== 0) return monthCompare;

    // 부 ID 비교
    const fatherCompare = a.fatherId.localeCompare(b.fatherId);
    if (fatherCompare !== 0) return fatherCompare;

    // 모 ID 비교
    return a.motherId.localeCompare(b.motherId);
  });
}

export async function getStats(
  tenantId: string,
  yearFrom: number,
  monthFrom: number,
  yearTo: number,
  monthTo: number
): Promise<StatsResult> {
  const [adoptionStats, hatchingStats, deathStats] = await Promise.all([
    getAdoptionStats(tenantId, yearFrom, monthFrom, yearTo, monthTo),
    getHatchingStats(tenantId, yearFrom, monthFrom, yearTo, monthTo),
    getDeathStats(tenantId, yearFrom, monthFrom, yearTo, monthTo),
  ]);

  return {
    adoptionStats,
    hatchingStats,
    deathStats,
  };
}
