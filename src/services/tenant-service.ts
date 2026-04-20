import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * 전체 테넌트 목록 조회 (관리자용)
 */
export async function getAllTenantsService() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: tenants }
  } catch (error) {
    console.error('getAllTenantsService error:', error)
    return { success: false, error: 'Failed to fetch tenants' }
  }
}

/**
 * 테넌트 ID로 조회
 */
export async function getTenantByIdService(tenantId: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: true,
      },
    })

    if (!tenant) {
      return { success: false, error: 'Tenant not found' }
    }

    return { success: true, data: tenant }
  } catch (error) {
    console.error('getTenantByIdService error:', error)
    return { success: false, error: 'Failed to fetch tenant' }
  }
}

/**
 * 테넌트 정지 (관리자용)
 */
export async function suspendTenantService(
  tenantId: string
): Promise<ServiceResponse<any>> {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'SUSPENDED' },
    })

    return { success: true, data: tenant }
  } catch (error) {
    console.error('suspendTenantService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'Tenant not found' }
      }
    }

    return { success: false, error: 'Failed to suspend tenant' }
  }
}

/**
 * 테넌트 활성화 (관리자용)
 */
export async function activateTenantService(
  tenantId: string
): Promise<ServiceResponse<any>> {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'ACTIVE' },
    })

    return { success: true, data: tenant }
  } catch (error) {
    console.error('activateTenantService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'Tenant not found' }
      }
    }

    return { success: false, error: 'Failed to activate tenant' }
  }
}
