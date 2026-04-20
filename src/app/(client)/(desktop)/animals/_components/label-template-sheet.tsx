'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, LayoutGrid, Save } from 'lucide-react';
import type { AnimalWithParentsForLabel } from '@/services/animal-service';
import { LabelRenderer, type LabelSettings } from './label-renderer';
import { LabelSettingsForm } from './label-settings-form';
import { toPng } from 'html-to-image';
import { createTemplate } from '@/actions/label-templates/create-template';
import { getTemplate } from '@/actions/label-templates/get-template';
import { toast } from 'sonner';

interface LabelTemplateSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAnimals?: AnimalWithParentsForLabel[];
}

function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [matches, query]);
    return matches;
}

export function LabelTemplateSheet({ open, onOpenChange, selectedAnimals = [] }: LabelTemplateSheetProps) {
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const [activeTab, setActiveTab] = useState('settings');
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [settings, setSettings] = useState<LabelSettings>({
        name: '기본 라벨 (50x20)',
        width: 50,
        height: 20,
        marginTop: 2.5,
        marginLeft: 3,
        fontSize: 8,
        selectedFields: ['hatchDate', 'morph', 'uniqueId', 'fatherName', 'motherName'],
    });

    // 템플릿 불러오기
    useEffect(() => {
        if (open) {
            const loadTemplate = async () => {
                const result = await getTemplate();
                if (result.success && result.data) {
                    setSettings((prev) => ({
                        ...prev,
                        ...result.data,
                    }));
                }
            };
            loadTemplate();
        }
    }, [open]);

    const handleChange = (key: keyof LabelSettings, value: any) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    // 표시할 라벨 목록
    const displayAnimals = selectedAnimals;

    // Data URL을 Blob으로 변환하는 헬퍼 함수
    const dataUrlToBlob = (dataUrl: string): Blob => {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };

    const handleDownload = useCallback(async () => {
        // 모든 이미지를 먼저 생성
        const files: File[] = [];
        const downloadData: { fileName: string; dataUrl: string }[] = [];

        for (const animal of displayAnimals) {
            const element = document.getElementById(`label-item-${animal.id}`);
            if (!element) continue;

            try {
                const dataUrl = await toPng(element, {
                    cacheBust: true,
                    pixelRatio: 3,
                });

                const fileName = `${animal.name || animal.uniqueId}-label.png`;
                const blob = dataUrlToBlob(dataUrl);
                const file = new File([blob], fileName, { type: 'image/png' });

                files.push(file);
                downloadData.push({ fileName, dataUrl });
            } catch (err) {
                console.error('Failed to generate label image', err);
            }
        }

        // iOS에서만 Web Share API 사용 (Android는 다운로드가 갤러리에 바로 저장됨)
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (!isDesktop && isIOS && navigator.share) {
            try {
                await navigator.share({
                    files,
                    title: '라벨 이미지',
                });
                return; // 공유 성공 시 종료
            } catch (shareErr) {
                // 사용자가 취소한 경우 종료
                if ((shareErr as Error).name === 'AbortError') {
                    return;
                }
                // 공유 실패 시 기존 다운로드 방식으로 폴백
                console.warn('Share failed, falling back to download', shareErr);
            }
        }

        // 기존 다운로드 방식 (데스크탑 또는 Web Share API 미지원 시)
        for (const { fileName, dataUrl } of downloadData) {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            link.click();

            // 브라우저가 다중 다운로드를 처리할 수 있도록 약간의 딜레이 부여
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }, [displayAnimals, isDesktop]);

    const handleDownloadClick = async () => {
        setIsDownloading(true);
        // 모바일이고 미리보기 탭이 아닐 경우, 탭 전환 후 다운로드
        if (!isDesktop && activeTab !== 'preview') {
            setActiveTab('preview');
            // 렌더링 대기
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
        await handleDownload();
        setIsDownloading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const promise = createTemplate(settings);
        toast.promise(promise, {
            loading: '템플릿 저장 중...',
            success: '템플릿이 저장되었습니다.',
            error: '템플릿 저장에 실패했습니다.',
        });
        await promise;
        setIsSaving(false);
    };

    const SettingsPanel = <LabelSettingsForm settings={settings} onChange={handleChange} />;

    const PreviewPanel = (
        <div className="flex flex-col bg-gray-50/50 overflow-hidden relative h-full w-full">
            <div className="p-4 border-b bg-white/50 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded">
                    LIVE PREVIEW LIST
                </span>
                <p className="text-xs text-muted-foreground">{settings.width}mm x {settings.height}mm 규격 미리보기</p>
            </div>

            <ScrollArea className="flex-1 h-full w-full">
                <div className="p-6 flex flex-wrap gap-4 pb-20 w-full justify-center">
                    {displayAnimals.map((animal) => (
                        <div
                            key={animal.id}
                            id={`label-item-${animal.id}`}
                            className="origin-top-left"
                            style={{ width: settings.width * 8 * 0.75, height: settings.height * 8 * 0.75 }}
                        >
                            <div style={{ transform: 'scale(0.75)', transformOrigin: 'top left' }}>
                                <LabelRenderer animal={animal} settings={settings} />
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[70vw] w-full flex flex-col p-0 gap-0 h-full max-h-screen">
                {/* 1. 상단 헤더 (고정) */}
                <SheetHeader className="px-6 py-4 border-b shrink-0">
                    <SheetTitle className="flex items-center gap-2">
                        라벨지 템플릿 설정
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                        선택된 {displayAnimals.length}개의 개체에 대한 라벨 미리보기입니다. 현재 규격: {settings.width}mm x {settings.height}mm
                    </SheetDescription>
                </SheetHeader>

                {/* 2. 중앙 본문 영역 (확장) */}
                <div className="flex-1 flex overflow-hidden min-h-0">
                    {isDesktop ? (
                        <>
                            {/* 데스크탑 뷰: 좌측 설정, 우측 미리보기 */}
                            <div className="w-[400px] border-r flex flex-col bg-muted/5 h-full">{SettingsPanel}</div>
                            <div className="flex-1 overflow-hidden relative h-full">{PreviewPanel}</div>
                        </>
                    ) : (
                        /* 모바일 뷰: Tabs 사용 */
                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="flex-1 flex flex-col overflow-hidden w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2 shrink-0 rounded-none h-12 bg-muted p-1">
                                <TabsTrigger
                                    value="settings"
                                    className="h-full rounded-md bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                    설정
                                </TabsTrigger>
                                <TabsTrigger
                                    value="preview"
                                    className="h-full rounded-md bg-transparent data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                    미리보기
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent
                                value="settings"
                                className="flex-1 overflow-hidden mt-0 border-0 bg-muted/5 data-[state=inactive]:hidden"
                            >
                                <div className="h-full flex flex-col">{SettingsPanel}</div>
                            </TabsContent>
                            <TabsContent
                                value="preview"
                                className="flex-1 overflow-hidden mt-0 border-0 data-[state=inactive]:hidden"
                            >
                                {PreviewPanel}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>

                {/* 3. 하단 버튼 영역 (고정) */}
                <div className="p-6 border-t flex justify-end gap-3 bg-white shrink-0 z-10">
                    <Button
                        variant="outline"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-2 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
                    >
                        <Save className="w-4 h-4" />
                        템플릿 저장
                    </Button>
                    <Button onClick={handleDownloadClick} disabled={isDownloading} className="gap-2 px-8 font-bold shadow-md">
                        <Download className="w-4 h-4" />
                        이미지 다운로드
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
