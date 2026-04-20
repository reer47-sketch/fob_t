/**
 * 클라이언트 이미지 리사이징 유틸리티
 */

export interface ResizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  type?: 'image/jpeg' | 'image/png' | 'image/webp'
  maxFileSize?: number // 최대 파일 크기 (bytes)
}

const DEFAULT_OPTIONS: Required<ResizeOptions> = {
  maxWidth: 2400,
  maxHeight: 2400,
  quality: 0.92,
  type: 'image/jpeg',
  maxFileSize: 4 * 1024 * 1024, // 4MB
}

/**
 * 이미지 파일을 리사이징합니다.
 * @param file - 원본 이미지 파일
 * @param options - 리사이징 옵션
 * @returns 리사이징된 File 객체
 */
export async function resizeImage(
  file: File,
  options: ResizeOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 이미지가 아니면 원본 반환
  if (!file.type.startsWith('image/')) {
    return file
  }

  // 이미지 로드
  const img = await loadImage(file)

  // 초기 크기 계산
  let { width, height } = img
  if (width > opts.maxWidth || height > opts.maxHeight) {
    const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  // 용량 제한 내로 압축 시도
  let quality = opts.quality
  const minQuality = 0.5
  const qualityStep = 0.1

  while (quality >= minQuality) {
    const result = await compressToFile(img, width, height, quality, opts.type, file.name)

    if (result.size <= opts.maxFileSize) {
      return result
    }

    quality -= qualityStep
  }

  // 최소 quality로도 안되면 크기를 줄여가며 재시도
  let scale = 0.9
  const minScale = 0.5

  while (scale >= minScale) {
    const scaledWidth = Math.round(width * scale)
    const scaledHeight = Math.round(height * scale)
    const result = await compressToFile(img, scaledWidth, scaledHeight, minQuality, opts.type, file.name)

    if (result.size <= opts.maxFileSize) {
      return result
    }

    scale -= 0.1
  }

  // 그래도 안되면 최소 설정으로 반환
  return compressToFile(img, Math.round(width * minScale), Math.round(height * minScale), minQuality, opts.type, file.name)
}

/**
 * 이미지를 로드합니다.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve(img)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 이미지를 압축하여 File로 변환합니다.
 */
function compressToFile(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
  type: string,
  originalFileName: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    canvas.width = width
    canvas.height = height
    ctx.drawImage(img, 0, 0, width, height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'))
          return
        }

        const extension = type.split('/')[1]
        const baseName = originalFileName.replace(/\.[^.]+$/, '')
        const newFileName = `${baseName}.${extension}`

        resolve(new File([blob], newFileName, { type, lastModified: Date.now() }))
      },
      type,
      quality
    )
  })
}

/**
 * 파일 크기를 읽기 좋은 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
