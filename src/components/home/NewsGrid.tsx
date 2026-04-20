'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getBlogs } from '@/actions/blogs/get-blogs'
import { format, toZonedTime } from 'date-fns-tz'
import { BlogListItem } from '@/services/blog-service'

export default function NewsGrid() {
  const [posts, setPosts] = useState<BlogListItem[]>([])

  useEffect(() => {
    getBlogs({ page: 1, pageSize: 5 }).then((result) => {
      if (result.success) {
        setPosts(result.data.blogs)
      }
    })
  }, [])

  return (
    <section className="flex-1 min-w-0">
      <div className="px-4 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">소식</h2>
        <Link href="/blog" target="_blank" className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700">
          더보기 <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="px-4">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <span className="text-sm">새로운 소식을 준비 중입니다</span>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {posts.map((post) => {
              const koreaTime = toZonedTime(new Date(post.publishedAt), 'Asia/Seoul')
              const formattedDate = format(koreaTime, 'yyyy.MM.dd', { timeZone: 'Asia/Seoul' })

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="group block"
                >
                  <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-2 overflow-hidden group-hover:bg-gray-300 transition-colors relative">
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs">썸네일</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-emerald-600 transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formattedDate}</span>
                    {post.tags[0] && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                        {post.tags[0]}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
