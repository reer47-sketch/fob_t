import { z } from 'zod'
import { Gender, AcquisitionType, Quality } from '@prisma/client'

// 개체 목록 조회 필터 스키마
export const getAnimalsSchema = z.object({
  // 검색 필터
  uniqueId: z.string().optional(), // 고유개체ID
  acquisitionDateFrom: z.string().optional(), // 해칭/입양일 시작
  acquisitionDateTo: z.string().optional(), // 해칭/입양일 종료
  hatchingDateFrom: z.string().optional(), // 해칭일 시작
  hatchingDateTo: z.string().optional(), // 해칭일 종료
  speciesId: z.string().optional(), // 종 ID
  morphIds: z.array(z.string()).optional(), // 모프 ID 배열
  traitIds: z.array(z.string()).optional(), // 형질 ID 배열
  colorIds: z.array(z.string()).optional(), // 색감 ID 배열
  gender: z.nativeEnum(Gender).optional(), // 성별
  parentId: z.string().optional(), // 부/모 ID
  acquisitionType: z.nativeEnum(AcquisitionType).optional(), // 입양/해칭
  isBreeding: z.boolean().optional(), // 브리딩 대상
  isAdopted: z.boolean().optional(), // 분양여부
  adoptionDateFrom: z.string().optional(), // 분양일 시작
  adoptionDateTo: z.string().optional(), // 분양일 종료

  // 페이지네이션
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(20),
})

export type GetAnimalsInput = z.infer<typeof getAnimalsSchema>

// 개체 생성 스키마
export const createAnimalSchema = z.object({
  name: z.string().nullable(),
  gender: z.nativeEnum(Gender, { message: '성별을 선택해주세요' }),
  acquisitionType: z.nativeEnum(AcquisitionType, {
    message: '입양/해칭을 선택해주세요',
  }),
  acquisitionDate: z.date({ message: '입양/해칭 일를 선택해주세요' }),
  hatchDate: z.date().nullable().optional(), // 해칭일 (입양인 경우 선택 사항)
  speciesId: z.string().optional(),
  primaryMorphId: z.string().optional(), // 대표 모프 (1개)
  comboMorphIds: z.array(z.string()).optional(), // 콤보 모프 (복수)
  imageFile: z.instanceof(File).optional(),
  metadata: z
    .object({
      capturedAt: z.date().nullable(),
      location: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .nullable(),
    })
    .optional(),
  fathers: z.array(z.string()).optional(), // 부 ID 배열 (최대 2개)
  mothers: z.array(z.string()).optional(), // 모 ID 배열 (최대 2개)
  isBreeding: z.boolean().optional(), // 브리딩 대상 여부
  isPublic: z.boolean().default(true), // 공개 여부 (기본값: true)
  parentPublic: z.boolean().optional(), // 부모 공개 여부
})

export type CreateAnimalInput = z.infer<typeof createAnimalSchema>

// uniqueId 생성 미리보기 스키마
export const generateUniqueIdSchema = z.object({
  morphId: z.string().optional(),
  acquisitionDate: z.date(),
})

export type GenerateUniqueIdInput = z.infer<typeof generateUniqueIdSchema>

// 개체 기본정보 수정 스키마 (개체명, 성별, 공개여부, 브리딩 대상, 부모 공개여부, 해칭일, 폐사일 수정 가능)
export const updateAnimalBasicInfoSchema = z.object({
  id: z.string().min(1, '개체 ID가 필요합니다'),
  name: z.string().nullable(),
  gender: z.nativeEnum(Gender, { message: '성별을 선택해주세요' }),
  isPublic: z.boolean().optional(),
  isBreeding: z.boolean().optional(),
  parentPublic: z.boolean().optional(),
  hatchDate: z.date().nullable().optional(), // 해칭일 (입양인 경우에만 수정 가능)
  deathDate: z.date().nullable().optional(),
})

export type UpdateAnimalBasicInfoInput = z.infer<typeof updateAnimalBasicInfoSchema>

// 개체 외관정보 수정 스키마 (종과 대표 모프는 수정 불가)
export const updateAnimalAppearanceInfoSchema = z.object({
  id: z.string().min(1, '개체 ID가 필요합니다'),
  comboMorphIds: z.array(z.string()).optional(), // 콤보 모프 ID 배열 (복수 선택 가능)
  traitIds: z.array(z.string()).optional(), // 형질 ID 배열 (복수 선택 가능)
  colorIds: z.array(z.string()).optional(), // 색감 ID 배열 (복수 선택 가능)
  currentSize: z.string().optional().nullable(),
  tailStatus: z.string().optional().nullable(),
  patternType: z.string().optional().nullable(),
  distinctiveMarks: z.string().optional().nullable(),
  quality: z.nativeEnum(Quality).optional().nullable(),
  isMating: z.boolean(),
  healthStatus: z.string().optional().nullable(),
  specialNeeds: z.string().optional().nullable(),
})

export type UpdateAnimalAppearanceInfoInput = z.infer<typeof updateAnimalAppearanceInfoSchema>

// 개체 서식지정보 수정 스키마
export const updateAnimalHabitatInfoSchema = z.object({
  id: z.string().min(1, '개체 ID가 필요합니다'),
  cageInfo: z.string().optional().nullable(),
  flooringInfo: z.string().optional().nullable(),
  habitatNotes: z.string().optional().nullable(),
})

export type UpdateAnimalHabitatInfoInput = z.infer<typeof updateAnimalHabitatInfoSchema>
