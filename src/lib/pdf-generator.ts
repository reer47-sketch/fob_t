import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { SalesAnimalForPdf } from '@/services/sales-service'

/**
 * PDF 좌표 및 스타일 설정
 * PDF 좌표계: 좌하단이 (0, 0)
 * A4 세로: 595 x 842 포인트
 */
const PDF_CONFIG = {
  fontSize: 8,
  lineHeight: 10,
  color: rgb(0, 0, 0),
  debugMode: false, // true로 설정하면 좌표 그리드와 라벨 표시
  maxAddressLength: 64, // 주소 한 줄 최대 글자 수
  maxFieldLength: 15, // 일반 필드(용도, 양도사유) 한 줄 최대 글자 수
  maxScientificNameLength: 30, // 학명 한 줄 최대 글자 수 (영어라 더 길게)
  // TODO: 실제 양식을 보고 좌표 조정 필요
  positions: {
    // 양도인 정보 (Tenant)
    sellerName: { x: 177, y: 677, label: '양도인 성명(Tenant)' },
    sellerAddress: { x: 157, y: 649, label: '양도인 주소' },
    sellerAddressLine2: { x: 157, y: 639, label: '양도인 주소2' },
    sellerPhone: { x: 415, y: 677, label: '양도인 전화' },

    // 양수인 정보
    buyerName: { x: 177, y: 619, label: '양수인 성명' },
    buyerAddress: { x: 157, y: 589, label: '양수인 주소' },
    buyerAddressLine2: { x: 157, y: 579, label: '양수인 주소2' },
    buyerPhone: { x: 415, y: 619, label: '양수인 전화' },

    // 개체 정보 (왼쪽정렬 - 2줄용)
    scientificName: { x: 125, y: 534, label: '학명' },
    scientificNameLine2: { x: 125, y: 524, label: '학명2' },
    // 개체 정보 (중앙정렬 - 1줄용)
    scientificNameCenter: { x: 125, y: 530, label: '학명(중앙)' },
    quantity: { x: 270, y: 530, label: '수량' },

    // 양도 정보 (왼쪽정렬 - 2줄용)
    transferPurpose: { x: 303, y: 534, label: '용도' },
    transferPurposeLine2: { x: 303, y: 524, label: '용도2' },
    // 양도 정보 (중앙정렬 - 1줄용)
    transferPurposeCenter: { x: 303, y: 530, label: '용도(중앙)' },

    transferReason: { x: 421, y: 534, label: '양도사유' },
    transferReasonLine2: { x: 421, y: 524, label: '양도사유2' },
    // 양도 사유 (중앙정렬 - 1줄용)
    transferReasonCenter: { x: 421, y: 530, label: '양도사유(중앙)' },

    // 체크박스 (양수/양도 구분)
    checkYangsu1: { x: 273, y: 745, label: '양수 체크1' },
    checkYangsu2: { x: 317, y: 395, label: '양수 체크2' },
    checkYangdo1: { x: 210, y: 745, label: '양도 체크1' },
    checkYangdo2: { x: 262, y: 395, label: '양도 체크2' },

    // 신고인 (User)
    reporterName: { x: 350, y: 365, label: '신고인' },

    // 분양일
    adoptionYear: { x: 440, y: 381, label: '' },
    adoptionMonth: { x: 480, y: 381, label: '' },
    adoptionDay: { x: 508, y: 381, label: '' },
  }
}

/**
 * 텍스트를 적절한 길이로 나누기 (2줄 처리용)
 * 주소, 학명, 용도, 양도사유 등에 사용
 */
function splitText(text: string, maxLength: number): [string, string] {
  if (text.length <= maxLength) {
    return [text, '']
  }

  // 공백으로 단어 분리
  const words = text.split(' ')
  let line1 = ''
  let line2 = ''

  for (const word of words) {
    if (line1.length === 0) {
      line1 = word
    } else if ((line1 + ' ' + word).length <= maxLength) {
      line1 += ' ' + word
    } else {
      // 나머지는 2번째 줄로
      if (line2.length === 0) {
        line2 = word
      } else {
        line2 += ' ' + word
      }
    }
  }

  return [line1, line2]
}

/**
 * 디버그용 그리드 및 좌표 표시
 */
