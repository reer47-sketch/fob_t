import { redirect } from 'next/navigation'

/**
 * Root 페이지
 * 로그인 페이지로 리다이렉트
 */
export default function Home() {
  redirect('/login')
}
