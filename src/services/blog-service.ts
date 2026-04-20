import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CreateBlogInput } from '@/actions/blogs/schemas'
import { deleteMultipleFromR2, getKeyFromUrl, copyFileInR2, deleteFromR2 } from '@/lib/r2'

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type BlogListItem = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  tags: string[]
  publishedAt: Date
  views: number
  status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED'
  targetScope: 'ALL' | 'MEMBER_ONLY'
  attachmentCount: number
}

export type GetBlogsInput = {
  page?: number
  pageSize?: number
  search?: string
  tag?: string
  status?: 'ALL' | 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'
  from?: string
  to?: string
}

export type BlogListResult = {
  blogs: BlogListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 블로그 목록 조회 서비스
 */
export async function getBlogsService(
  input: GetBlogsInput,
  tenantId?: string, // Optional
  isMember: boolean = false
): Promise<ServiceResponse<BlogListResult>> {
  try {
    const { page = 1, pageSize = 12, search, tag } = input
    const skip = (page - 1) * pageSize

    // 기본 조건: 공개된 글만 조회
    const activeWhere: Prisma.BlogWhereInput = {
        publishedAt: {
            lte: new Date(),
        },
        OR: [
            { expiredAt: null },
            { expiredAt: { gte: new Date() } }
        ]
    }

    // 회원이 아니면 전체 공개 글만 조회
    if (!isMember) {
        activeWhere.targetScope = 'ALL';
    }

    // 테넌트 ID가 있으면 필터링, 없으면 전체 조회
    if (tenantId) {
        activeWhere.tenantId = tenantId
    }

    if (search) {
      activeWhere.AND = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          // 내용 검색 등 추가 가능
        ],
      }
    }

    if (tag) {
      activeWhere.tags = { some: { tag: { name: tag } } }
    }

    const [total, blogs] = await prisma.$transaction([
      prisma.blog.count({ where: activeWhere }),
      prisma.blog.findMany({
        where: activeWhere,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          publishedAt: true,
          views: true,
          targetScope: true,
          tags: {
            select: {
              tag: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
    ])

    const formattedBlogs: BlogListItem[] = blogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      thumbnailUrl: blog.thumbnailUrl,
      tags: blog.tags.map((t) => t.tag.name),
      publishedAt: blog.publishedAt,
      views: blog.views,
      status: 'PUBLISHED', 
      targetScope: blog.targetScope as 'ALL' | 'MEMBER_ONLY',
      attachmentCount: 0
    }))

    return {
      success: true,
      data: {
        blogs: formattedBlogs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error('getBlogsService error:', error)
    return { success: false, error: '블로그 목록을 불러오는 중 오류가 발생했습니다.' }
  }
}

/**
 * 관리자용 블로그 목록 조회 서비스 (전체 상태 포함)
 */
export async function getAdminBlogsService(
  input: GetBlogsInput,
  tenantId: string
): Promise<ServiceResponse<BlogListResult>> {
  try {
    const { page = 1, pageSize = 10, search, status, from, to } = input
    const skip = (page - 1) * pageSize

    const where: Prisma.BlogWhereInput = {
      tenantId,
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    if (from || to) {
        where.createdAt = {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined
        }
    }

    // 상태 필터링 로직
    // 스키마에 status 필드가 없으므로 publishedAt으로 판단
    // DRAFT: publishedAt > 9000년? 아니면 별도 플래그?
    // 보통 publishedAt이 null이면 Draft로 취급하거나, 미래면 Scheduled
    // 하지만 현재 스키마 정의상 publishedAt은 DateTime @default(now()) 이므로 항상 값이 있음.
    // 사용자가 "임시저장"을 하면 publishedAt을 먼 미래로 설정하거나, 별도의 status 필드가 필요함.
    // 기존 스키마에는 status 필드가 없음. publishedAt으로 구분하거나, isNotice 등을 활용? 
    // 아니면 publishedAt을 nullable로 변경해야 함. (현재 스키마: publishedAt DateTime @default(now()))
    // CreateBlogSchema에서는 publishedAt이 optional.
    
    // **중요**: 스키마의 publishedAt은 @default(now())지만, 생성 시 null로 넣을 수 있는지 확인 필요.
    // prisma/schema.prisma에 `publishedAt DateTime @default(now())` 로 되어 있으면 null 불가.
    // 이 경우 "임시저장" 상태를 표현하기 어려움.
    // 해결책: publishedAt을 9999-12-31로 설정하여 Draft로 간주하거나, 스키마를 수정해야 함.
    // 여기서는 스키마 수정 없이 로직으로 처리:
    // DRAFT: publishedAt >= 2999-01-01 (임시 기준)
    // SCHEDULED: publishedAt > now() AND publishedAt < 2999-01-01
    // PUBLISHED: publishedAt <= now()
    
    // 하지만 가장 좋은 건 publishedAt을 Nullable로 바꾸는 것.
    // 사용자가 스키마 변경을 허용했으므로, publishedAt을 Nullable로 변경하는 것이 맞음.
    // 그러나 지금은 서비스 코드 작성 단계. 
    // 우선 로직으로 처리. 
    
    // --> 스키마 확인 결과: publishedAt DateTime @default(now()) @map("published_at") @db.Timestamptz
    // Null 불가.
    
    // 따라서 임시저장 시 publishedAt을 9999-12-31 23:59:59로 설정하는 규칙을 사용.
    const DRAFT_DATE = new Date('9999-12-31T23:59:59.000Z')

    if (status === 'DRAFT') {
        where.publishedAt = DRAFT_DATE
    } else if (status === 'SCHEDULED') {
        where.publishedAt = {
            gt: new Date(),
            lt: DRAFT_DATE
        }
    } else if (status === 'PUBLISHED') {
        where.publishedAt = {
            lte: new Date()
        }
    }

    const [total, blogs] = await prisma.$transaction([
      prisma.blog.count({ where }),
      prisma.blog.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          publishedAt: true,
          views: true,
          targetScope: true,
          _count: {
            select: { attachments: true }
          },
          tags: {
            select: {
              tag: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
    ])

    const formattedBlogs: BlogListItem[] = blogs.map((blog) => {
        let status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' = 'PUBLISHED'
        const now = new Date()
        if (blog.publishedAt.getTime() >= DRAFT_DATE.getTime() - 1000) { // 오차 범위 고려
            status = 'DRAFT'
        } else if (blog.publishedAt > now) {
            status = 'SCHEDULED'
        }

        return {
            id: blog.id,
            title: blog.title,
            slug: blog.slug,
            thumbnailUrl: blog.thumbnailUrl,
            tags: blog.tags.map((t) => t.tag.name),
            publishedAt: blog.publishedAt,
            views: blog.views,
            status,
            targetScope: blog.targetScope as 'ALL' | 'MEMBER_ONLY',
            attachmentCount: blog._count.attachments,
        }
    })

    return {
      success: true,
      data: {
        blogs: formattedBlogs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error('getAdminBlogsService error:', error)
    return { success: false, error: '관리자 블로그 목록 조회 실패' }
  }
}

/**
 * 블로그 생성 서비스
 */
export async function createBlogService(
  input: CreateBlogInput,
  tenantId: string
): Promise<ServiceResponse<any>> {
  try {
    const { title, content, htmlContent, thumbnailUrl, tags, targetScope, isNotice, status, publishedAt, expiredAt, attachments } = input

    // 1. Slug 생성 (중복 처리)
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    
    // 만약 slug가 비어있으면 랜덤 문자열
    if (!slug) {
        slug = `blog-${Math.random().toString(36).substring(2, 8)}`
    }

    // 중복 체크
    let uniqueSlug = slug
    let counter = 1
    while (await prisma.blog.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`
        counter++
    }

    // 2. publishedAt 설정
    // DRAFT -> 9999-12-31
    // SCHEDULED -> 입력받은 publishedAt
    // PUBLISHED -> 입력받은 publishedAt (없으면 now)
    
    let finalPublishedAt = new Date()
    const DRAFT_DATE = new Date('9999-12-31T23:59:59.000Z')

    if (status === 'DRAFT') {
        finalPublishedAt = DRAFT_DATE
    } else if (publishedAt) {
        finalPublishedAt = publishedAt
    }

    // 3. 트랜잭션으로 블로그 생성 및 태그 연결
    const blog = await prisma.$transaction(async (tx) => {
        // 태그 처리
        const tagConnectData = []
        for (const tagName of tags) {
            // 태그가 존재하면 찾고, 없으면 생성 (upsert는 where unique 필요)
            // Tag model: name @unique
            const tag = await tx.tag.upsert({
                where: { name: tagName },
                update: {},
                create: { 
                    name: tagName,
                    slug: tagName // 간단하게 name을 slug로 사용 (필요시 변환)
                }
            })
            tagConnectData.push({ tagId: tag.id })
        }

        const newBlog = await tx.blog.create({
            data: {
                tenantId,
                title,
                slug: uniqueSlug,
                content: content ? JSON.parse(JSON.stringify(content)) : {}, 
                htmlContent,
                thumbnailUrl,
                targetScope,
                isNotice,
                publishedAt: finalPublishedAt,
                expiredAt,
                tags: {
                    create: tagConnectData
                },
                attachments: attachments ? {
                    create: attachments.map(att => ({
                        fileName: att.fileName,
                        fileUrl: att.fileUrl,
                        fileSize: att.fileSize,
                        mimeType: att.mimeType
                    }))
                } : undefined
            }
        })
        return newBlog
    })

    return { success: true, data: blog }

  } catch (error) {
    console.error('createBlogService error:', error)
    return { success: false, error: '블로그 생성 중 오류가 발생했습니다.' }
  }
}

export type BlogDetail = {
  id: string
  title: string
  slug: string
  content: any
  htmlContent: string | null
  thumbnailUrl: string | null
  tags: string[]
  targetScope: 'ALL' | 'MEMBER_ONLY'
  publishedAt: Date
  expiredAt: Date | null
  status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED'
  attachments: {
    id: string
    fileName: string
    fileUrl: string
    fileSize: number
    mimeType: string
  }[]
}

/**
 * 블로그 상세 조회 서비스 (ID 기반, 수정용)
 */
export async function getBlogByIdService(
  id: string,
  tenantId: string
): Promise<ServiceResponse<BlogDetail>> {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id, tenantId },
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
        attachments: true
      }
    })

    if (!blog) {
      return { success: false, error: '블로그를 찾을 수 없습니다.' }
    }

    const DRAFT_DATE = new Date('9999-12-31T23:59:59.000Z')
    let status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' = 'PUBLISHED'
    const now = new Date()
    
    if (blog.publishedAt.getTime() >= DRAFT_DATE.getTime() - 1000) {
        status = 'DRAFT'
    } else if (blog.publishedAt > now) {
        status = 'SCHEDULED'
    }

    return {
      success: true,
      data: {
        ...blog,
        tags: blog.tags.map(t => t.tag.name),
        targetScope: blog.targetScope as 'ALL' | 'MEMBER_ONLY', // Enum casting
        status,
        publishedAt: status === 'DRAFT' ? new Date() : blog.publishedAt,
        attachments: blog.attachments
      }
    }
  } catch (error) {
    console.error('getBlogByIdService error:', error)
    return { success: false, error: '블로그 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 블로그 수정 서비스
 */
export async function updateBlogService(
  id: string,
  input: CreateBlogInput,
  tenantId: string
): Promise<ServiceResponse<any>> {
  try {
    const { title, content, htmlContent, thumbnailUrl, tags, targetScope, isNotice, status, publishedAt, expiredAt, attachments } = input

    // 기존 데이터 조회 (파일 삭제를 위해)
    const existingBlog = await prisma.blog.findUnique({
        where: { id, tenantId },
        include: { attachments: true }
    })

    if (!existingBlog) {
         return { success: false, error: '블로그를 찾을 수 없습니다.' }
    }

    let finalPublishedAt = new Date()
    const DRAFT_DATE = new Date('9999-12-31T23:59:59.000Z')

    if (status === 'DRAFT') {
        finalPublishedAt = DRAFT_DATE
    } else if (publishedAt) {
        finalPublishedAt = publishedAt
    } else {
        // 기존 publishedAt 유지 (또는 DRAFT였으면 유지)
        if (existingBlog.publishedAt.getTime() >= DRAFT_DATE.getTime() - 1000) {
             finalPublishedAt = DRAFT_DATE
        } else {
             finalPublishedAt = existingBlog.publishedAt
        }
        // 만약 사용자가 명시적으로 날짜를 줬다면 위에서 걸림. 
        // 입력값이 없으면 기존 값 유지 정책.
    }

    const blog = await prisma.$transaction(async (tx) => {
        // 기존 태그 연결 삭제
        await tx.blogTag.deleteMany({
            where: { blogId: id }
        })

        // 태그 처리
        const tagConnectData = []
        for (const tagName of tags) {
            const tag = await tx.tag.upsert({
                where: { name: tagName },
                update: {},
                create: { 
                    name: tagName,
                    slug: tagName 
                }
            })
            tagConnectData.push({ tagId: tag.id })
        }

        // 첨부파일 처리: 기존 파일 삭제 후 재생성
        if (attachments) {
            await tx.attachment.deleteMany({
                where: { blogId: id }
            })
        }

        const updatedBlog = await tx.blog.update({
            where: { id, tenantId },
            data: {
                title,
                content: content ? JSON.parse(JSON.stringify(content)) : {},
                htmlContent,
                thumbnailUrl,
                targetScope,
                isNotice,
                publishedAt: finalPublishedAt,
                expiredAt,
                tags: {
                    create: tagConnectData
                },
                attachments: attachments ? {
                    create: attachments.map(att => ({
                        fileName: att.fileName,
                        fileUrl: att.fileUrl,
                        fileSize: att.fileSize,
                        mimeType: att.mimeType
                    }))
                } : undefined
            }
        })
        return updatedBlog
    })

    // R2 파일 정리 (DB 업데이트 성공 후)
    const keysToDelete: string[] = []

    // 1. 썸네일 변경/삭제 시 기존 파일 삭제
    if (existingBlog.thumbnailUrl && existingBlog.thumbnailUrl !== thumbnailUrl) {
        try {
            const key = getKeyFromUrl(existingBlog.thumbnailUrl)
            if (key) keysToDelete.push(key)
        } catch {}
    }

    // 2. 첨부파일 삭제 시 기존 파일 삭제 (새 목록에 없는 경우)
    if (attachments) {
        const newUrls = new Set(attachments.map(a => a.fileUrl))
        existingBlog.attachments.forEach(att => {
            if (att.fileUrl && !newUrls.has(att.fileUrl)) {
                try {
                    const key = getKeyFromUrl(att.fileUrl)
                    if (key) keysToDelete.push(key)
                } catch {}
            }
        })
    }

    if (keysToDelete.length > 0) {
        deleteMultipleFromR2(keysToDelete).catch(console.error)
    }

    return { success: true, data: blog }

  } catch (error) {
    console.error('updateBlogService error:', error)
    return { success: false, error: '블로그 수정 중 오류가 발생했습니다.' }
  }
}

/**
 * 블로그 삭제 서비스
 */
export async function deleteBlogService(
  id: string,
  tenantId: string
): Promise<ServiceResponse<void>> {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id, tenantId },
      include: {
        attachments: true
      }
    })

    if (!blog) {
      return { success: false, error: '블로그를 찾을 수 없거나 권한이 없습니다.' }
    }

    // 삭제할 이미지 URL 수집
    const urlsToDelete: string[] = []
    if (blog.thumbnailUrl) urlsToDelete.push(blog.thumbnailUrl)
    blog.attachments.forEach(att => {
        if (att.fileUrl) urlsToDelete.push(att.fileUrl)
    })

    // DB에서 삭제 (Cascade 설정으로 attachment 레코드도 함께 삭제됨)
    await prisma.blog.delete({
      where: { id },
    })

    // R2에서 실제 파일 삭제
    if (urlsToDelete.length > 0) {
        const keys = urlsToDelete.map(url => {
            try { return getKeyFromUrl(url) } catch { return null }
        }).filter((k): k is string => !!k)
        
        if (keys.length > 0) {
            deleteMultipleFromR2(keys).catch(err => {
                console.error('Failed to delete files from R2 during blog deletion:', err)
            })
        }
    }

    return { success: true, data: undefined }
  } catch (error) {
    console.error('deleteBlogService error:', error)
    return { success: false, error: '블로그 삭제 중 오류가 발생했습니다.' }
  }
}

export type BlogStats = {
  totalPosts: number
  totalViews: number
  draftCount: number
  memberOnlyCount: number
}

/**
 * 블로그 통계 조회 서비스
 */
export async function getBlogStatsService(tenantId: string): Promise<ServiceResponse<BlogStats>> {
  try {
    const DRAFT_DATE = new Date('9999-12-31T23:59:59.000Z')
    
    const [publishedCount, totalViewsResult, draftCount, memberOnlyCount] = await prisma.$transaction([
      // 발행된 글 수
      prisma.blog.count({
        where: {
          tenantId,
          publishedAt: { lte: new Date() }
        }
      }),
      // 총 조회수 (전체 글 대상)
      prisma.blog.aggregate({
        _sum: {
          views: true
        },
        where: {
          tenantId
        }
      }),
      // 임시저장 글 수
      prisma.blog.count({
        where: {
          tenantId,
          publishedAt: { gte: new Date(DRAFT_DATE.getTime() - 1000) } // 오차 고려
        }
      }),
      // 회원 전용 글 수 (발행된 것만)
      prisma.blog.count({
        where: {
          tenantId,
          targetScope: 'MEMBER_ONLY',
          publishedAt: { lte: new Date() }
        }
      })
    ])

    return {
      success: true,
      data: {
        totalPosts: publishedCount,
        totalViews: totalViewsResult._sum.views || 0,
        draftCount: draftCount,
        memberOnlyCount: memberOnlyCount
      }
    }
  } catch (error) {
    console.error('getBlogStatsService error:', error)
    return { success: false, error: '통계 정보를 불러오는데 실패했습니다.' }
  }
}






