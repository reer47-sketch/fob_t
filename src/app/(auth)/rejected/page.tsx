import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { XCircle } from 'lucide-react'

/**
 * 가입 거부 페이지
 */
export default function RejectedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-center">가입 승인 거부</CardTitle>
          <CardDescription className="text-center">
            가입 신청이 거부되었습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>가입 신청이 거부되었습니다</AlertTitle>
            <AlertDescription className="mt-2">
              관리자가 가입 신청을 검토한 결과, 승인이 거부되었습니다.
              자세한 사유는 이메일을 확인해 주세요.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-gray-600">
            <p>• 거부 사유는 등록하신 이메일로 발송되었습니다</p>
            <p>• 문의사항이 있으시면 관리자에게 연락해 주세요</p>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
