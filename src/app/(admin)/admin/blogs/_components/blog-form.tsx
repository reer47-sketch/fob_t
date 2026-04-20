'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X, Calendar as CalendarIcon, UploadCloud, File as FileIcon, Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBlog } from '@/actions/blogs/create-blog';
import { updateBlog } from '@/actions/blogs/update-blog';
import { toast } from 'sonner';
import { BlogDetail } from '@/services/blog-service';
import { uploadImage } from '@/actions/common/upload-image';
import { uploadFile } from '@/actions/common/upload-file';
import { deleteImages } from '@/actions/common/delete-images';

const TiptapEditor = dynamic(() => import('@/components/editor/tiptap-editor').then((mod) => mod.TiptapEditor), {
    ssr: false,
    loading: () => <div className="h-[500px] bg-muted/10 animate-pulse rounded-md" />,
});

// Form Schema
const blogFormSchema = z.object({
    title: z.string().min(1, '제목을 입력해주세요'),
    content: z.any(), // JSON
    htmlContent: z.string().optional(),
    tags: z.array(z.string()),
    thumbnail: z.any().optional(),
    thumbnailUrl: z.string().nullable().optional(),
    publishedAt: z.date().optional(),
    expiredAt: z.date().optional(),
    targetScope: z.enum(['ALL', 'MEMBER_ONLY']),
    status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']),
    attachments: z.array(z.any()).optional(),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

interface BlogFormProps {
    initialData?: BlogDetail;
}

interface AttachmentItem {
    id?: string;
    name: string;
    size: number;
    type: string;
    file?: File;
    url?: string;
    isUploading?: boolean;
    error?: boolean;
}

export function BlogForm({ initialData }: BlogFormProps) {
    const router = useRouter();
    const isEditMode = !!initialData;
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [tagInput, setTagInput] = useState('');
    const [isTagInputFocused, setIsTagInputFocused] = useState(false);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.thumbnailUrl || null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

    // Initialize attachments from initialData
    const [attachments, setAttachments] = useState<AttachmentItem[]>(
        initialData?.attachments?.map((att) => ({
            id: att.id,
            name: att.fileName,
            size: att.fileSize,
            type: att.mimeType,
            url: att.fileUrl,
        })) || [],
    );

    const [isScheduled, setIsScheduled] = useState(initialData?.status === 'SCHEDULED');
    const [isExpirySet, setIsExpirySet] = useState(!!initialData?.expiredAt);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<BlogFormValues>({
        resolver: zodResolver(blogFormSchema),
        defaultValues: {
            title: initialData?.title || '',
            content: initialData?.content || {},
            htmlContent: initialData?.htmlContent || '',
            tags: initialData?.tags || [],
            targetScope: initialData?.targetScope || 'ALL',
            publishedAt: initialData?.publishedAt || undefined,
            expiredAt: initialData?.expiredAt || undefined,
            status: initialData?.status || 'PUBLISHED',
            thumbnailUrl: initialData?.thumbnailUrl,
        },
    });

    const isDirty = form.formState.isDirty;

    // Prevent accidental navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Slug Generator
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
    };

    // Watch title to update slug
    const title = form.watch('title');
    useEffect(() => {
        if (!isEditMode || (isEditMode && initialData?.status === 'DRAFT')) {
            setSlug(generateSlug(title || ''));
        }
    }, [title, isEditMode, initialData]);

    // Tag Handling
    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            let newTag = tagInput.trim();
            let currentTags = form.getValues('tags');

            if (newTag && !currentTags.includes(newTag)) {
                form.setValue('tags', [...currentTags, newTag]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        const currentTags = form.getValues('tags');
        form.setValue(
            'tags',
            currentTags.filter((tag) => tag !== tagToRemove),
        );
    };

    // Helper: File Size Check (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const checkFileSize = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error(`파일 용량이 너무 큽니다. (최대 10MB): ${file.name}`);
            return false;
        }
        return true;
    };

        // Thumbnail Handling (Lazy Upload)
        const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                if (!checkFileSize(file)) return;
    
                const objectUrl = URL.createObjectURL(file);
                setThumbnailPreview(objectUrl);
                setThumbnailFile(file);
            }
        };
    // File Attachment Handling (Lazy Upload)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files).filter(checkFileSize);
            if (selectedFiles.length === 0) return;

            // Prevent duplicates
            const existingFiles = new Set(attachments.map(f => `${f.name}-${f.size}`));
            const uniqueFiles = selectedFiles.filter(file => !existingFiles.has(`${file.name}-${file.size}`));

            if (uniqueFiles.length === 0) {
                toast.info('이미 추가된 파일입니다.');
                e.target.value = ''; // Reset input
                return;
            }

            const newAttachments = uniqueFiles.map(file => ({
                id: Math.random().toString(36).substring(7), // Temporary ID
                name: file.name,
                size: file.size,
                type: file.type,
                file: file,
                url: '',
                isUploading: false // Pending upload
            }));

            setAttachments(prev => [...prev, ...newAttachments]);
            e.target.value = ''; // Reset input
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: BlogFormValues) => {
        setIsSubmitting(true);
        const toastId = toast.loading('파일 업로드 및 저장 중...');

        try {
            // 1. Upload Thumbnail if new
            let uploadedThumbnailUrl = data.thumbnailUrl;
            if (thumbnailFile) {
                const formData = new FormData();
                formData.append('file', thumbnailFile);
                formData.append('folder', 'blog-thumbnails');
                const result = await uploadImage(formData);
                if (!result.success) {
                    toast.error('썸네일 업로드 실패', { id: toastId });
                    setIsSubmitting(false);
                    return;
                }
                uploadedThumbnailUrl = result.url;
            }

            // 2. Upload Pending Attachments
            const finalAttachments = await Promise.all(attachments.map(async (att) => {
                if (att.file && !att.url) {
                    const formData = new FormData();
                    formData.append('file', att.file);
                    formData.append('folder', 'blog-attachments');
                    const result = await uploadFile(formData);
                    if (!result.success) {
                        throw new Error(`파일 업로드 실패: ${att.name}`);
                    }
                    return { ...att, url: result.url };
                }
                return att;
            }));

            // 3. Handle Pending Tag Input
            if (tagInput.trim()) {
                const currentTags = form.getValues('tags');
                if (!currentTags.includes(tagInput.trim())) {
                    data.tags.push(tagInput.trim());
                }
                setTagInput('');
            }

            // 4. Status Logic
            if (data.status === 'PUBLISHED') {
                if (isScheduled && data.publishedAt && data.publishedAt > new Date()) {
                    data.status = 'SCHEDULED'
                }
            }

            const attachmentsPayload = finalAttachments.map(item => ({
                fileName: item.name,
                fileUrl: item.url || '', 
                fileSize: item.size,
                mimeType: item.type
            }))

            const { thumbnail, ...submitData } = data;
            const finalThumbnailUrl = uploadedThumbnailUrl || (typeof thumbnailPreview === 'string' && thumbnailPreview.startsWith('http') ? thumbnailPreview : null);
        
            let result;
            if (isEditMode && initialData) {
                result = await updateBlog(initialData.id, {
                    ...submitData,
                    thumbnailUrl: finalThumbnailUrl, 
                    isNotice: false,
                    attachments: attachmentsPayload
                })
            } else {
                result = await createBlog({
                    ...submitData,
                    thumbnailUrl: finalThumbnailUrl, 
                    isNotice: false,
                    attachments: attachmentsPayload
                })
            }

            if (result.success) {
                toast.success(isEditMode ? '성공적으로 수정되었습니다.' : (data.status === 'DRAFT' ? '임시 저장되었습니다.' : '성공적으로 게시되었습니다.'), { id: toastId });
                router.push('/admin/blogs')
            } else {
                toast.error(result.error || '저장에 실패했습니다.', { id: toastId });
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.', { id: toastId });
            setIsSubmitting(false);
        }
    }

    const handlePublish = () => {
        form.setValue('status', 'PUBLISHED');
        form.handleSubmit(onSubmit)();
    };

    const handleDraftSave = () => {
        form.setValue('status', 'DRAFT');
        form.handleSubmit(onSubmit)();
    };

    const handleExit = async () => {
        if (isSubmitting) return;

        const urlsToDelete: string[] = [];

        // 1. Thumbnail
        if (thumbnailPreview && thumbnailPreview !== initialData?.thumbnailUrl) {
            if (thumbnailPreview.startsWith('http')) {
                urlsToDelete.push(thumbnailPreview);
            }
        }

        // 2. Attachments
        attachments.forEach((att) => {
            const isExisting = initialData?.attachments?.some((initAtt) => initAtt.fileUrl === att.url);
            if (att.url && !isExisting) {
                urlsToDelete.push(att.url);
            }
        });

        if (urlsToDelete.length > 0) {
            toast.info('저장되지 않은 파일을 정리하고 나갑니다.');
            await deleteImages(urlsToDelete);
        }

        router.push('/admin/blogs');
    };

    return (
        <form className="min-h-dvh pb-20">
            {/* Header Actions */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b mb-8">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 pb-2">
                    <div className="flex items-center gap-1 sm:gap-4 min-w-0">
                        <Link href="/admin/blogs">
                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                disabled={isSubmitting}
                                className="h-9 w-9"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2 min-w-0">
                            <h1 className="font-bold text-base sm:text-lg whitespace-nowrap truncate">
                                {isEditMode ? '글 수정' : '새 글 작성'}
                            </h1>
                            {isDirty && (
                                <span className="flex items-center shrink-0">
                                    <div
                                        className="w-2 h-2 rounded-full bg-amber-500 animate-pulse sm:mr-1"
                                        title="저장되지 않음"
                                    />
                                    <span className="hidden md:inline text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                        작성 중
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={handleDraftSave}
                            disabled={isSubmitting}
                            className="h-9 px-2.5 sm:px-4"
                        >
                            {isSubmitting && form.getValues('status') === 'DRAFT' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="text-xs sm:text-sm whitespace-nowrap">임시저장</span>
                            )}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handlePublish}
                            disabled={isSubmitting}
                            className="h-9 bg-[#58BA2E] hover:bg-[#58BA2E]/90 text-white font-bold px-3 sm:px-5 shadow-sm"
                        >
                            {isSubmitting && form.getValues('status') !== 'DRAFT' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="text-xs sm:text-sm whitespace-nowrap">
                                    {isEditMode ? '수정 완료' : '게시하기'}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                {/* Main Content (Left) */}
                <div className="space-y-4">
                    {/* Title Section */}
                    <div className="space-y-2 border-b">
                        <Controller
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="제목을 입력하세요..."
                                    className="text-3xl md:text-4xl font-bold border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40 h-auto py-2"
                                />
                            )}
                        />
                    </div>

                    <div className="min-h-[500px]">
                        <TiptapEditor
                            content={form.getValues('htmlContent') || ''}
                            onChange={({ html, json }) => {
                                form.setValue('content', json);
                                form.setValue('htmlContent', html);
                            }}
                        />
                    </div>

                    <Separator className="bg-gray-100" />

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">첨부파일</h3>
                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                                <Button variant="outline" size="sm" type="button" className="pointer-events-none">
                                    <UploadCloud className="w-4 h-4 mr-2" /> 파일 추가
                                </Button>
                            </div>
                        </div>

                        {attachments.length > 0 && (
                            <div className="border rounded-lg divide-y">
                                {attachments.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                                                {file.isUploading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : file.error ? (
                                                    <X className="w-4 h-4 text-red-500" />
                                                ) : (
                                                    <FileIcon className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="text-sm">
                                                <p className={`font-medium ${file.error ? 'text-red-500' : ''}`}>
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                    {file.isUploading && ' - 업로드 중...'}
                                                    {file.error && ' - 실패'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeAttachment(index)}
                                            type="button"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {attachments.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                                첨부된 파일이 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 lg:sticky lg:top-24 h-fit">
                    {/* Thumbnail Card */}
                    <Card className="shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 pl-4">
                            <h3 className="font-semibold text-sm">대표 이미지</h3>
                        </div>
                        <CardContent className="px-4">
                            <div className="group relative">
                                {thumbnailPreview ? (
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0"
                                                onClick={() => {
                                                    setThumbnailPreview(null);
                                                    form.setValue('thumbnailUrl', null);
                                                }}
                                                type="button"
                                            >
                                                삭제
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative aspect-video w-full rounded-lg border-2 border-dashed border-gray-200 hover:border-[#58BA2E]/50 hover:bg-gray-50/50 transition-all flex flex-col items-center justify-center text-center cursor-pointer group">
                                        <UploadCloud className="w-8 h-8 text-gray-300 group-hover:text-[#58BA2E] transition-colors mb-2" />
                                        <p className="text-xs font-medium text-gray-500 group-hover:text-gray-800">이미지 추가</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">4:3 비율 권장</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleThumbnailChange}
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 pl-4">
                            <h3 className="font-semibold text-sm">게시 설정</h3>
                        </div>
                        <CardContent className="px-4 space-y-5">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">게시일 예약</Label>
                                    <Switch
                                        checked={isScheduled}
                                        onCheckedChange={(checked) => {
                                            setIsScheduled(checked);
                                            if (!checked) form.setValue('publishedAt', undefined);
                                        }}
                                    />
                                </div>
                                {isScheduled && (
                                    <Controller
                                        control={form.control}
                                        name="publishedAt"
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={'outline'}
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal',
                                                            !field.value && 'text-muted-foreground',
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? (
                                                            format(field.value, 'PPP', { locale: ko })
                                                        ) : (
                                                            <span>날짜 선택</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                        locale={ko}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                )}
                                {!isScheduled && (
                                    <p className="text-xs text-muted-foreground ml-1">게시글이 즉시 발행됩니다.</p>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">게시 만료일 설정</Label>
                                    <Switch
                                        checked={isExpirySet}
                                        onCheckedChange={(checked) => {
                                            setIsExpirySet(checked);
                                            if (!checked) form.setValue('expiredAt', undefined);
                                        }}
                                    />
                                </div>
                                {isExpirySet && (
                                    <Controller
                                        control={form.control}
                                        name="expiredAt"
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={'outline'}
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal',
                                                            !field.value && 'text-muted-foreground',
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? (
                                                            format(field.value, 'PPP', { locale: ko })
                                                        ) : (
                                                            <span>날짜 선택</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                        locale={ko}
                                                        disabled={(date) => date < new Date()}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tags Card */}
                    <Card className="shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 pl-4">
                            <h3 className="font-semibold text-sm">태그</h3>
                        </div>
                        <CardContent className="px-4 space-y-3">
                            <Controller
                                control={form.control}
                                name="tags"
                                render={({ field }) => (
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2 min-h-[32px]">
                                            {field.value.map((tag) => (
                                                <Badge key={tag} variant="secondary" className="bg-green-50 text-green-700 border border-green-100 px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1">
                                                    {tag}
                                                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-green-900 transition-colors">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                            {field.value.length === 0 && <span className="text-xs text-muted-foreground pt-1">추가된 태그가 없습니다.</span>}
                                        </div>
                                        <Input
                                            placeholder="태그 입력 (Enter 또는 ,)"
                                            value={tagInput}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value.endsWith(',')) {
                                                    const newTag = value.slice(0, -1).trim();
                                                    if (newTag) {
                                                        const currentTags = form.getValues('tags');
                                                        if (!currentTags.includes(newTag)) {
                                                            form.setValue('tags', [...currentTags, newTag]);
                                                        }
                                                    }
                                                    setTagInput('');
                                                } else {
                                                    setTagInput(value);
                                                }
                                            }}
                                            onFocus={() => setIsTagInputFocused(true)}
                                            onBlur={() => setIsTagInputFocused(false)}
                                            onKeyDown={handleTagKeyDown}
                                            className="h-9 bg-gray-50/50"
                                        />
                                        {isTagInputFocused && (
                                            <p className="text-[11px] text-[#58BA2E] font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                                                엔터(Enter) 또는 쉼표(,)를 입력하여 태그를 구분하세요.
                                            </p>
                                        )}
                                    </div>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Target Scope Card */}
                    <Card className="shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 pl-4">
                            <h3 className="font-semibold text-sm">노출 대상</h3>
                        </div>
                        <CardContent className="px-4 space-y-3">
                            <Controller
                                control={form.control}
                                name="targetScope"
                                render={({ field }) => (
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-1">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="ALL" id="scope-all" />
                                            <Label htmlFor="scope-all" className="font-normal cursor-pointer text-sm">전체 공개</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="MEMBER_ONLY" id="scope-member" />
                                            <Label htmlFor="scope-member" className="font-normal cursor-pointer text-sm">회원 전용</Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                            <p className="text-[11px] text-muted-foreground">게시글을 볼 수 있는 권한을 설정합니다.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
