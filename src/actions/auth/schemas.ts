import { z } from 'zod'

/**
 * 회원가입 스키마
 */
export const signUpSchema = z.object({
  email: z
    .email('올바른 이메일 형식이 아닙니다')
    .min(1, '이메일을 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*[0-9])/,
      '비밀번호는 영문과 숫자를 포함해야 합니다'
    ),
  shopName: z.string().min(2, '샵명은 최소 2자 이상이어야 합니다'),
  address: z.string().optional(),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  phone: z
    .string()
    .min(1, '연락처를 입력해주세요')
    .regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다 (010-0000-0000)'),
  // 약관 동의 - 임시로 필수 검증 제거 (나중에 오픈 예정)
  termsAgreed: z.boolean().optional().default(true),
  privacyAgreed: z.boolean().optional().default(true),
  dataCollectionAgreed: z.boolean().optional().default(true),
  marketingAgreed: z.boolean().optional().default(false),
})

/**
 * 로그인 스키마
 */
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
