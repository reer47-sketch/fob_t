import { z } from 'zod'

// 분양 가능한 개체 조회 스키마
export const getAvailableAnimalsSchema = z.object({
  search: z.string().optional(),
})

export type GetAvailableAnimalsInput = z.infer<typeof getAvailableAnimalsSchema>

// 분양 개체 항목 스키마
export const adoptionItemSchema = z.object({
  animalId: z.string().min(1, '개체를 선택해주세요'),
  price: z.number().min(0, '금액은 0 이상이어야 합니다'),
})

export type AdoptionItem = z.infer<typeof adoptionItemSchema>

// 분양 생성 스키마
export const createAdoptionSchema = z.object({
  customerId: z.string().min(1, '고객을 선택해주세요'),
  adoptionDate: z.date(),
  transferPurpose: z.string().optional(),
  transferReason: z.string().optional(),
  items: z.array(adoptionItemSchema).min(1, '최소 1마리 이상 선택해주세요'),
})

export type CreateAdoptionInput = z.infer<typeof createAdoptionSchema>

// 분양 수정 스키마
export const updateAdoptionSchema = z.object({
  adoptionId: z.string().min(1, '분양 ID가 필요합니다'),
  adoptionDate: z.date(),
  price: z.number().min(0, '금액은 0 이상이어야 합니다'),
  transferPurpose: z.string().optional(),
  transferReason: z.string().optional(),
})

export type UpdateAdoptionInput = z.infer<typeof updateAdoptionSchema>