function drawDebugGrid(page: any, font: any) {
  const { width, height } = page.getSize()

  // 50pt 간격으로 세로선
  for (let x = 0; x <= width; x += 50) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: x % 100 === 0 ? 0.5 : 0.2,
      color: rgb(0.8, 0.8, 0.8),
    })

    // 100pt마다 좌표 표시
    if (x % 100 === 0) {
      page.drawText(`${x}`, {
        x: x + 2,
        y: height - 20,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      })
    }
  }

  // 50pt 간격으로 가로선
  for (let y = 0; y <= height; y += 50) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: y % 100 === 0 ? 0.5 : 0.2,
      color: rgb(0.8, 0.8, 0.8),
    })

    // 100pt마다 좌표 표시
    if (y % 100 === 0) {
      page.drawText(`${y}`, {
        x: 5,
        y: y + 2,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      })
    }
  }

  // 각 필드 위치에 빨간 점과 라벨 표시
  Object.entries(PDF_CONFIG.positions).forEach(([key, pos]: [string, any]) => {
    // 빨간 원 그리기
    page.drawCircle({
      x: pos.x,
      y: pos.y,
      size: 3,
      color: rgb(1, 0, 0),
    })

    // 라벨 표시 (배경 포함)
    const labelWidth = font.widthOfTextAtSize(pos.label, 8)
    page.drawRectangle({
      x: pos.x + 5,
      y: pos.y - 3,
      width: labelWidth + 4,
      height: 12,
      color: rgb(1, 1, 0.8),
      opacity: 0.9,
    })

    page.drawText(pos.label, {
      x: pos.x + 7,
      y: pos.y,
      size: 8,
      font,
      color: rgb(1, 0, 0),
    })
  })
}

/**
 * 양수양도 신고서 PDF 생성
 */
export type PdfReportType = 'yangsu' | 'yangdo'

