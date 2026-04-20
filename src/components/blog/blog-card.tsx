import { Badge } from '@/components/ui/badge';

interface BlogCardProps {
    title: string;
    thumbnailUrl?: string | null;
    tags: string[];
    date?: string;
    targetScope?: 'ALL' | 'MEMBER_ONLY';
    priority?: boolean;
}

export function BlogCard({ title, thumbnailUrl, tags, date, targetScope, priority }: BlogCardProps) {
    return (
        <div className="flex flex-col h-full group cursor-pointer">
            {/* Image Area */}
            <div className="aspect-[4/3] relative rounded-2xl overflow-hidden bg-gray-100 mb-4">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                        <span className="text-2xl font-bold">P</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex flex-col flex-1">
                {/* Title */}
                <h3 className="font-bold text-[17px] md:text-lg leading-tight text-gray-900 line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors break-keep">
                    {title}
                </h3>

                {/* Date & Tags */}
                <div className="flex items-center gap-2 mt-auto flex-wrap">
                    <span className="text-xs text-gray-400 font-medium">{date}</span>
                    {targetScope === 'MEMBER_ONLY' && (
                        <Badge className="bg-purple-600 text-white border-none px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1">
                            <span>🔒</span> 멤버 전용
                        </Badge>
                    )}
                    {tags[0] && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-2 py-0.5 text-[10px] md:text-[11px] font-medium rounded-full transition-colors">
                            {tags[0]}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}
