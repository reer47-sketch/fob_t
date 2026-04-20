import { z } from 'zod'
import { FoodType } from '@prisma/client'

// 피딩 생성 스키마
export const createFeedingSchema = z.object({
  animalIds: z.array(z.string()).min(1, '최소 1개 이상의 개체를 선택해주세요'),
  foodType: z.nativeEnum(FoodType, { message: '먹이 종류를 선택해주세요' }),
  superfood: z.boolean().default(false),
  feedingDate: z.date({ message: '피딩 날짜를 선택해주세요' }),
  quantity: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
})

export type CreateFeedingInput = z.infer<typeof createFeedingSchema>