export async function generateYangsuYangdoPdf(animals: SalesAnimalForPdf[], type: PdfReportType = 'yangdo'): Promise<Blob> {
  try {
    // 1. 기존 PDF 양식 로드
    const templateResponse = await fetch('/templates/yangsu-yangdo-form.pdf')
    const templateBytes = await templateResponse.arrayBuffer()
    const pdfDoc = await PDFDocument.load(templateBytes)

    // 2. 한글 폰트 로드
    pdfDoc.registerFontkit(fontkit)
    const fontResponse = await fetch('/fonts/NotoSansKR-Regular.ttf')
    const fontBytes = await fontResponse.arrayBuffer()
    const koreanFont = await pdfDoc.embedFont(fontBytes)

    // 기존 템플릿 페이지 제거 (빈 페이지일 경우)
    const pageCount = pdfDoc.getPageCount()
    if (pageCount > 0) {
      pdfDoc.removePage(0)
    }

    // 3. 각 개체당 1페이지씩 생성
    for (const animal of animals) {
      // 템플릿 로드 (매번 새로 로드)
      const templateDoc = await PDFDocument.load(templateBytes)
      const [templatePage] = await pdfDoc.copyPages(templateDoc, [0])
      const page = pdfDoc.addPage(templatePage)

      const { width, height } = page.getSize()

      // 4. 양도인 정보 (판매자)
      page.drawText(animal.seller.name || '', {
        x: PDF_CONFIG.positions.sellerName.x,
        y: PDF_CONFIG.positions.sellerName.y,
        size: PDF_CONFIG.fontSize,
        font: koreanFont,
        color: PDF_CONFIG.color,
      })

      // 양도인 주소 (2줄 처리)
      const [sellerAddr1, sellerAddr2] = splitText(animal.seller.address || '주소 없음', PDF_CONFIG.maxAddressLength)
      page.drawText(sellerAddr1, {
        x: PDF_CONFIG.positions.sellerAddress.x,
        y: PDF_CONFIG.positions.sellerAddress.y,
        size: PDF_CONFIG.fontSize,
        font: koreanFont,
        color: PDF_CONFIG.color,
      })
      if (sellerAddr2) {
        page.drawText(sellerAddr2, {
          x: PDF_CONFIG.positions.sellerAddressLine2.x,
          y: PDF_CONFIG.positions.sellerAddressLine2.y,
          size: PDF_CONFIG.fontSize,
          font: koreanFont,
          color: PDF_CONFIG.color,
        })
      }

      page.drawText(animal.seller.phone || '', {
        x: PDF_CONFIG.positions.sellerPhone.x,
        y: PDF_CONFIG.positions.sellerPhone.y,
        size: PDF_CONFIG.fontSize,
        font: koreanFont,
        color: PDF_CONFIG.color,
      })

      // 5. 양수인 정보 (구매자)
      page.drawText(animal.buyer.name || '', {
        x: PDF_CONFIG.positions.buyerName.x,
        y: PDF_CONFIG.positions.buyerName.y,
        size: PDF_CONFIG.fontSize,
        font: koreanFont,
        color: PDF_CONFIG.color,
      })

      // 양수인 주소 (2줄 처리)
      const [buyerAddr1, buyerAddr2] = splitText(animal.buyer.address || '주소 없음', PDF_CONFIG.maxAddressLength)
      page.drawText(buyerAddr1, {
        x: PDF_CONFIG.positions.buyerAddress.x,
        y: PDF_CONFIG.positions.buyerAddress.y,
        size: PDF_CONFIG.fontSize,
        font: koreanFont,
        color: PDF_CONFIG.color,
      })
      if (buyerAddr2) {
        page.drawText(buyerAddr2, {
          x: PDF_CONFIG.positions.buyerAddressLine2.x,
          y: PDF_CONFIG.positions.buyerAddressLine2.y,
          size: PDF_CONFIG.fontSize,
          font: koreanFont,
          color: PDF_CONFIG.color,
        })
      }

      page.drawText(animal.buyer.phone || '', {
        x: PDF_CONFIG.positions.buyerPhone.x,
        y: PDF_CONFIG.positions.buyerPhone.y,
        size: PDF_CONFIG.fontSize,
        font: koreanFont,
        color: PDF_CONFIG.color,
      })

      // 6. 학명 (길이에 따라 중앙정렬 또는 2줄 처리)
      const scientificNameText = animal.scientificName || ''
      if (scientificNameText.length <= PDF_CONFIG.maxScientificNameLength) {
        // 짧은 경우: 중앙정렬
        page.drawText(scientificNameText, {
          x: PDF_CONFIG.positions.scientificNameCenter.x,
          y: PDF_CONFIG.positions.scientificNameCenter.y,
          size: PDF_CONFIG.fontSize,
          font: koreanFont,
          color: PDF_CONFIG.color,
        })
      } else {
        // 긴 경우: 2줄 처리
        const [scientificName1, scientificName2] = splitText(scientificNameText, PDF_CONFIG.maxScientificNameLength)
        page.drawText(scientificName1, {
          x: PDF_CONFIG.positions.scientificName.x,
          y: PDF_CONFIG.positions.scientificName.y,
          size: PDF_CONFIG.fontSize,
          font: koreanFont,
          color: PDF_CONFIG.color,
        })
        if (scientificName2) {
          page.drawText(scientificName2, {
            x: PDF_CONFIG.positions.scientificNameLine2.x,
            y: PDF_CONFIG.positions.scientificNameLine2.y,
            size: PDF_CONFIG.fontSize,
            font: koreanFont,
            color: PDF_CONFIG.color,
          })
        }
      }

      // 7. 수량 (무조건 1)
      page.drawText('1', {
        x: PDF_CONFIG.positions.quantity.x,
        y: PDF_CONFIG.positions.quantity.y,
        size: PDF_CONFIG.fontSize,
        font: koreanFont,
        color: PDF_CONFIG.color,
      })

      // 8. 양도 용도 (길이에 따라 중앙정렬 또는 2줄 처리)
      const transferPurposeText = animal.transferPurpose || ''
      if (transferPurposeText.length <= PDF_CONFIG.maxFieldLength) {
        // 짧은 경우: 중앙정렬
        page.drawText(transferPurposeText, {
          x: PDF_CONFIG.positions.transferPurposeCenter.x,
          y: PDF_CONFIG.positions.transferPurposeCenter.y,
          size: PDF_CONFIG.fontSize,
          font: koreanFont,
          color: PDF_CONFIG.color,
        })
      } else {
        // 긴 경우: 2줄 처리
        const [transferPurpose1, transferPurpose2] = splitText(transferPurposeText, PDF_CONFIG.maxFieldLength)
        page.drawText(transferPurpose1, {
          x: PDF_CONFIG.positions.transferPurpose.x,
          y: PDF_CONFIG.positions.transferPurpose.y,
          size: PDF_CONFIG.fontSize,
          font: koreanFont,
          color: PDF_CONFIG.color,
        })
        if (transferPurpose2) {
          page.drawText(transferPurpose2, {
            x: PDF_CONFIG.positions.transferPurposeLine2.x,
            y: PDF_CONFIG.positions.transferPurposeLine2.y,
            size: PDF_CONFIG.fontSize,
            font: koreanFont,
            color: PDF_CONFIG.color,
          })
        }
      }

      // 9. 양도 사유 (길이에 따라 중앙정렬 또는 2줄 처리)
      const transferReasonText = animal.transferReason || ''
      if (transferReasonText.length <= PDF_CONFIG.maxFieldLength) {
        // 짧은 경우: 중앙정렬
        page.drawText(transferReasonText, {
          x: PDF_CONFIG.positions.transferReasonCenter.x,
          y: PDF_CONFIG.positions.transferReasonCenter.y,
          size: PDF_CONFIG.fontSize,
          font: koreanFont,
          color: PDF_CONFIG.color,
        })
      } else {
        // 긴 경우: 2줄 처리
        const [transferReason1, transferReason2] = splitText(transferReasonText, PDF_CONFIG.maxFieldLength)
        page.drawText(transferReason1, {
          x: PDF_CONFIG.positions.transferReason.x,
          y: PDF_CONFIG.positions.transferReason.y,
          size: PDF_CONFIG.fontSize,
          font: koreanFont,
          color: PDF_CONFIG.color,
        })
        if (transferReason2) {
          page.drawText(transferReason2, {
            x: PDF_CONFIG.positions.transferReasonLine2.x,
            y: PDF_CONFIG.positions.transferReasonLine2.y,
            size: PDF_CONFIG.fontSize,
            font: koreanFont,
            color: PDF_CONFIG.color,
          })
        }
      }

      // 10. 양수/양도 체크박스
      const checkPositions = type === 'yangsu'
        ? [PDF_CONFIG.positions.checkYangsu1, PDF_CONFIG.positions.checkYangsu2]
        : [PDF_CONFIG.positions.checkYangdo1, PDF_CONFIG.positions.checkYangdo2]
      for (const checkPos of checkPositions) {
        page.drawText('✓', {
          x: checkPos.x,
          y: checkPos.y,
          size: 12,
          font: koreanFont,
          color: PDF_CONFIG.color,
        })
      }

      // 11. 신고인 (양도: User 이름, 양수: 고객 이름)
      const reporterName = type === 'yangsu'
        ? animal.buyer.name
        : animal.seller.reporterName
      page.drawText(reporterName || '', {
        x: PDF_CONFIG.positions.reporterName.x,
        y: PDF_CONFIG.positions.reporterName.y,
        size: PDF_CONFIG.fontSize,
        font: koreanFont,
        color: PDF_CONFIG.color,
      })

      // 11. 분양일 (년, 월, 일 따로)
      const adoptionDate = new Date(animal.adoptionDate)
      page.drawText(String(adoptionDate.getFullYear()), {
        x: PDF_CONFIG.positions.adoptionYear.x,
        y: PDF_CONFIG.positions.adoptionYear.y,
        size: PDF_CONFIG.fontSize,
        font: koreanFont,
        color: PDF_CONFIG.color,
      })

      page.drawText(String(adoptionDate.getMonth() + 1), {
        x: PDF_CONFIG.positions.adoptionMonth.x,
        y: PDF_CONFIG.positions.adoptionMonth.y,
        size: PDF_CONFIG.fontSize,
        font: koreanFont,
        color: PDF_CONFIG.color,
      })

      page.drawText(String(adoptionDate.getDate()), {
        x: PDF_CONFIG.positions.adoptionDay.x,
        y: PDF_CONFIG.positions.adoptionDay.y,
        size: PDF_CONFIG.fontSize,
        font: koreanFont,
        color: PDF_CONFIG.color,
      })

      // 디버그 모드: 그리드 및 좌표 표시
      if (PDF_CONFIG.debugMode) {
        drawDebugGrid(page, koreanFont)
      }
    }

    // 13. PDF 저장
    const pdfBytes = await pdfDoc.save()
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    throw new Error('PDF 생성 중 오류가 발생했습니다')
  }
}

