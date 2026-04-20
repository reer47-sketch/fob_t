'use client';

import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft, Paperclip } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BlogDetailViewProps {
    blog: {
        title: string;
        content: any; // or string if HTML
        htmlContent: string | null;
        thumbnailUrl: string | null;
        publishedAt: Date;
        tags: { tag: { name: string } }[];
        slug: string;
        targetScope: 'ALL' | 'MEMBER_ONLY';
        attachments: {
            id: string;
            fileName: string;
            fileUrl: string;
            fileSize: number;
        }[];
    };
}

export function BlogDetailView({ blog }: BlogDetailViewProps) {
    // View count increment
    useEffect(() => {
        const incrementView = async () => {
            try {
                await fetch(`/api/blog/${blog.slug}/view`, { method: 'POST' });
            } catch (error) {
                console.error('Failed to increment view count', error);
            }
        };
        incrementView();
    }, [blog.slug]);

    function formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    return (
        <div className="min-h-dvh bg-white font-sans text-slate-900">
            {/* [2] Header (Navigation) */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm transition-all duration-200">
                <div className="mx-auto flex h-20 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
                    <Link href="/blog" className="hover:opacity-80 transition-opacity">
                        <div className="relative h-12 w-48">
                            <img
                                src="/top-logo.png"
                                alt="Fobreeders Logo"
                                className="w-full h-full object-contain object-left"
                            />
                        </div>
                    </Link>
                </div>
            </header>

            <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 md:py-12">
                {/* [4] Visual Elements (Hero Image) */}
                <div className="group relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                    {blog.thumbnailUrl ? (
                        <img
                            src={blog.thumbnailUrl}
                            alt={blog.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-200">
                            <span className="text-slate-400">No Image</span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold leading-snug text-slate-900 sm:text-3xl md:text-4xl lg:leading-tight mb-4">
                    {blog.title}
                </h1>

                {/* Date & Tags */}
                <div className="flex items-center gap-2 mb-8 flex-wrap">
                    <time dateTime={blog.publishedAt.toISOString()} className="text-sm text-slate-400 font-medium">
                        {format(blog.publishedAt, 'yyyy.MM.dd')}
                    </time>
                    {blog.targetScope === 'MEMBER_ONLY' && (
                        <Badge className="bg-purple-600 text-white border-none px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1">
                            <span>🔒</span> 멤버 전용
                        </Badge>
                    )}
                    {blog.tags[0] && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors">
                            {blog.tags[0].tag.name}
                        </Badge>
                    )}
                </div>

                {/* [5] Body Styling (Typography) */}
                <article
                    className="prose prose-lg prose-slate max-w-none 
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
            prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-2xl
            prose-p:leading-relaxed prose-p:text-slate-700 prose-p:text-[17px]
            prose-strong:font-bold prose-strong:text-slate-900
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-4 prose-blockquote:border-slate-900 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-slate-800
            prose-img:rounded-xl"
                >
                    {/* Render HTML content */}
                    <div dangerouslySetInnerHTML={{ __html: blog.htmlContent || '' }} />
                </article>

                {/* Attachments Section */}
                {blog.attachments && blog.attachments.length > 0 && (
                    <div className="mt-12 rounded-xl border border-slate-100 bg-white p-6">
                        <h3 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Paperclip className="h-5 w-5" />
                            첨부파일
                        </h3>
                        <ul className="space-y-3">
                            {blog.attachments.map((file) => (
                                <li key={file.id}>
                                    <a
                                        href={`/api/download?url=${encodeURIComponent(file.fileUrl)}&filename=${encodeURIComponent(file.fileName)}`}
                                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                                <Paperclip className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="truncate text-sm font-medium text-slate-700">
                                                    {file.fileName}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {formatBytes(file.fileSize)}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="ml-4 shrink-0 text-xs font-medium text-blue-600 hover:underline">
                                            다운로드
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Footer / Navigation Hint */}
                <div className="mt-16 border-t border-slate-100 pt-8">
                    <Link
                        href="/blog"
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Insights
                    </Link>
                </div>
            </main>
        </div>
    );
}
