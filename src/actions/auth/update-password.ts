"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
  newPassword: z.string().min(8, "새 비밀번호는 최소 8자 이상이어야 합니다"),
  confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
})

interface UpdatePasswordInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export async function updatePassword(input: UpdatePasswordInput) {
  try {
    // 1. Validation
    const validated = updatePasswordSchema.parse(input)

    // 2. Supabase 클라이언트 생성
    const supabase = await createClient()

    // 3. 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: "로그인이 필요합니다" }
    }

    // 4. 현재 비밀번호 확인 (사용자의 이메일로 재로그인 시도)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validated.currentPassword,
    })

    if (signInError) {
      return { success: false, error: "현재 비밀번호가 올바르지 않습니다" }
    }

    // 5. 비밀번호 업데이트 (현재 세션으로 가능)
    const { error: updateError } = await supabase.auth.updateUser({
      password: validated.newPassword,
    })

    if (updateError) {
      return { success: false, error: "비밀번호 변경에 실패했습니다" }
    }

    return { success: true }
  } catch (error) {
    console.error("Update password action error:", error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }

    return { success: false, error: "비밀번호 변경 중 오류가 발생했습니다" }
  }
}
