import { AnimalListItem } from '@/services/animal-service';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface LabelSettings {
    name: string;
    width: number;
    height: number;
    marginTop: number;
    marginLeft: number;
    fontSize: number;
    selectedFields: string[];
}

// 라벨용 확장 타입 (부모 정보 포함)
export type LabelAnimalItem = AnimalListItem & {
    parents?: Array<{
        parentType: string;
        parent: {
            id: string;
            name: string | null;
            uniqueId: string;
        };
    }>;
};

interface LabelRendererProps {
    animal: LabelAnimalItem;
    settings: LabelSettings;
}

export function LabelRenderer({ animal, settings }: LabelRendererProps) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

    useEffect(() => {
        const generateQrCode = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
                const url = `${baseUrl}/guest/animals/${animal.id}`;
                const dataUrl = await QRCode.toDataURL(url, {
                    margin: 0,
                    width: 100,
                    color: {
                        dark: '#000000',
                        light: '#ffffff',
                    },
                });
                setQrCodeDataUrl(dataUrl);
            } catch (err) {
                console.error('Failed to generate QR code', err);
            }
        };

        generateQrCode();
    }, [animal.id]);

    const getFieldValue = (field: string) => {
        if (!field) return '';
        const speciesCode = animal.codes.find((c) => c.code.category === 'SPECIES');
        const primaryMorphCode = animal.codes.find((c) => c.code.category === 'MORPH' && c.isPrimary);
        const comboMorphCodes = animal.codes.filter((c) => c.code.category === 'MORPH' && !c.isPrimary);
        const traitCodes = animal.codes.filter((c) => c.code.category === 'TRAIT');
        const colorCodes = animal.codes.filter((c) => c.code.category === 'COLOR');

        switch (field) {
            case 'name':
                return animal.name || '-';
            case 'uniqueId':
                return animal.uniqueId;
            case 'gender':
                if (animal.gender === 'MALE') return '수컷';
                if (animal.gender === 'FEMALE') return '암컷';
                return '미구분';
            case 'acquisitionType':
                if (animal.acquisitionType === 'ADOPTION') return '입양';
                if (animal.acquisitionType === 'HATCHING') return '해칭';
                return '미상';
            case 'acquisitionDate':
                return format(new Date(animal.acquisitionDate), 'yyyy.MM.dd');
            case 'hatchDate':
                return animal.hatchDate ? format(new Date(animal.hatchDate), 'yyyy.MM.dd') : '-';
            case 'species':
                return speciesCode?.code.name || '-';
            case 'morph':
                return primaryMorphCode?.code.name || '-';
            case 'comboMorph':
                return comboMorphCodes.length > 0 ? comboMorphCodes.map((c) => c.code.name).join(', ') : '-';
            case 'trait':
                return traitCodes.length > 0 ? traitCodes.map((c) => c.code.name).join(', ') : '-';
            case 'color':
                return colorCodes.length > 0 ? colorCodes.map((c) => c.code.name).join(', ') : '-';
            case 'currentSize':
                return animal.detail?.currentSize || '-';
            case 'tailStatus':
                return animal.detail?.tailStatus || '-';
            case 'patternType':
                return animal.detail?.patternType || '-';
            case 'quality':
                return animal.detail?.quality || '-';
            case 'healthStatus':
                return animal.detail?.healthStatus || '-';
            case 'isMating':
                return animal.detail?.isMating ? '프루븐' : '-';
            case 'cageInfo':
                return animal.detail?.cageInfo || '-';
            case 'flooringInfo':
                return animal.detail?.flooringInfo || '-';
            case 'habitatNotes':
                return animal.detail?.habitatNotes || '-';
            case 'fatherName': {
                const father = animal.parents?.find((p) => p.parentType === 'FATHER');
                return father?.parent.name || '-';
            }
            case 'motherName': {
                const mother = animal.parents?.find((p) => p.parentType === 'MOTHER');
                return mother?.parent.name || '-';
            }
            default:
                return '';
        }
    };

    const slots = [0, 1, 2, 3, 4].map((index) =>
        settings.selectedFields[index] ? getFieldValue(settings.selectedFields[index]) : ''
    );

    const OPTIMAL_RATIO = 20 / 50;
    const currentRatio = settings.height / settings.width;
    const isVerticallyLong = currentRatio > OPTIMAL_RATIO;

    const scale = isVerticallyLong ? (settings.width * OPTIMAL_RATIO) / 20 : settings.height / 20;
    const W = settings.width * 8;
    const H = settings.height * 8;
    const contentH = isVerticallyLong ? settings.width * OPTIMAL_RATIO * 8 : H;
    const verticalPadding = isVerticallyLong ? (H - contentH) / 2 : 0;
    const MT = 2 * 8 * scale;
    const ML = 2 * 8 * scale;
    const QR_SIZE = contentH - MT;
    const baseFontSize = settings.fontSize * 1.5 * 1.5 * scale;
    const innerGap = 2 * scale;

    return (
        <div className="relative group">
            <div
                className="bg-white rounded-2xl relative overflow-hidden flex transition-all duration-300 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.15)] border border-gray-100"
                style={{
                    width: `${W}px`,
                    height: `${H}px`,
                    paddingTop: `${MT + verticalPadding}px`,
                    paddingBottom: `${MT + verticalPadding}px`,
                    paddingLeft: `${ML}px`,
                    paddingRight: `${ML / 2}px`,
                }}
            >
                <div className="flex w-full h-full" style={{ gap: `${innerGap * 4}px` }}>
                    <div className="flex-1 flex flex-col justify-between h-full relative z-10 min-w-0">
                        <div className="flex items-center self-center h-[20%]">
                            <div
                                className="font-bold leading-none truncate w-full tracking-wide"
                                style={{ fontSize: `${baseFontSize}px` }}
                            >
                                {slots[0] || '\u00A0'}
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center flex-1 w-full overflow-hidden h-[60%]" style={{ gap: `${innerGap * 5}px` }}>
                            <div
                                className="font-black leading-none tracking-tight truncate w-full flex justify-center"
                                style={{ fontSize: `${baseFontSize}px` }}
                            >
                                {slots[1] || '\u00A0'}
                            </div>
                            <div
                                className="font-bold leading-none tracking-normal truncate w-full flex justify-center"
                                style={{ fontSize: `${baseFontSize}px` }}
                            >
                                {slots[2] || '\u00A0'}
                            </div>
                        </div>

                        <div className="flex items-end justify-center w-full h-[20%]" style={{ gap: `${innerGap * 4 + (settings.width - 50) * 0.5}px` }}>
                            <span
                                className="font-bold leading-none truncate"
                                style={{ fontSize: `${baseFontSize}px` }}
                            >
                                {slots[3] || '\u00A0'}
                            </span>
                            <span
                                className="font-bold leading-none truncate"
                                style={{ fontSize: `${baseFontSize}px` }}
                            >
                                {slots[4] || '\u00A0'}
                            </span>
                        </div>
                    </div>
                    <div
                        className="flex-shrink-0 flex items-center justify-center self-center"
                        style={{
                            width: `${QR_SIZE}px`,
                            height: `${QR_SIZE}px`,
                        }}
                    >
                        <div className="w-full h-full flex items-center justify-center bg-white relative rounded-sm overflow-hidden">
                            {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" className="w-full h-full object-contain" />}
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute -top-6 left-0 right-0 text-center">
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                    {animal.name || animal.uniqueId}
                </span>
            </div>
        </div>
    );
}
