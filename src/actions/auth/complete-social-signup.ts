'use server'

import { socialSignUpService } from '@/services/auth-service'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const socialSignUpSchema = z.object({
  shopName: z.string().min(2, '샵명은 2자 이상이어야 합니다'),
  address: z.string().optional(),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다'),
  termsAgreed: z.boolean().refine((val) => val === true, '필수 약관에 동의해야 합니다'),
  privacyAgreed: z.boolean().refine((val) => val === true, '필수 약관에 동의해야 합니다'),
  dataCollectionAgreed: z.boolean().refine((val) => val === true, '필수 약관에 동의해야 합니다'),
  marketingAgreed: z.boolean().optional(),
})

export type SocialSignUpInput = z.infer<typeof socialSignUpSchema>

/**
 * 소셜 로그인 추가 정보 입력 Action
 */
export async function completeSocialSignUp(input: SocialSignUpInput) {
  try {
    const validated = socialSignUpSchema.parse(input)
    const supabase = await createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return { success: false, error: '인증 정보가 없습니다. 다시 로그인해주세요.' }
    }

    // Business Logic (Service로 위임)
    const result = await socialSignUpService({
      userId: authUser.id,
      email: authUser.email!,
      shopName: validated.shopName,
      address: validated.address,
      name: validated.name,
      phone: validated.phone,
      termsAgreed: validated.termsAgreed,
      privacyAgreed: validated.privacyAgreed,
      dataCollectionAgreed: validated.dataCollectionAgreed,
      marketingAgreed: validated.marketingAgreed,
      profileImage: authUser.user_metadata.avatar_url || authUser.user_metadata.picture
    })

    return result
  } catch (error) {
    console.error('completeSocialSignUp action error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: '가입 처리에 실패했습니다.' }
  }
}
