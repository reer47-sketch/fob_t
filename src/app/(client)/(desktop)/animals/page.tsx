'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimalSearchFilters, type SearchFilters } from './_components/animal-search-filters';
import { AnimalCardGrid } from './_components/animal-card-grid';
import { AnimalDetailSheet } from './_components/animal-detail-sheet';
import { LabelTemplateSheet } from './_components/label-template-sheet';
import { ExportExcelModal, type ExportType } from './_components/export-excel-modal';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, X, Mic } from 'lucide-react';
import { getAnimals } from '@/actions/animals/get-animals';
import { getAnimalsByIdsForLabel } from '@/actions/animals/get-animals-by-ids-for-label';
import { exportAnimalsExcel } from '@/actions/animals/export-animals-excel';
import { exportAnimalsLabelExcel } from '@/actions/animals/export-animals-label-excel';
import type { AnimalListItem, AnimalWithParentsForLabel } from '@/services/animal-service';
import { toast } from 'sonner';
import { useIsMobileReady } from '@/hooks/use-mobile';
import { AnimalListCard } from '@/components/mobile/animal-list/animal-list-card';
import { useSheetRoute } from '@/hooks/use-sheet-route';

export default function AnimalsPage() {
    const router = useRouter();
    const [animals, setAnimals] = useState<AnimalListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState<SearchFilters>({});
    const detailSheet = useSheetRoute<{ animal: string }>(['animal']);
    const selectedAnimalId = detailSheet.state?.animal ?? null;
    const isSheetOpen = detailSheet.isOpen;
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isLabelTemplateOpen, setIsLabelTemplateOpen] = useState(false);
    const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [labelTemplateData, setLabelTemplateData] = useState<AnimalWithParentsForLabel[]>([]);

    const isMobile = useIsMobileReady();
    const pageSize = 20;
    const sentinelRef = useRef<HTMLDivElement>(null);

    const fetchAnimals = useCallback(
        async (currentPage: number, searchFilters: SearchFilters, append = false) => {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            try {
                const result = await getAnimals({
                    ...searchFilters,
                    page: currentPage,
                    pageSize,
                });

                if (result.success) {
                    if (append) {
                        setAnimals((prev) => [...prev, ...result.data.animals]);
                    } else {
                        setAnimals(result.data.animals);
                    }
                    setTotal(result.data.total);
                    setHasMore(currentPage < result.data.totalPages);
                } else {
                    console.error('Failed to fetch animals:', result.error);
                    if (!append) setAnimals([]);
                }
            } catch (error) {
                console.error('Error fetching animals:', error);
                if (!append) setAnimals([]);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [pageSize]
    );

    // 초기 로드
    useEffect(() => {
        fetchAnimals(1, filters);
    }, [fetchAnimals]);

    // IntersectionObserver로 무한스크롤
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchAnimals(nextPage, filters, true);
                }
            },
            {
                rootMargin: '200px',
            }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, page, filters, fetchAnimals]);

    const handleSearch = (searchFilters: SearchFilters) => {
        setFilters(searchFilters);
        setPage(1);
        setSelectedAnimalIds([]);
        fetchAnimals(1, searchFilters);
    };

    const handleReset = () => {
        setFilters({});
        setPage(1);
        setSelectedAnimalIds([]);
        fetchAnimals(1, {});
    };

    const handleViewDetail = (animalId: string) => {
        detailSheet.open({ animal: animalId });
    };

    const handleViewCard = (animalId: string) => {
        // TODO: Implement card view
        console.log('View card:', animalId);
    };

    const handleManageBreeding = (animalId: string) => {
        // TODO: Implement breeding management
        console.log('Manage breeding:', animalId);
    };

    const handleAnimalDeleted = () => {
        setPage(1);
        fetchAnimals(1, filters);
    };

    const handleAnimalUpdated = () => {
        setPage(1);
        fetchAnimals(1, filters);
    };

    const handleLabelTemplateOpen = async () => {
        if (!selectionMode) {
            setSelectionMode(true);
            setSelectedAnimalIds([]);
            toast.info('라벨을 출력할 개체를 선택한 후 완료 버튼을 눌러주세요.');
            return;
        }

        if (selectedAnimalIds.length === 0) {
            toast.error('라벨을 출력할 개체를 선택해주세요.');
            return;
        }

        const fetchPromise = async () => {
            const result = await getAnimalsByIdsForLabel(selectedAnimalIds);
            if (result.success) {
                setLabelTemplateData(result.data || []);
                setIsLabelTemplateOpen(true);
                setSelectionMode(false);
            } else {
                throw new Error(result.error);
            }
        };

        toast.promise(fetchPromise(), {
            loading: '라벨 데이터를 불러오는 중...',
            success: '데이터를 성공적으로 불러왔습니다',
            error: (err) => `데이터 로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
        });
    };

    const handleCancelSelection = () => {
        setSelectionMode(false);
        setSelectedAnimalIds([]);
    };

    const handleBulkEdit = () => {
        if (selectedAnimalIds.length === 0) return;
        // sessionStorage에 ID 저장 (URL 길이 제한 대비)
        sessionStorage.setItem('bulkEditIds', JSON.stringify(selectedAnimalIds));
        router.push('/bulk-manage');
    };

    const handleMobileCardClick = (animalId: string) => {
        if (selectionMode) {
            setSelectedAnimalIds((prev) =>
                prev.includes(animalId) ? prev.filter((id) => id !== animalId) : [...prev, animalId]
            );
        } else {
            handleViewDetail(animalId);
        }
    };

    const handleExportExcel = async (type: ExportType) => {
        const exportPromise = async () => {
            setDownloading(true);
            try {
                const result =
                    type === 'management' ? await exportAnimalsExcel(filters) : await exportAnimalsLabelExcel(filters);

                if (result.success) {
                    const uint8Array = new Uint8Array(result.data.buffer);
                    const blob = new Blob([uint8Array], {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = result.data.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    throw new Error(result.error);
                }
            } finally {
                setDownloading(false);
            }
        };

        toast.promise(exportPromise(), {
            loading: '엑셀 다운로드 중...',
            success: '다운로드가 완료되었습니다',
            error: '엑셀 다운로드 중 오류가 발생했습니다',
        });
    };

    if (isMobile === undefined) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">로딩 중...</p>
            </div>
        );
    }

    return (
        <>
            <div className={`flex flex-col gap-4 h-full overflow-hidden ${isMobile ? 'px-0' : ''}`}>
                {/* 검색 필터 + 액션 바 */}
                <div className="shrink-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsExportModalOpen(true)}
                                disabled={loading || downloading}
                                title="엑셀 다운로드"
                            >
                                <img src="/icon-excel.png" alt="Excel" className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLabelTemplateOpen}
                                title="라벨 템플릿 설정"
                            >
                                <Printer className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            총 {total}마리
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/animals/voice-register')}
                            className="gap-1.5"
                        >
                            <Mic className="h-3.5 w-3.5" />
                            AI 음성 등록
                        </Button>
                        <AnimalSearchFilters onSearch={handleSearch} onReset={handleReset} />
                    </div>
                </div>

                {/* 리스트 영역 */}
                <div className="flex-1 min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">로딩 중...</p>
                        </div>
                    ) : isMobile ? (
                        <div className="h-full overflow-y-auto scrollbar-hide">
                            {selectionMode && (
                                <div className="sticky top-0 z-10 flex items-center justify-between bg-background border-b px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={handleCancelSelection}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm font-medium">
                                            {selectedAnimalIds.length}마리 선택됨
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleBulkEdit}
                                            disabled={selectedAnimalIds.length === 0}
                                        >
                                            일괄 편집
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleLabelTemplateOpen}
                                            disabled={selectedAnimalIds.length === 0}
                                        >
                                            완료
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {animals.length > 0 ? (
                                <>
                                    {animals.map((animal) => (
                                        <AnimalListCard
                                            key={animal.id}
                                            animal={animal}
                                            selectionMode={selectionMode}
                                            selected={selectedAnimalIds.includes(animal.id)}
                                            onClick={handleMobileCardClick}
                                        />
                                    ))}
                                    <div ref={sentinelRef} className="h-8 flex items-center justify-center">
                                        {loadingMore && (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                    등록된 개체가 없습니다.
                                </div>
                            )}
                        </div>
                    ) : (
                        <AnimalCardGrid
                            animals={animals}
                            selectionMode={selectionMode}
                            selectedIds={selectedAnimalIds}
                            onSelectionChange={setSelectedAnimalIds}
                            onViewDetail={handleViewDetail}
                            onConfirmSelection={handleLabelTemplateOpen}
                            onBulkEdit={handleBulkEdit}
                            onCancelSelection={handleCancelSelection}
                            sentinelRef={sentinelRef}
                            loadingMore={loadingMore}
                        />
                    )}
                </div>
            </div>

            {/* 개체 상세 정보 Sheet */}
            <AnimalDetailSheet
                animalId={selectedAnimalId}
                open={isSheetOpen}
                onOpenChange={(open) => { if (!open) detailSheet.close() }}
                onDeleted={handleAnimalDeleted}
                onUpdated={handleAnimalUpdated}
            />

            {/* 라벨 템플릿 Sheet */}
            <LabelTemplateSheet
                open={isLabelTemplateOpen}
                onOpenChange={setIsLabelTemplateOpen}
                selectedAnimals={labelTemplateData}
            />

            {/* 엑셀 다운로드 모달 */}
            <ExportExcelModal
                open={isExportModalOpen}
                onOpenChange={setIsExportModalOpen}
                onSelectType={handleExportExcel}
            />
        </>
    );
}
