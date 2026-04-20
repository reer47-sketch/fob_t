'use server'

import { prisma } from '@/lib/prisma'

export interface CustomerListItem {
  id: string
  name: string
  phone: string
  address: string | null
  privacyConsent: boolean
  adoptionCount: number
}

export interface CustomerListResult {
  customers: CustomerListItem[]
  total: number
  totalPages: number
}

export interface GetCustomersInput {
  name?: string
  page?: number
  pageSize?: number
}

export async function getCustomersService(
  input: GetCustomersInput,
  tenantId: string
): Promise<{ success: true; data: CustomerListResult } | { success: false; error: string }> {
  try {
    const { name, page = 1, pageSize = 20 } = input

    const where = {
      tenantId,
      isDel: false,
      ...(name && {
        name: {
          contains: name,
          mode: 'insensitive' as const,
        },
      }),
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: { adoptions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ])

    const formattedCustomers: CustomerListItem[] = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      privacyConsent: customer.privacyConsent,
      adoptionCount: customer._count.adoptions,
    }))

    return {
      success: true,
      data: {
        customers: formattedCustomers,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error('getCustomersService error:', error)
    return { success: false, error: '고객 목록을 불러오는데 실패했습니다.' }
  }
}

export interface CreateCustomerInput {
  name: string
  phone: string
  address?: string
  privacyConsent: boolean
}

export async function createCustomerService(
  input: CreateCustomerInput,
  tenantId: string
): Promise<{ success: true; data: { id: string } } | { success: false; error: string }> {
  try {
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: input.name,
        phone: input.phone,
        address: input.address || null,
        privacyConsent: input.privacyConsent,
      },
    })

    return { success: true, data: { id: customer.id } }
  } catch (error) {
    console.error('createCustomerService error:', error)
    return { success: false, error: '고객 등록에 실패했습니다.' }
  }
}

export interface UpdateCustomerInput {
  id: string
  name: string
  phone: string
  address?: string
  privacyConsent: boolean
}

export async function updateCustomerService(
  input: UpdateCustomerInput,
  tenantId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: input.id, tenantId },
    })

    if (!customer) {
      return { success: false, error: '고객을 찾을 수 없습니다.' }
    }

    await prisma.customer.update({
      where: { id: input.id },
      data: {
        name: input.name,
        phone: input.phone,
        address: input.address || null,
        privacyConsent: input.privacyConsent,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('updateCustomerService error:', error)
    return { success: false, error: '고객 정보 수정에 실패했습니다.' }
  }
}

export async function deleteCustomerService(
  customerId: string,
  tenantId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId, isDel: false },
      include: {
        _count: {
          select: { adoptions: true },
        },
      },
    })

    if (!customer) {
      return { success: false, error: '고객을 찾을 수 없습니다.' }
    }

    if (customer._count.adoptions > 0) {
      return { success: false, error: '분양 기록이 있는 고객은 삭제할 수 없습니다.' }
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: { isDel: true },
    })

    return { success: true }
  } catch (error) {
    console.error('deleteCustomerService error:', error)
    return { success: false, error: '고객 삭제에 실패했습니다.' }
  }
}
