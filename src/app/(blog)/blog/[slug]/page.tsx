import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { BlogDetailView } from '@/components/blog/blog-detail-view'
import { getCurrentUser } from '@/actions/auth/get-current-user'

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  const blog = await prisma.blog.findUnique({
    where: { slug: decodedSlug },
    select: {
      title: true,
      slug: true,
      thumbnailUrl: true,
      publishedAt: true,
      targetScope: true,
    },
  })

  if (!blog || blog.targetScope !== 'ALL') {
    return {
      robots: { index: false, follow: false },
    }
  }

  return {
    title: blog.title,
    description: `${blog.title} - 포브 블로그`,
    openGraph: {
      title: blog.title,
      description: `${blog.title} - 포브 블로그`,
      url: `https://www.fobreeders.com/blog/${encodeURIComponent(blog.slug)}`,
      type: 'article',
      publishedTime: blog.publishedAt.toISOString(),
      ...(blog.thumbnailUrl && {
        images: [{ url: blog.thumbnailUrl, alt: blog.title }],
      }),
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://www.fobreeders.com/blog/${encodeURIComponent(blog.slug)}`,
    },
  }
}

async function getBlogPost(slug: string) {
  const blog = await prisma.blog.findUnique({
    where: {
      slug: slug,
    },
    include: {
        tags: {
            select: {
                tag: {
                    select: {
                        name: true
                    }
                }
            }
        },
        attachments: {
            select: {
                id: true,
                fileName: true,
                fileUrl: true,
                fileSize: true
            }
        }
    }
  })

  return blog
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const blog = await getBlogPost(decodedSlug)

  if (!blog) {
    notFound()
  }

  const currentUser = await getCurrentUser()
  const isOwner = currentUser.data?.tenantId === blog.tenantId
  const isMember = !!currentUser.data
  const isPublished = blog.publishedAt <= new Date()

  // 1. Publication Check: Only owner can see non-published posts
  if (!isPublished && !isOwner) {
      notFound()
  }

  // 2. Permission Check: Hide MEMBER_ONLY posts from non-members (unless owner)
  if (blog.targetScope === 'MEMBER_ONLY' && !isMember && !isOwner) {
      notFound() 
  }

  // Pass the data to the presentation component
  return <BlogDetailView blog={blog} />
}

