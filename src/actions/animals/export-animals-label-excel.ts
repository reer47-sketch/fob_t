'use server'

import { getAnimalsSchema, type GetAnimalsInput } from './schemas'
import { getAnimalsForExportService } from '@/services/animal-service'
import { getCurrentUserService } from '@/services/auth-service'
import * as XLSX from 'xlsx'

export type ExportAnimalsLabelExcelResponse =
  | { success: true; data: { buffer: number[]; filename: string } }
  | { success: false; error: string }

/**
 * 개체 라벨지용 엑셀 다운로드 Server Action
 * 라벨 인쇄에 필요한 간소화된 정보만 포함
 */
export async function exportAnimalsLabelExcel(
  input: Omit<GetAnimalsInput, 'page' | 'pageSize'>
): Promise<ExportAnimalsLabelExcelResponse> {
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

    // 3. 전체 데이터 조회 (엑셀용 - 부모 정보 포함)
    const result = await getAnimalsForExportService(validated, tenantId)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    // 4. 라벨지용 엑셀 데이터 생성 (간소화된 정보)
    const excelData = result.data.animals.map((animal) => {
      // 종 정보
      const species = animal.codes.find((c) => c.code.category === 'SPECIES')
      // 모프 정보
      const morphs = animal.codes
        .filter((c) => c.code.category === 'MORPH')
        .map((c) => c.code.name)
        .join(', ')

      // 부(아버지) 정보 - 여러 개일 경우 ,로 구분
      const fathers = animal.parents
        .filter((p) => p.parentType === 'FATHER')
        .map((p) => p.parent.name || '이름없음')
        .join(', ')

      // 모(어머니) 정보 - 여러 개일 경우 ,로 구분
      const mothers = animal.parents
        .filter((p) => p.parentType === 'MOTHER')
        .map((p) => p.parent.name || '이름없음')
        .join(', ')

      // QR 코드 URL - DB에 저장된 값 사용
      const qrcodeUrl = animal.qrCodeUrl || ''

      return {
        고유개체ID: animal.uniqueId,
        개체명: animal.name || '',
        성별: animal.gender === 'MALE' ? '수컷' : animal.gender === 'FEMALE' ? '암컷' : '미구분',
        종: species?.code.name || '',
        모프: morphs || '',
        해칭일: animal.hatchDate
          ? new Date(animal.hatchDate).toLocaleDateString('ko-KR')
          : '',
        '부 이름': fathers || '',
        '모 이름': mothers || '',
        'QR코드 URL': `${process.env.NEXT_PUBLIC_SITE_URL}${qrcodeUrl}`,
      }
    })

    // 5. 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '라벨목록')

    // 6. 버퍼 생성
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // 7. 파일명 생성 (현재 날짜 포함)
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const filename = `개체라벨_${dateStr}.xlsx`

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
    console.error('exportAnimalsLabelExcel error:', error)
    return { success: false, error: '엑셀 다운로드 중 오류가 발생했습니다.' }
  }
}
