'use server'

import { signOutService } from '@/services/auth-service'
import { redirect } from 'next/navigation'

/**
 * 로그아웃 Action
 */
export async function signOut() {
  try {
    await signOutService()
    redirect('/login')
  } catch (error) {
    console.error('signOut action error:', error)
    return { success: false, error: '로그아웃에 실패했습니다' }
  }
}
