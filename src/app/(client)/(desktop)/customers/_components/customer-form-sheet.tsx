'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getCurrentUser } from '@/actions/auth/get-current-user'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createCustomerSchema, type CreateCustomerInput } from '@/actions/customers/schemas'
import { createCustomer } from '@/actions/customers/create-customer'
import { updateCustomer } from '@/actions/customers/update-customer'
import type { CustomerListItem } from '@/services/customer-service'

interface CustomerFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: CustomerListItem | null
  onSuccess: () => void
}

export function CustomerFormSheet({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerFormSheetProps) {
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    companyName: string
    managerName: string
    contact: string
  } | null>(null)
  const isEdit = !!customer

  useEffect(() => {
    getCurrentUser().then((result) => {
      if (result.success && result.data) {
        setUserInfo({
          companyName: result.data.tenant?.name || '',
          managerName: result.data.name || '',
          contact: result.data.email || '',
        })
      }
    })
  }, [])

  const formatPhoneNumber = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) {
      return numbers
    }
    if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }, [])

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      privacyConsent: false,
    },
  })

  useEffect(() => {
    if (open) {
      if (customer) {
        form.reset({
          name: customer.name,
          phone: customer.phone,
          address: customer.address || '',
          privacyConsent: customer.privacyConsent || false,
        })
      } else {
        form.reset({
          name: '',
          phone: '',
          address: '',
          privacyConsent: false,
        })
      }
    }
  }, [open, customer, form])

  const onSubmit = async (data: CreateCustomerInput) => {
    setLoading(true)
    try {
      let result
      if (isEdit) {
        result = await updateCustomer({
          id: customer.id,
          ...data,
        })
      } else {
        result = await createCustomer(data)
      }

      if (result.success) {
        onOpenChange(false)
        onSuccess()
      } else {
        console.error('Failed to save customer:', result.error)
      }
    } catch (error) {
      console.error('Error saving customer:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? '고객 편집' : '고객 등록'}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-4 px-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름<span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="고객 이름" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>전화번호<span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="010-0000-0000"
                        {...field}
                        onChange={(e) => {
                          field.onChange(formatPhoneNumber(e.target.value))
                        }}
                        maxLength={13}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>자택</FormLabel>
                    <FormControl>
                      <Input placeholder="주소" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 개인정보 수집 및 이용 동의 */}
              <FormField
                control={form.control}
                name="privacyConsent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>개인정보 수집 및 이용 동의<span className="text-destructive">*</span></FormLabel>
                    <ScrollArea className="h-48 rounded-md border p-3 text-sm text-muted-foreground">
                      <div className="space-y-4">
                        <p>
                          {userInfo?.companyName || ''}(이하 &quot;회사&quot;)는 개인정보보호법에 따라 아래와 같이 귀하의 개인정보를 수집 및 이용하고자 합니다. 본 내용을 충분히 숙지하신 후 동의 여부를 결정하여 주시기 바랍니다.
                        </p>

                        <div>
                          <p className="font-medium text-foreground">1. 개인정보의 수집 및 이용 목적</p>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>서비스 제공 및 사업 처리</li>
                            <li>고객 관리 및 상담</li>
                            <li>마케팅 및 정보 전달</li>
                            <li>법적 의무 준수</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-medium text-foreground">2. 수집하는 개인정보의 항목</p>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>필수항목: 성명, 생년월일, 연락처(전화번호, 이메일 주소)</li>
                            <li>선택항목: 주소, 관심사 등</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-medium text-foreground">3. 개인정보의 보유 및 이용 기간</p>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>수집 및 이용 목적 달성 시까지 보유</li>
                            <li>관련 법령에 의해 보존이 필요한 경우 해당 기간까지 보유</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-medium text-foreground">4. 개인정보의 제3자 제공</p>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>포브리더스에 사업상 목적으로 제공될 수 있음</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-medium text-foreground">5. 정보주체의 권리</p>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>개인정보의 열람, 정정, 삭제, 처리정지 요구권</li>
                            <li>동의 철회권</li>
                            <li>동의 거부권 및 거부에 따른 불이익</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-medium text-foreground">6. 개인정보 보호책임자</p>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>회사: {userInfo?.companyName || ''}</li>
                            <li>책임자: {userInfo?.managerName || ''}</li>
                            <li>연락처: {userInfo?.contact || ''}</li>
                          </ul>
                        </div>

                        <p className="mt-4">
                          위와 같이 회사가 개인정보를 수집 및 이용하고, 포브리더스에 제3자 제공하는 것에 동의합니다.
                        </p>

                        <p className="text-xs mt-2">
                          ※ 귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수항목에 대한 동의를 거부할 경우 서비스 제공이 제한될 수 있습니다.
                        </p>
                      </div>
                    </ScrollArea>
                    <FormControl>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="privacyConsent"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label
                          htmlFor="privacyConsent"
                          className="text-sm cursor-pointer"
                        >
                          개인정보 수집 및 이용에 동의합니다.
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter>
              <Button type="submit" disabled={loading}>
                {loading ? '저장 중...' : isEdit ? '수정' : '등록'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
