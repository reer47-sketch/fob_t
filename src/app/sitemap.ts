import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.fobreeders.com'

  // 공개 블로그 글 가져오기
  const blogs = await prisma.blog.findMany({
    where: {
      publishedAt: { lte: new Date() },
      targetScope: 'ALL',
    },
    select: {
      slug: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: 'desc' },
  })

  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${baseUrl}/blog/${encodeURIComponent(blog.slug)}`,
    lastModified: blog.publishedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...blogEntries,
  ]
}
