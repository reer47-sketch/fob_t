import { getCurrentUser } from '@/actions/auth/get-current-user'
import { redirect } from 'next/navigation'
import { AccountClient } from './_components/account-client'

export default async function AccountPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser.success || !currentUser.data) {
    redirect('/login')
  }

  const { id, email, name, phone, plan } = currentUser.data
  const tenantName = currentUser.data.tenant?.name || null

  return (
    <AccountClient
      user={{ id, email, name, phone, plan, tenantName }}
    />
  )
}
