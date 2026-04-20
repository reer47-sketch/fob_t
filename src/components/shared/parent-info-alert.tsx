import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, AlertCircle } from 'lucide-react'

interface ParentInfoAlertProps {
  isHatching: boolean
}

export function ParentInfoAlert({ isHatching }: ParentInfoAlertProps) {
  if (isHatching) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600!" />
        <AlertDescription>
          <p className="font-medium text-amber-800">
            해칭 개체는 부모 정보를 반드시 입력해야 합니다.
          </p>
          <p className="text-xs text-amber-700">
            각 부모는 최대 2개까지 입력 가능합니다.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600!" />
      <AlertDescription>
        <p className="font-medium text-blue-800">부모 정보는 선택사항입니다.</p>
        <p className="text-xs text-blue-700">
          각 부모는 최대 2개까지 입력 가능합니다.
        </p>
      </AlertDescription>
    </Alert>
  )
}
