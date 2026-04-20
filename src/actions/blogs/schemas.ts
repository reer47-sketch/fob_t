import { z } from 'zod'

export const createBlogSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.any(), // JSON content from Tiptap
  htmlContent: z.string().optional(), // HTML content for SEO/preview
  thumbnailUrl: z.string().nullable().optional(),
  tags: z.array(z.string()),
  targetScope: z.enum(['ALL', 'MEMBER_ONLY']).default('ALL'),
  publishedAt: z.date().nullable().optional(),
  expiredAt: z.date().nullable().optional(),
  isNotice: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('DRAFT'),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    fileSize: z.number(),
    mimeType: z.string()
  })).optional(),
})

export type CreateBlogInput = z.infer<typeof createBlogSchema>

export const getBlogsSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(10),
  search: z.string().optional(),
  status: z.enum(['ALL', 'DRAFT', 'PUBLISHED', 'SCHEDULED']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export type GetBlogsInput = z.infer<typeof getBlogsSchema>
