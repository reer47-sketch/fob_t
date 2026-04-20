import { BlogForm } from '../../_components/blog-form'
import { getBlogByIdService } from '@/services/blog-service'
import { getCurrentUser } from '@/actions/auth/get-current-user'
import { redirect, notFound } from 'next/navigation'

interface EditBlogPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params
  const session = await getCurrentUser()

  if (!session.success || !session.data) {
    redirect('/login')
  }

  const tenantId = session.data.tenantId
  if (!tenantId) {
    // 테넌트 정보가 없으면 접근 불가
    redirect('/dashboard')
  }

  const result = await getBlogByIdService(id, tenantId)

  if (!result.success || !result.data) {
    notFound()
  }

  return <BlogForm initialData={result.data} />
}
