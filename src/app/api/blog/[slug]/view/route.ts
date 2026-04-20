import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const decodedSlug = decodeURIComponent(slug)
    
    // 1. Find blog first to get ID
    const blog = await prisma.blog.findUnique({
      where: { slug: decodedSlug },
      select: { id: true }
    })

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    const cookieStore = await cookies()
    const viewKey = `blog_view_${blog.id}`

    // 2. Check cookie
    if (cookieStore.has(viewKey)) {
      return NextResponse.json({ message: 'Already viewed' }, { status: 200 })
    }

    // 3. Update view count
    await prisma.blog.update({
      where: { id: blog.id },
      data: { views: { increment: 1 } },
    })

    // 4. Set cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set({
      name: viewKey,
      value: 'true',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error) {
    console.error('View count error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
