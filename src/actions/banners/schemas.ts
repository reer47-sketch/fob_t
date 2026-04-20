import { z } from 'zod'

export const createBannerSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  imageUrl: z.string().min(1, '이미지를 업로드해주세요'),
  linkUrl: z.string().nullable().optional(),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
})

export type CreateBannerInput = z.infer<typeof createBannerSchema>

export const updateBannerSchema = createBannerSchema.extend({
  id: z.string(),
})

export type UpdateBannerInput = z.infer<typeof updateBannerSchema>

export const getBannersSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(10),
  isActive: z.boolean().optional(),
})

export type GetBannersInput = z.infer<typeof getBannersSchema>
