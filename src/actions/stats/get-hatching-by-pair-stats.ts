"use server";

import { getCurrentUserService } from "@/services/auth-service";
import { getHatchingByPairStats } from "@/services/stats-service";
import { getStatsSchema } from "./schemas";
import { z } from "zod";

export async function getHatchingByPairStatsAction(input: { yearFrom: number; monthFrom: number; yearTo: number; monthTo: number }) {
  try {
    // 입력 검증
    const validated = getStatsSchema.parse(input);

    // 유저 인증 및 정보 조회
    const userResult = await getCurrentUserService();

    if (!userResult.success || !userResult.data) {
      return { success: false, error: "인증이 필요합니다." };
    }

    const user = userResult.data;

    if (!user.tenantId) {
      return { success: false, error: "테넌트 정보를 찾을 수 없습니다." };
    }

    // 페어별 해칭 통계 데이터 조회
    const stats = await getHatchingByPairStats(
      user.tenantId,
      validated.yearFrom,
      validated.monthFrom,
      validated.yearTo,
      validated.monthTo
    );

    return { success: true, data: stats };
  } catch (error) {
    console.error("페어별 해칭 통계 조회 에러:", error);

    // Zod 검증 에러인 경우 구체적인 메시지 반환
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }

    return { success: false, error: "페어별 해칭 통계 조회에 실패했습니다." };
  }
}
