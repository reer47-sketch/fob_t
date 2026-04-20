"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const requestPasswordResetSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
})

interface RequestPasswordResetInput {
  email: string
}

export async function requestPasswordReset(input: RequestPasswordResetInput) {
  try {
    // 1. Validation
    const validated = requestPasswordResetSchema.parse(input)

    // 2. Supabase 클라이언트 생성
    const supabase = await createClient()

    // 3. 비밀번호 재설정 이메일 발송
    // redirectTo: 이메일의 링크를 클릭했을 때 이동할 URL
    // callback route에서 code를 처리한 후 reset-password로 리다이렉트
    const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
    })

    if (error) {
      console.error("Password reset email error:", error)
      // 보안상 이유로 이메일이 존재하지 않아도 성공 메시지 반환
      // (이메일 존재 여부를 공격자가 알 수 없도록)
    }

    // 항상 성공 메시지 반환 (보안)
    return {
      success: true,
      message: "비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요."
    }
  } catch (error) {
    console.error("Request password reset action error:", error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }

    return { success: false, error: "비밀번호 재설정 요청 중 오류가 발생했습니다" }
  }
}
