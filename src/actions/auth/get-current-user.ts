'use server'

import { getCurrentUserService } from '@/services/auth-service'

/**
 * 현재 로그인한 사용자 정보 조회
 */
export async function getCurrentUser() {
  return await getCurrentUserService()
}
