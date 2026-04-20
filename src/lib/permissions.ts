import { UserPlan } from '@prisma/client'

/**
 * 일괄등록/편집 기능 접근 가능 여부
 * FREE가 아니면 사용 가능 (PRO, PREMIUM)
 */
export function hasBulkFeature(user: { plan: UserPlan }): boolean {
  return user.plan !== UserPlan.FREE
}
