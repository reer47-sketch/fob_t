import { Metadata } from 'next';
import { BlogCard } from '@/components/blog/blog-card';
import { getBlogsService } from '@/services/blog-service';
import Link from 'next/link';
import { format } from 'date-fns';
import { BlogSearch } from './_components/blog-search';
import { BlogPagination } from './_components/blog-pagination';
import { getCurrentUser } from '@/actions/auth/get-current-user';

export const metadata: Metadata = {
    title: '포브 블로그 - 도마뱀·파충류 사육 정보',
    description:
        '포브리더스 블로그에서 도마뱀, 파충류 사육 정보, 브리딩 팁, 개체관리 노하우를 확인하세요.',
    openGraph: {
        title: '포브 블로그 - 도마뱀·파충류 사육 정보',
        description:
            '도마뱀, 파충류 사육 정보, 브리딩 팁, 개체관리 노하우를 확인하세요.',
        url: 'https://www.fobreeders.com/blog',
    },
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: 'https://www.fobreeders.com/blog',
    },
};

interface BlogPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
    }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const search = params.search || '';
    const pageSize = 12;

    const currentUser = await getCurrentUser();
    const isMember = !!currentUser.data;

    let blogs: any[] = [];
    let totalPages = 1;

    const result = await getBlogsService({ page, pageSize, search }, undefined, isMember);

    if (result.success) {
        blogs = result.data.blogs;
        totalPages = result.data.totalPages;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* 웹뷰 헤더 */}
            <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center">
                    <div className="relative h-12 w-48">
                        <img
                            src="/top-logo.png"
                            alt="Fobreeders Logo"
                            className="w-full h-full object-contain object-left"
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                {/* 히어로/검색 영역 */}
                <div className="max-w-3xl mx-auto mb-16 md:mb-24 text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">포브 블로그</h1>
                    <p className="text-gray-500 mb-10 text-base md:text-lg">
                        포브리더스의 새로운 소식과 업데이트를 확인하세요
                    </p>
                    <BlogSearch />
                </div>

                {/* 그리드 레이아웃: 간격 조절 (gap-x-6 -> gap-x-5, gap-y-12 -> gap-y-10) */}
                {blogs.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10 lg:gap-x-8 lg:gap-y-12">
                            {blogs.map((blog: any, index: number) => (
                                <Link key={blog.id} href={`/blog/${blog.slug}`}>
                                    <BlogCard
                                        title={blog.title}
                                        thumbnailUrl={blog.thumbnailUrl}
                                        tags={blog.tags}
                                        date={format(new Date(blog.publishedAt), 'yyyy.MM.dd')}
                                        targetScope={blog.targetScope}
                                        priority={index < 2}
                                    />
                                </Link>
                            ))}
                        </div>

                        {/* 페이지네이션 */}
                        <div className="mt-20">
                            <BlogPagination currentPage={page} totalPages={totalPages} />
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        <p>검색 결과가 없습니다.</p>
                    </div>
                )}
            </main>

            {/* 웹 전용 푸터 */}
            <footer className="bg-white border-t border-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="relative h-6 w-24 opacity-50 grayscale">
                        <img src="/top-logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex gap-8 text-xs text-gray-400 font-medium">
                        <Link href="/privacy/terms" className="hover:underline">
                            이용약관
                        </Link>
                        <a href="https://www.fobreeders.com/privacy/policy" className="hover:underline">
                            개인정보처리방침
                        </a>
                    </div>
                    <p className="text-xs text-gray-400">© 2026 Fobreeders. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
