'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Ruler, Database } from 'lucide-react';
import type { LabelSettings } from './label-renderer';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

function NumericInput({
    value,
    onChange,
    min,
    max,
    ...props
}: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max'>) {
    const [localValue, setLocalValue] = useState(String(value));

    useEffect(() => {
        setLocalValue(String(value));
    }, [value]);

    return (
        <input
            type="number"
            min={min}
            max={max}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
                const num = Number(localValue);
                if (localValue === '' || isNaN(num)) {
                    setLocalValue(String(value));
                } else {
                    const clamped = Math.min(max ?? num, Math.max(min ?? num, num));
                    onChange(clamped);
                    setLocalValue(String(clamped));
                }
            }}
            {...props}
        />
    );
}

interface LabelSettingsFormProps {
    settings: LabelSettings;
    onChange: (key: keyof LabelSettings, value: any) => void;
}

const FIELD_CATEGORIES = [
    {
        title: '기본 정보',
        fields: [
            { value: 'name', label: '개체명' },
            { value: 'uniqueId', label: '고유개체 ID' },
            { value: 'gender', label: '성별' },
            { value: 'acquisitionType', label: '입양/해칭' },
            { value: 'acquisitionDate', label: '등록일' },
            { value: 'hatchDate', label: '해칭일' },
        ],
    },
    {
        title: '부모 정보',
        fields: [
            { value: 'fatherName', label: '부 이름' },
            { value: 'motherName', label: '모 이름' },
        ],
    },
    {
        title: '개체 정보',
        fields: [
            { value: 'species', label: '종' },
            { value: 'morph', label: '모프' },
            { value: 'comboMorph', label: '콤보 모프' },
            { value: 'trait', label: '형질' },
            { value: 'color', label: '색깔' },
            { value: 'currentSize', label: '현재크기' },
            { value: 'tailStatus', label: '꼬리상태' },
            { value: 'patternType', label: '무늬 유형' },
            { value: 'quality', label: '퀄리티' },
        ],
    },
    {
        title: '개체 건강 정보',
        fields: [{ value: 'isMating', label: '프루븐' }],
    },
    {
        title: '서식지 정보',
        fields: [{ value: 'cageInfo', label: '케이지정보' }],
    },
];


export function LabelSettingsForm({ settings, onChange }: LabelSettingsFormProps) {
    const selectedFields = settings.selectedFields;
    const activeCount = selectedFields.filter((f) => f !== '').length;

    const handleToggle = (value: string) => {
        const currentIndex = selectedFields.indexOf(value);

        // 이미 선택된 경우 제거 (빈 문자열로 대체하여 자리 유지)
        if (currentIndex !== -1) {
            const newFields = [...selectedFields];
            newFields[currentIndex] = '';
            onChange('selectedFields', newFields);
            return;
        }

        // 최대 5개까지만 선택 가능
        if (activeCount >= 5) return;

        // 추가 (빈 자리가 있으면 채우고, 없으면 뒤에 추가)
        const emptyIndex = selectedFields.indexOf('');
        if (emptyIndex !== -1) {
            const newFields = [...selectedFields];
            newFields[emptyIndex] = value;
            onChange('selectedFields', newFields);
        } else {
            // 빈 자리가 없으면 배열 길이가 5 미만일 때만 추가
            if (selectedFields.length < 5) {
                const newFields = [...selectedFields, value];
                onChange('selectedFields', newFields);
            }
        }
    };

    return (
        <ScrollArea className="flex-1 h-full">
            <div className="p-6 space-y-8 pb-10">
                {/* 규격 정보 및 레이아웃 미리보기 */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-primary" />
                            라벨지 규격
                        </h3>
                        <span className="text-xs text-muted-foreground">{settings.width}mm x {settings.height}mm</span>
                    </div>

                    {/* 라벨 크기 설정 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="label-width" className="text-xs text-muted-foreground">
                                가로 (mm)
                            </Label>
                            <NumericInput
                                id="label-width"
                                min={20}
                                max={200}
                                value={settings.width}
                                onChange={(v) => onChange('width', v)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="label-height" className="text-xs text-muted-foreground">
                                세로 (mm)
                            </Label>
                            <NumericInput
                                id="label-height"
                                min={10}
                                max={200}
                                value={settings.height}
                                onChange={(v) => onChange('height', v)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                    </div>

                    {/* 라벨 레이아웃 미리보기 */}
                    <div
                        className="bg-muted/30 rounded-lg border-2 border-dashed border-gray-300 p-2 mx-auto flex gap-2"
                        style={{ width: '100%', aspectRatio: '50 / 20' }}
                    >
                        {/* 텍스트 영역 */}
                        <div className="flex-1 flex flex-col gap-1">
                            <div className="flex-1 flex items-center justify-center rounded border border-dashed border-gray-400 bg-white">
                                <span className="text-base font-bold text-muted-foreground">①
                                </span>
                            </div>
                            <div className="flex-1 flex items-center justify-center rounded border border-dashed border-gray-400 bg-white">
                                <span className="text-base font-bold text-muted-foreground">②
                                </span>
                            </div>
                            <div className="flex-1 flex items-center justify-center rounded border border-dashed border-gray-400 bg-white">
                                <span className="text-base font-bold text-muted-foreground">③
                                </span>
                            </div>
                            <div className="flex-1 flex gap-1">
                                <div className="flex-1 flex items-center justify-center rounded border border-dashed border-gray-400 bg-white">
                                    <span className="text-base font-bold text-muted-foreground">④
                                    </span>
                                </div>
                                <div className="flex-1 flex items-center justify-center rounded border border-dashed border-gray-400 bg-white">
                                    <span className="text-base font-bold text-muted-foreground">⑤
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* QR 코드 영역 */}
                        <div className="aspect-square h-full flex items-center justify-center rounded border border-dashed border-gray-400 bg-white">
                            <span className="text-base font-bold text-muted-foreground">QR</span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* 데이터 필드 설정 */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold">표시 데이터 설정</h3>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            {activeCount} / 5 선택됨
                        </span>
                    </div>

                    <div className="space-y-6">
                        {FIELD_CATEGORIES.map((category) => (
                            <div key={category.title} className="space-y-3">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block border-b pb-1 mb-2">
                                    {category.title}
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {category.fields.map((field) => {
                                        const isSelected = selectedFields.includes(field.value);
                                        const orderIndex = selectedFields.indexOf(field.value);
                                        const isDisabled = !isSelected && activeCount >= 5;

                                        return (
                                            <div
                                                key={field.value}
                                                className={cn(
                                                    'flex items-center gap-2 p-2 rounded-md border transition-colors relative',
                                                    isSelected
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-transparent hover:bg-muted/50',
                                                    isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                                                )}
                                            >
                                                <Checkbox
                                                    id={`field-${field.value}`}
                                                    checked={isSelected}
                                                    disabled={isDisabled}
                                                    onCheckedChange={() => handleToggle(field.value)}
                                                />
                                                <div className="flex-1 flex items-center justify-between min-w-0">
                                                    <Label
                                                        htmlFor={`field-${field.value}`}
                                                        className={cn(
                                                            'text-sm font-normal cursor-pointer truncate mr-1',
                                                            isDisabled && 'cursor-not-allowed'
                                                        )}
                                                    >
                                                        {field.label}
                                                    </Label>
                                                    {isSelected && (
                                                        <Badge
                                                            variant="default"
                                                            className="h-5 w-5 p-0 flex items-center justify-center text-[10px] shrink-0"
                                                        >
                                                            {orderIndex + 1}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}
