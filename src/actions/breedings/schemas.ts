import { z } from 'zod'

export const getBreedingsSchema = z.object({
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(15),
})

export type GetBreedingsInput = z.infer<typeof getBreedingsSchema>

export const getParentAnimalsSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE']),
})

export type GetParentAnimalsInput = z.infer<typeof getParentAnimalsSchema>
