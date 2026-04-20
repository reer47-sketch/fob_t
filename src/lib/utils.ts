import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 다음 샵 코드 생성 (A0000 ~ Z9999)
 * @param currentCode 현재 가장 큰 샵 코드 (null이면 A0000 반환)
 * @returns 다음 샵 코드
 * @throws Error Z9999 초과 시 에러
 */
export function generateNextShopCode(currentCode: string | null): string {
  // 첫 번째 샵 코드
  if (!currentCode) {
    return 'A0000'
  }

  // 현재 코드를 문자와 숫자로 분리
  const letter = currentCode[0]
  const number = parseInt(currentCode.slice(1), 10)

  // 숫자 증가
  if (number < 9999) {
    return `${letter}${String(number + 1).padStart(4, '0')}`
  }

  // 숫자가 9999면 문자를 다음으로 증가
  if (letter === 'Z') {
    throw new Error('Shop code limit reached (Z9999)')
  }

  const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1)
  return `${nextLetter}0000`
}
