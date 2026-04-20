/**
 * 고객용 일괄등록 파일명 파서
 *
 * 파일명 규칙: {모프코드}_{해칭일}.확장자
 *   - 모프코드 (필수): 코드표 기준 매칭
 *   - 해칭일 (선택): YYYYMMDD 형식일 때만 파싱. 날짜 형식이 아니면 무시
 *
 * 예시:
 *   HQ_20250301.jpg  → morphCode=HQ, hatchDate=2025-03-01
 *   HQ_1.png         → morphCode=HQ, hatchDate=null (숫자가 날짜 형식이 아니므로 무시)
 *   HQ.png           → morphCode=HQ, hatchDate=null (필드 1개)
 */

export interface ParsedClientBulkFile {
  file: File
  morphCode: string | null
  hatchDate: Date | null
  errors: string[]
  warnings: string[]
}

export function parseClientBulkFilename(file: File): ParsedClientBulkFile {
  const errors: string[] = []
  const warnings: string[] = []

  const nameWithoutExt = file.name.replace(/\.[^.]+$/, '')
  const parts = nameWithoutExt.split('_')

  // 모프코드 (첫 번째 필드, 필수)
  const morphCode = parts[0]?.trim().toUpperCase() || null
  if (!morphCode) {
    errors.push('모프 코드가 비어있습니다')
  }

  // 해칭일 (두 번째 필드, 선택 — YYYYMMDD일 때만 파싱)
  let hatchDate: Date | null = null
  if (parts.length >= 2) {
    const raw = parts[1]?.trim()
    if (raw && /^\d{8}$/.test(raw)) {
      const year = parseInt(raw.substring(0, 4))
      const month = parseInt(raw.substring(4, 6)) - 1
      const day = parseInt(raw.substring(6, 8))
      const date = new Date(year, month, day)

      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        hatchDate = date
      } else {
        warnings.push(`날짜 형식이 유효하지 않아 무시됨: "${raw}"`)
      }
    }
    // 날짜 형식이 아니면 (예: "1", "2") 조용히 무시
  }

  return {
    file,
    morphCode,
    hatchDate,
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
