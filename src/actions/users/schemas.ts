import { z } from 'zod'

/**
 * 사용자 승인 스키마
 */
export const approveUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
})

/**
 * 사용자 거부 스키마
 */
export const rejectUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  reason: z.string().optional(),
})

/**
 * 사용자 목록 조회 필터 스키마
 */
export const getUsersFilterSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'DELETED']).optional(),
  role: z.enum(['ADMIN', 'BREEDER', 'CLIENT']).optional(),
  search: z.string().optional(),
})

export type ApproveUserInput = z.infer<typeof approveUserSchema>
export type RejectUserInput = z.infer<typeof rejectUserSchema>
export type GetUsersFilterInput = z.infer<typeof getUsersFilterSchema>
