import { z } from 'zod'

export const getCustomersSchema = z.object({
  name: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
})

export type GetCustomersInput = z.infer<typeof getCustomersSchema>

export const createCustomerSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.string()
    .min(1, '전화번호를 입력해주세요')
    .regex(/^\d{3}-\d{4}-\d{4}$/, '전화번호 형식이 올바르지 않습니다'),
  address: z.string().optional(),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: '개인정보 수집 및 이용에 동의해주세요',
  }),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>

export const updateCustomerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.string()
    .min(1, '전화번호를 입력해주세요')
    .regex(/^\d{3}-\d{4}-\d{4}$/, '전화번호 형식이 올바르지 않습니다'),
  address: z.string().optional(),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: '개인정보 수집 및 이용에 동의해주세요',
  }),
})

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
