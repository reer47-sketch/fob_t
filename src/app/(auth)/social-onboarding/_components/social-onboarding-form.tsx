'use client'

import { useActionState, useState } from 'react'
import { completeSocialSignUp } from '@/actions/auth/complete-social-signup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/[^\d]/g, '')
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

interface SocialOnboardingFormProps {
  defaultName?: string
  defaultEmail?: string
}

export function SocialOnboardingForm({ defaultName, defaultEmail }: SocialOnboardingFormProps) {
  const router = useRouter()
  const [shopName, setShopName] = useState('')
  const [address, setAddress] = useState('')
  // 이름은 props로 받았으면 초기값으로 설정
  const [name, setName] = useState(defaultName || '')
  const [phone, setPhone] = useState('')
  const [allAgreed, setAllAgreed] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [dataCollectionAgreed, setDataCollectionAgreed] = useState(false)
  const [marketingAgreed, setMarketingAgreed] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const result = await completeSocialSignUp({
        shopName: formData.get('shopName') as string,
        address: formData.get('address') as string,
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        termsAgreed: formData.get('termsAgreed') === 'on',
        privacyAgreed: formData.get('privacyAgreed') === 'on',
        dataCollectionAgreed: formData.get('dataCollectionAgreed') === 'on',
        marketingAgreed: formData.get('marketingAgreed') === 'on',
      })

      if (result.success) {
        toast.success('회원가입이 완료되었습니다! 환영합니다.')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }

      return result
    },
    null
  )

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const handleAllAgreedChange = (checked: boolean) => {
    setAllAgreed(checked)
    setTermsAgreed(checked)
    setPrivacyAgreed(checked)
    setDataCollectionAgreed(checked)
    setMarketingAgreed(checked)
  }

  const handleIndividualChange = (
    setter: (value: boolean) => void,
    value: boolean
  ) => {
    setter(value)
    if (!value) setAllAgreed(false)
  }

  const isRequiredAgreed = termsAgreed && dataCollectionAgreed

  return (
    <Card>
      <CardHeader>
        <CardTitle>추가 정보 입력</CardTitle>
        <CardDescription>
          서비스 이용을 위해 샵 정보와 연락처를 입력해주세요
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          
          {/* 가져온 소셜 정보 (수정 불가) */}
          <div className="space-y-4 border-b pb-4">
             <h3 className="text-sm font-medium text-gray-700">기본 정보 (수정 불가)</h3>
             <div className="space-y-2">
              <Label htmlFor="displayEmail">이메일</Label>
              <Input
                id="displayEmail"
                type="text"
                value={defaultEmail || ''}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                name="name"
                type="text"
                // 소셜 로그인에서 가져온 이름이 있으면 수정 불가 (readOnly)
                readOnly={!!defaultName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={defaultName ? "bg-gray-100" : ""}
              />
               {/* readOnly 상태여도 폼 전송 시 값은 가야 하므로 hidden input은 필요 없지만(input값이 전송됨), 
                   disabled를 썼다면 hidden input이 필요했을 것임. readOnly는 전송됨. */}
            </div>
          </div>

          <div className="space-y-4 border-b pb-4">
            <h3 className="text-sm font-medium text-gray-700">샵 정보 (필수)</h3>
            <div className="space-y-2">
              <Label htmlFor="shopName">샵명 *</Label>
              <Input
                id="shopName"
                name="shopName"
                type="text"
                placeholder="이름, 브리더명, 상호명"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="서울특별시 강남구..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">연락처 정보 (필수)</h3>
            <div className="space-y-2">
              <Label htmlFor="phone">연락처 *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={13}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700">약관 동의</h3>
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
              <Checkbox
                id="allAgreed"
                checked={allAgreed}
                onCheckedChange={handleAllAgreedChange}
                disabled={isPending}
              />
              <label
                htmlFor="allAgreed"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                전체 동의
              </label>
            </div>
            <div className="space-y-3 pl-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="termsAgreed"
                  name="termsAgreed"
                  checked={termsAgreed}
                  onCheckedChange={(checked) => handleIndividualChange(setTermsAgreed, checked as boolean)}
                  disabled={isPending}
                />
                <label htmlFor="termsAgreed" className="text-sm leading-none cursor-pointer">
                  <Link href="/privacy/terms" target="_blank" className="underline">이용약관</Link>,{' '}
                  <Link href="/privacy/policy" target="_blank" className="underline">개인정보처리방침</Link> 동의 (필수)
                </label>
              </div>
              <input type="hidden" name="privacyAgreed" value={termsAgreed ? 'on' : 'off'} />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dataCollectionAgreed"
                  name="dataCollectionAgreed"
                  checked={dataCollectionAgreed}
                  onCheckedChange={(checked) => handleIndividualChange(setDataCollectionAgreed, checked as boolean)}
                  disabled={isPending}
                />
                <label htmlFor="dataCollectionAgreed" className="text-sm leading-none cursor-pointer">
                  <Link href="/privacy/data-collection" target="_blank" className="underline">개인정보수집 및 이용</Link> 동의 (필수)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketingAgreed"
                  name="marketingAgreed"
                  checked={marketingAgreed}
                  onCheckedChange={(checked) => handleIndividualChange(setMarketingAgreed, checked as boolean)}
                  disabled={isPending}
                />
                <label htmlFor="marketingAgreed" className="text-sm leading-none cursor-pointer">
                  <Link href="/privacy/marketing" target="_blank" className="underline">마케팅 정보 수신</Link> 동의 (선택)
                </label>
              </div>
            </div>
          </div>

          {state && !state.success && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="pt-4">
          <Button type="submit" className="w-full" disabled={isPending || !isRequiredAgreed}>
            {isPending ? '처리 중...' : '가입 완료'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
