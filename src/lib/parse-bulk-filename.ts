import { AcquisitionType, Gender } from '@prisma/client'

export interface ParsedAnimalFile {
  /** 원본 파일 */
  file: File
  /** 파싱된 이름 (빈값이면 null) */
  name: string | null
  /** 성별 */
  gender: Gender | null
  /** 해칭일 (YYYYMMDD -> Date) */
  hatchDate: Date | null
  /** 종 코드 (예: CG) */
  speciesCode: string | null
  /** 모프 코드 (예: HQ) */
  morphCode: string | null
  /** 등록유형 (A: 입양, H: 해칭) */
  acquisitionType: AcquisitionType | null
  /** 파싱 에러 목록 */
  errors: string[]
  /** 경고 목록 */
  warnings: string[]
}

const GENDER_MAP: Record<string, Gender> = {
  'M': Gender.MALE,
  'm': Gender.MALE,
  'F': Gender.FEMALE,
  'f': Gender.FEMALE,
  'U': Gender.UNKNOWN,
  'u': Gender.UNKNOWN,
}

const ACQUISITION_TYPE_MAP: Record<string, AcquisitionType> = {
  'A': AcquisitionType.ADOPTION,
  'a': AcquisitionType.ADOPTION,
  'H': AcquisitionType.HATCHING,
  'h': AcquisitionType.HATCHING,
}

/**
 * 파일명 규칙: {이름}_{성별}_{해칭일}_{종코드}_{모프코드}_{등록유형}.확장자
 * 빈 필드는 비워둠 (예: _F__CG_HQ_A.jpg)
 * 등록유형: A(입양), H(해칭)
 */
export function parseBulkFilename(file: File): ParsedAnimalFile {
  const errors: string[] = []
  const warnings: string[] = []

  // 확장자 제거
  const nameWithoutExt = file.name.replace(/\.[^.]+$/, '')

  // _로 split (정확히 6개 필드)
  const parts = nameWithoutExt.split('_')

  if (parts.length !== 6) {
    errors.push(`파일명 형식 오류: _ 구분자로 6개 필드가 필요합니다 (현재 ${parts.length}개)`)
    return {
      file,
      name: null,
      gender: null,
      hatchDate: null,
      speciesCode: null,
      morphCode: null,
      acquisitionType: null,
      errors,
      warnings,
    }
  }

  const [rawName, rawGender, rawHatchDate, rawSpecies, rawMorph, rawAcquisitionType] = parts

  // 1. 이름 (선택)
  const name = rawName.trim() || null
  if (!name) {
    warnings.push('이름이 비어있습니다')
  }

  // 2. 성별 (필수)
  let gender: Gender | null = null
  if (rawGender.trim()) {
    gender = GENDER_MAP[rawGender.trim()] ?? null
    if (!gender) {
      errors.push(`성별 인식 불가: "${rawGender}" (M/F/U 사용)`)
    }
  } else {
    errors.push('성별이 비어있습니다 (M/F/U 필수)')
  }

  // 3. 해칭일 (선택)
  let hatchDate: Date | null = null
  if (rawHatchDate.trim()) {
    const dateStr = rawHatchDate.trim()
    if (/^\d{8}$/.test(dateStr)) {
      const year = parseInt(dateStr.substring(0, 4))
      const month = parseInt(dateStr.substring(4, 6)) - 1
      const day = parseInt(dateStr.substring(6, 8))
      const date = new Date(year, month, day)
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        hatchDate = date
      } else {
        errors.push(`날짜 형식 오류: "${dateStr}" (YYYYMMDD)`)
      }
    } else {
      errors.push(`날짜 형식 오류: "${dateStr}" (YYYYMMDD)`)
    }
  }

  // 4. 종 코드 (필수)
  const speciesCode = rawSpecies.trim().toUpperCase() || null
  if (!speciesCode) {
    errors.push('종 코드가 비어있습니다')
  }

  // 5. 모프 코드 (필수)
  const morphCode = rawMorph.trim().toUpperCase() || null
  if (!morphCode) {
    errors.push('모프 코드가 비어있습니다')
  }

  // 6. 등록유형 (필수)
  let acquisitionType: AcquisitionType | null = null
  if (rawAcquisitionType.trim()) {
    acquisitionType = ACQUISITION_TYPE_MAP[rawAcquisitionType.trim()] ?? null
    if (!acquisitionType) {
      errors.push(`등록유형 인식 불가: "${rawAcquisitionType}" (A: 입양 / H: 해칭)`)
    }
  } else {
    errors.push('등록유형이 비어있습니다 (A: 입양 / H: 해칭)')
  }

  return {
    file,
    name,
    gender,
    hatchDate,
    speciesCode,
    morphCode,
    acquisitionType,
    errors,
    warnings,
  }
}

/**
 * 이미지 파일인지 확인
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}
