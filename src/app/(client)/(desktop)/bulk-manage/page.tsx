import { getCurrentUser } from '@/actions/auth/get-current-user'
import { hasBulkFeature } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { BulkManageClient } from './_components/bulk-manage-client'

export default async function BulkManagePage() {
  const currentUser = await getCurrentUser()

  if (!currentUser.success || !currentUser.data) {
    redirect('/login')
  }

  if (!hasBulkFeature(currentUser.data)) {
    redirect('/animals')
  }

  return <BulkManageClient />
}
