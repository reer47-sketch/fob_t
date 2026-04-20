"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "새 비밀번호는 최소 8자 이상이어야 합니다"),
  confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
})

interface ResetPasswordInput {
  newPassword: string
  confirmPassword: string
}

export async function resetPassword(input: ResetPasswordInput) {
  try {
    // 1. Validation
    const validated = resetPasswordSchema.parse(input)

    // 2. Supabase 클라이언트 생성
    const supabase = await createClient()

    // 4. 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      password: validated.newPassword,
    })

    if (updateError) {
      console.error("Password update error:", updateError)
      return { success: false, error: "비밀번호 변경에 실패했습니다" }
    }

    return {
      success: true,
      message: "비밀번호가 성공적으로 변경되었습니다. 로그인해주세요."
    }
  } catch (error) {
    console.error("Reset password action error:", error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }

    return { success: false, error: "비밀번호 재설정 중 오류가 발생했습니다" }
  }
}
