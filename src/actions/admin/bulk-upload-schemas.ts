import { z } from 'zod'
import { Gender } from '@prisma/client'

export const bulkAnimalItemSchema = z.object({
  name: z.string().nullable(),
  gender: z.nativeEnum(Gender, { message: '성별을 선택해주세요' }),
  hatchDate: z.date().nullable().optional(),
  speciesId: z.string().min(1, '종을 선택해주세요'),
  primaryMorphId: z.string().min(1, '모프를 선택해주세요'),
})

export type BulkAnimalItem = z.infer<typeof bulkAnimalItemSchema>

export const bulkCreateAnimalsSchema = z.object({
  tenantId: z.string().min(1, '파트너사를 선택해주세요'),
  animals: z.array(bulkAnimalItemSchema).min(1, '등록할 개체가 없습니다'),
})

export type BulkCreateAnimalsInput = z.infer<typeof bulkCreateAnimalsSchema>
