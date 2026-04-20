import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Clock } from 'lucide-react'

/**
 * 승인 대기 페이지
 */
export default function PendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-yellow-100 p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-center">승인 대기 중</CardTitle>
          <CardDescription className="text-center">
            관리자 승인을 기다리고 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>회원가입 신청이 완료되었습니다</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>관리자가 가입 신청을 검토 중입니다.</p>
              <p>승인이 완료되면 별도로 연락드립니다.</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-gray-600">
            <p>• 승인 후 로그인하여 시스템을 이용할 수 있습니다</p>
            <p>• 문의사항이 있으시면 관리자에게 연락해 주세요</p>
          </div>

          <div className="pt-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">로그인 페이지로 돌아가기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
