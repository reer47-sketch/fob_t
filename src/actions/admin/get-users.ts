'use server'

import { getUsersListService, type GetUsersParams } from '@/services/user-service'

export async function getUsers(params: GetUsersParams) {
  return await getUsersListService(params)
}
