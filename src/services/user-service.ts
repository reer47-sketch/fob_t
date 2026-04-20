import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { generateNextShopCode } from '@/lib/utils'

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * 새로운 shopCode 생성
 * DB에서 가장 큰 shopCode를 조회하여 다음 코드를 생성
 */
export async function createNewShopCode(): Promise<string> {
  const lastTenant = await prisma.tenant.findFirst({
    where: { shopCode: { not: null } },
    orderBy: { shopCode: 'desc' },
    select: { shopCode: true },
  })
  return generateNextShopCode(lastTenant?.shopCode ?? null)
}

/**
 * 승인 대기 중인 사용자 목록 조회 (관리자용)
 */
export async function getPendingUsersService() {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'PENDING' },
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: users }
  } catch (error) {
    console.error('getPendingUsersService error:', error)
    return { success: false, error: 'Failed to fetch pending users' }
  }
}

/**
 * 사용자 승인 (관리자용)
 */
export async function approveUserService(data: {
  userId: string
  adminId: string
}): Promise<ServiceResponse<any>> {
  try {
    const user = await prisma.user.update({
      where: { id: data.userId },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        approvedById: data.adminId,
      },
      include: { tenant: true },
    })

    // TODO: 승인 완료 이메일 발송

    return { success: true, data: user }
  } catch (error) {
    console.error('approveUserService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'User not found' }
      }
    }

    return { success: false, error: 'Failed to approve user' }
  }
}

/**
 * 사용자 거부 (관리자용)
 */
export async function rejectUserService(data: {
  userId: string
  reason?: string
}): Promise<ServiceResponse<any>> {
  try {
    const user = await prisma.user.update({
      where: { id: data.userId },
      data: {
        status: 'REJECTED',
        rejectionReason: data.reason,
      },
      include: { tenant: true },
    })

    // TODO: 거부 이메일 발송 (사유 포함)

    return { success: true, data: user }
  } catch (error) {
    console.error('rejectUserService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'User not found' }
      }
    }

    return { success: false, error: 'Failed to reject user' }
  }
}

/**
 * 전체 사용자 목록 조회 (관리자용)
 */
export async function getAllUsersService(filters?: {
  status?: string
  role?: string
  search?: string
}) {
  try {
    const where: Prisma.UserWhereInput = {}

    if (filters?.status) {
      where.status = filters.status as any
    }

    if (filters?.role) {
      where.role = filters.role as any
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: users }
  } catch (error) {
    console.error('getAllUsersService error:', error)
    return { success: false, error: 'Failed to fetch users' }
  }
}

/**
 * 사용자 정지 (관리자용)
 */
export async function suspendUserService(
  userId: string
): Promise<ServiceResponse<any>> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
      include: { tenant: true },
    })

    return { success: true, data: user }
  } catch (error) {
    console.error('suspendUserService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'User not found' }
      }
    }

    return { success: false, error: 'Failed to suspend user' }
  }
}

/**
 * 사용자 활성화 (관리자용)
 */
export async function activateUserService(
  userId: string
): Promise<ServiceResponse<any>> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
      include: { tenant: true },
    })

    return { success: true, data: user }
  } catch (error) {
    console.error('activateUserService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'User not found' }
      }
    }

    return { success: false, error: 'Failed to activate user' }
  }
}

/**
 * 사용자 삭제 (Soft delete)
 */
export async function deleteUserService(
  userId: string
): Promise<ServiceResponse<null>> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'DELETED' },
    })

    return { success: true, data: null }
  } catch (error) {
    console.error('deleteUserService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'User not found' }
      }
    }

    return { success: false, error: 'Failed to delete user' }
  }
}

/**
 * 사용자 ID로 조회
 */
export async function getUserByIdService(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, data: user }
  } catch (error) {
    console.error('getUserByIdService error:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

export interface UserListItem {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  plan: string
  phone: string | null
  shopCode: string | null
  createdAt: Date
}

export interface GetUsersParams {
  email?: string
  name?: string
  role?: 'ADMIN' | 'BREEDER'
  status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'DELETED'
  page?: number
  pageSize?: number
}

/**
 * 사용자 목록 조회 (페이지네이션 지원)
 */
export async function getUsersListService(params: GetUsersParams) {
  try {
    const {
      email,
      name,
      role,
      status,
      page = 1,
      pageSize = 20,
    } = params

    const where: Prisma.UserWhereInput = {}

    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive',
      }
    }

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      }
    }

    if (role) {
      where.role = role
    }

    if (status) {
      where.status = status
    } else {
      // 기본적으로 DELETED 상태 제외
      where.status = {
        not: 'DELETED'
      }
    }

    const skip = (page - 1) * pageSize

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          plan: true,
          phone: true,
          tenant: {
            select: {
              shopCode: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    const formattedUsers = users.map(user => ({
      ...user,
      shopCode: user.tenant?.shopCode ?? null,
      tenant: undefined,
    }))

    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        users: formattedUsers,
        total,
        totalPages,
      },
    }
  } catch (error) {
    console.error('getUsersListService error:', error)
    return { success: false, error: 'Failed to fetch users' }
  }
}

/**
 * 사용자 상태 변경 (관리자용)
 */
export async function updateUserStatusService(
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'DELETED',
  adminId?: string
): Promise<ServiceResponse<any>> {
  try {
    const updateData: any = {
      status,
    }

    if (status === 'ACTIVE') {
      updateData.approvedAt = new Date()
      if (adminId) {
        updateData.approvedById = adminId
      }
    }

    // ACTIVE로 변경하는 경우, 샵코드가 없으면 자동 생성
    let tenantUpdate = undefined
    if (status === 'ACTIVE') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { tenant: true },
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // tenant가 있고 shopCode가 없는 경우에만 생성
      if (user.tenant && !user.tenant.shopCode) {
        const newShopCode = await createNewShopCode()

        tenantUpdate = {
          update: {
            shopCode: newShopCode,
            slug: newShopCode
          },
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        ...(tenantUpdate && { tenant: tenantUpdate }),
      },
      include: { tenant: true },
    })

    return { success: true, data: user }
  } catch (error) {
    console.error('updateUserStatusService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'User not found' }
      }
    }

    return { success: false, error: 'Failed to update user status' }
  }
}
