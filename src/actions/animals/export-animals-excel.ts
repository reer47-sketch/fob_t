'use server'

import { getAnimalsSchema, type GetAnimalsInput } from './schemas'
import { getAnimalsForExportService } from '@/services/animal-service'
import { getCurrentUserService } from '@/services/auth-service'
import * as XLSX from 'xlsx'

export type ExportAnimalsExcelResponse =
  | { success: true; data: { buffer: number[]; filename: string } }
  | { success: false; error: string }

/**
 * 개체 목록 엑셀 다운로드 Server Action
 * 페이징 없이 전체 데이터를 다운로드
 */
export async function exportAnimalsExcel(
  input: Omit<GetAnimalsInput, 'page' | 'pageSize'>
): Promise<ExportAnimalsExcelResponse> {
  try {
    // 1. Authorization - 현재 사용자 확인
    const userResult = await getCurrentUserService()
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = userResult.data

    // BREEDER는 자신의 tenant만, ADMIN은 모든 tenant 조회 가능
    if (user.role === 'BREEDER' && !user.tenantId) {
      return { success: false, error: 'Tenant not found' }
    }

    const tenantId = user.tenantId!

    // 2. Validation - 페이징 없이 전체 데이터 조회
    const validated = getAnimalsSchema.parse({
      ...input,
      page: 1,
      pageSize: 999999, // 전체 데이터 조회
    })

    // 3. 전체 데이터 조회 (엑셀용)
    const result = await getAnimalsForExportService(validated, tenantId)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    // 4. 엑셀 데이터 생성
    const excelData = result.data.animals.map((animal) => {
      // 종 정보
      const species = animal.codes.find((c) => c.code.category === 'SPECIES')
      // 모프 정보
      const morphs = animal.codes
        .filter((c) => c.code.category === 'MORPH')
        .map((c) => c.code.name)
        .join(', ')
      // 형질 정보
      const traits = animal.codes
        .filter((c) => c.code.category === 'TRAIT')
        .map((c) => c.code.name)
        .join(', ')
      // 색감 정보
      const colors = animal.codes
        .filter((c) => c.code.category === 'COLOR')
        .map((c) => c.code.name)
        .join(', ')

      return {
        고유개체ID: animal.uniqueId,
        개체명: animal.name || '',
        성별: animal.gender === 'MALE' ? '수컷' : animal.gender === 'FEMALE' ? '암컷' : '미구분',
        종: species?.code.name || '',
        모프: morphs || '',
        형질: traits || '',
        색감: colors || '',
        '입양/해칭': animal.acquisitionType === 'HATCHING' ? '해칭' : '입양',
        '입양/해칭일': animal.acquisitionDate
          ? new Date(animal.acquisitionDate).toLocaleDateString('ko-KR')
          : '',
        프루븐: animal.detail?.isMating ? 'Y' : 'N',
        브리딩대상: animal.isBreeding ? 'Y' : 'N',
        공개여부: animal.isPublic ? '공개' : '비공개',
        등급: animal.detail?.quality || '',
        크기: animal.detail?.currentSize || '',
        꼬리상태: animal.detail?.tailStatus || '',
        패턴: animal.detail?.patternType || '',
        특이사항: animal.detail?.distinctiveMarks || '',
        건강상태: animal.detail?.healthStatus || '',
        특별관리: animal.detail?.specialNeeds || '',
        등록일: new Date(animal.createdAt).toLocaleDateString('ko-KR'),
      }
    })

    // 5. 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '개체목록')

    // 6. 버퍼 생성
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // 7. 파일명 생성 (현재 날짜 포함)
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const filename = `개체목록_${dateStr}.xlsx`

    // ArrayBuffer를 number[] 배열로 변환
    const numberArray = Array.from(new Uint8Array(buffer))

    return {
      success: true,
      data: {
        buffer: numberArray,
        filename,
      },
    }
  } catch (error) {
    console.error('exportAnimalsExcel error:', error)
    return { success: false, error: '엑셀 다운로드 중 오류가 발생했습니다.' }
  }
}