/**
 * 퀵 신고서용 수동 입력 데이터 타입
 */
export interface QuickReportFormData {
  type: 'yangsu' | 'yangdo' | 'both'
  seller: { name: string; address: string; phone: string }
  buyer: { name: string; address: string; phone: string }
  scientificName: string
  quantity: number
  transferPurpose: string
  transferReason: string
  reporterName: string
  adoptionDate: Date
}

/**
 * 퀵 신고서 PDF 생성 (DB 연동 없이 수동 입력 데이터로 생성)
 */
export async function generateQuickReportPdf(form: QuickReportFormData): Promise<Blob> {
  try {
    const templateResponse = await fetch('/templates/yangsu-yangdo-form.pdf')
    const templateBytes = await templateResponse.arrayBuffer()
    const pdfDoc = await PDFDocument.load(templateBytes)

    pdfDoc.registerFontkit(fontkit)
    const fontResponse = await fetch('/fonts/NotoSansKR-Regular.ttf')
    const fontBytes = await fontResponse.arrayBuffer()
    const koreanFont = await pdfDoc.embedFont(fontBytes)

    const pageCount = pdfDoc.getPageCount()
    if (pageCount > 0) {
      pdfDoc.removePage(0)
    }

    const reportTypes: PdfReportType[] =
      form.type === 'both' ? ['yangsu', 'yangdo'] : [form.type]

    for (const type of reportTypes) {
      const templateDoc = await PDFDocument.load(templateBytes)
      const [templatePage] = await pdfDoc.copyPages(templateDoc, [0])
      const page = pdfDoc.addPage(templatePage)

      // 양도인 정보
      page.drawText(form.seller.name || '', {
        x: PDF_CONFIG.positions.sellerName.x,
        y: PDF_CONFIG.positions.sellerName.y,
        size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
      })
      const [sellerAddr1, sellerAddr2] = splitText(form.seller.address || '', PDF_CONFIG.maxAddressLength)
      page.drawText(sellerAddr1, {
        x: PDF_CONFIG.positions.sellerAddress.x,
        y: PDF_CONFIG.positions.sellerAddress.y,
        size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
      })
      if (sellerAddr2) {
        page.drawText(sellerAddr2, {
          x: PDF_CONFIG.positions.sellerAddressLine2.x,
          y: PDF_CONFIG.positions.sellerAddressLine2.y,
          size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
        })
      }
      page.drawText(form.seller.phone || '', {
        x: PDF_CONFIG.positions.sellerPhone.x,
        y: PDF_CONFIG.positions.sellerPhone.y,
        size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
      })

      // 양수인 정보
      page.drawText(form.buyer.name || '', {
        x: PDF_CONFIG.positions.buyerName.x,
        y: PDF_CONFIG.positions.buyerName.y,
        size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
      })
      const [buyerAddr1, buyerAddr2] = splitText(form.buyer.address || '', PDF_CONFIG.maxAddressLength)
      page.drawText(buyerAddr1, {
        x: PDF_CONFIG.positions.buyerAddress.x,
        y: PDF_CONFIG.positions.buyerAddress.y,
        size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
      })
      if (buyerAddr2) {
        page.drawText(buyerAddr2, {
          x: PDF_CONFIG.positions.buyerAddressLine2.x,
          y: PDF_CONFIG.positions.buyerAddressLine2.y,
          size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
        })
      }
      page.drawText(form.buyer.phone || '', {
        x: PDF_CONFIG.positions.buyerPhone.x,
        y: PDF_CONFIG.positions.buyerPhone.y,
        size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
      })

      // 학명
      const sciName = form.scientificName || ''
      if (sciName.length <= PDF_CONFIG.maxScientificNameLength) {
        page.drawText(sciName, {
          x: PDF_CONFIG.positions.scientificNameCenter.x,
          y: PDF_CONFIG.positions.scientificNameCenter.y,
          size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
        })
      } else {
        const [sci1, sci2] = splitText(sciName, PDF_CONFIG.maxScientificNameLength)
        page.drawText(sci1, {
          x: PDF_CONFIG.positions.scientificName.x,
          y: PDF_CONFIG.positions.scientificName.y,
          size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
        })
        if (sci2) {
          page.drawText(sci2, {
            x: PDF_CONFIG.positions.scientificNameLine2.x,
            y: PDF_CONFIG.positions.scientificNameLine2.y,
            size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
          })
        }
      }

      // 수량
      page.drawText(String(form.quantity), {
        x: PDF_CONFIG.positions.quantity.x,
        y: PDF_CONFIG.positions.quantity.y,
        size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
      })

      // 용도
      const purposeText = form.transferPurpose || ''
      if (purposeText.length <= PDF_CONFIG.maxFieldLength) {
        page.drawText(purposeText, {
          x: PDF_CONFIG.positions.transferPurposeCenter.x,
          y: PDF_CONFIG.positions.transferPurposeCenter.y,
          size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
        })
      } else {
        const [p1, p2] = splitText(purposeText, PDF_CONFIG.maxFieldLength)
        page.drawText(p1, {
          x: PDF_CONFIG.positions.transferPurpose.x,
          y: PDF_CONFIG.positions.transferPurpose.y,
          size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
        })
        if (p2) {
          page.drawText(p2, {
            x: PDF_CONFIG.positions.transferPurposeLine2.x,
            y: PDF_CONFIG.positions.transferPurposeLine2.y,
            size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
          })
        }
      }

      // 양도사유
      const reasonText = form.transferReason || ''
      if (reasonText.length <= PDF_CONFIG.maxFieldLength) {
        page.drawText(reasonText, {
          x: PDF_CONFIG.positions.transferReasonCenter.x,
          y: PDF_CONFIG.positions.transferReasonCenter.y,
          size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
        })
      } else {
        const [r1, r2] = splitText(reasonText, PDF_CONFIG.maxFieldLength)
        page.drawText(r1, {
          x: PDF_CONFIG.positions.transferReason.x,
          y: PDF_CONFIG.positions.transferReason.y,
          size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
        })
        if (r2) {
          page.drawText(r2, {
            x: PDF_CONFIG.positions.transferReasonLine2.x,
            y: PDF_CONFIG.positions.transferReasonLine2.y,
            size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
          })
        }
      }

      // 체크박스
      const checkPositions = type === 'yangsu'
        ? [PDF_CONFIG.positions.checkYangsu1, PDF_CONFIG.positions.checkYangsu2]
        : [PDF_CONFIG.positions.checkYangdo1, PDF_CONFIG.positions.checkYangdo2]
      for (const checkPos of checkPositions) {
        page.drawText('✓', {
          x: checkPos.x, y: checkPos.y,
          size: 12, font: koreanFont, color: PDF_CONFIG.color,
        })
      }

      // 신고인
      page.drawText(form.reporterName || '', {
        x: PDF_CONFIG.positions.reporterName.x,
        y: PDF_CONFIG.positions.reporterName.y,
        size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
      })

      // 분양일
      const adoptionDate = new Date(form.adoptionDate)
      page.drawText(String(adoptionDate.getFullYear()), {
        x: PDF_CONFIG.positions.adoptionYear.x,
        y: PDF_CONFIG.positions.adoptionYear.y,
        size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
      })
      page.drawText(String(adoptionDate.getMonth() + 1), {
        x: PDF_CONFIG.positions.adoptionMonth.x,
        y: PDF_CONFIG.positions.adoptionMonth.y,
        size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
      })
      page.drawText(String(adoptionDate.getDate()), {
        x: PDF_CONFIG.positions.adoptionDay.x,
        y: PDF_CONFIG.positions.adoptionDay.y,
        size: PDF_CONFIG.fontSize, font: koreanFont, color: PDF_CONFIG.color,
      })

      if (PDF_CONFIG.debugMode) {
        drawDebugGrid(page, koreanFont)
      }
    }

    const pdfBytes = await pdfDoc.save()
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
  } catch (error) {
    console.error('퀵 신고서 PDF 생성 실패:', error)
    throw new Error('PDF 생성 중 오류가 발생했습니다')
  }
}

/**
 * PDF 다운로드 트리거
 */
export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
