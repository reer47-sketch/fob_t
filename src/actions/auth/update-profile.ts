"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./get-current-user"
import { updateProfileService } from "@/services/auth-service"
import { z } from "zod"

interface UpdateProfileInput {
  name: string
  phone: string
  shopName: string
  address?: string
  profileImage?: string
  marketingAgreed?: boolean
}

const updateProfileSchema = z.object({
  name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다"),
  phone: z
    .string()
    .min(1, "연락처를 입력해주세요")
    .regex(/^010-\d{4}-\d{4}$/, "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)"),
  shopName: z.string().min(2, "샵이름은 최소 2자 이상이어야 합니다"),
  address: z.string().optional(),
  profileImage: z.string().url().optional(),
  marketingAgreed: z.boolean().optional(),
})

export async function updateProfile(input: UpdateProfileInput) {
  try {
    // 1. Validation (Actions 레이어)
    const validated = updateProfileSchema.parse(input)

    // 2. 현재 사용자 확인
    const userResult = await getCurrentUser()

    if (!userResult.success || !userResult.data) {
      return { success: false, error: "로그인이 필요합니다" }
    }

    // 3. Business Logic (Service로 위임)
    const result = await updateProfileService({
      userId: userResult.data.id,
      name: validated.name,
      phone: validated.phone,
      shopName: validated.shopName,
      address: validated.address,
      profileImage: validated.profileImage,
      marketingAgreed: validated.marketingAgreed,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Update profile action error:", error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }

    return { success: false, error: "정보 변경 중 오류가 발생했습니다" }
  }
}
