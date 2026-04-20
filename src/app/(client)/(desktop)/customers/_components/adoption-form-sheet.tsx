'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon, Trash2, Search, ScanLine, Download, ExternalLink } from 'lucide-react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { createAdoptionSchema, type CreateAdoptionInput } from '@/actions/adoptions/schemas'
import { createAdoption } from '@/actions/adoptions/create-adoption'
import { getAvailableAnimals } from '@/actions/adoptions/get-available-animals'
import type { AvailableAnimal } from '@/services/adoption-service'
import type { CustomerListItem } from '@/services/customer-service'
import { QrScannerSheet } from '@/components/layout/qr-scanner-sheet'
import type { Gender } from '@prisma/client'

interface AdoptionFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: CustomerListItem | null
  onSuccess: () => void
}

export function AdoptionFormSheet({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: AdoptionFormSheetProps) {
  const [loading, setLoading] = useState(false)
  const [animals, setAnimals] = useState<AvailableAnimal[]>([])
  const [selectedAnimals, setSelectedAnimals] = useState<AvailableAnimal[]>([])
  const [animalsLoading, setAnimalsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [qrScannerOpen, setQrScannerOpen] = useState(false)

  const form = useForm<CreateAdoptionInput>({
    resolver: zodResolver(createAdoptionSchema),
    defaultValues: {
      customerId: '',
      adoptionDate: new Date(),
      transferPurpose: '',
      transferReason: '',
      items: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const fetchAnimals = useCallback(async (search: string) => {
    setAnimalsLoading(true)
    try {
      const result = await getAvailableAnimals(search)
      if (result.success) {
        setAnimals(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch animals:', error)
    } finally {
      setAnimalsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setSearchQuery('')
      setShowResults(false)
      setAnimals([])
      setSelectedAnimals([])
      if (customer) {
        form.reset({
          customerId: customer.id,
          adoptionDate: new Date(),
          transferPurpose: '',
          transferReason: '',
          items: [],
        })
      }
    }
  }, [open, customer, form])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchAnimals(searchQuery.trim())
      setShowResults(true)
    }
  }

  const onSubmit = async (data: CreateAdoptionInput) => {
    setLoading(true)
    try {
      const result = await createAdoption(data)

      if (result.success) {
        onOpenChange(false)
        onSuccess()
      } else {
        console.error('Failed to create adoption:', result.error)
      }
    } catch (error) {
      console.error('Error creating adoption:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers ? parseInt(numbers, 10).toLocaleString('ko-KR') : ''
  }

  const parsePrice = (value: string) => {
    return parseInt(value.replace(/\D/g, ''), 10) || 0
  }

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'MALE':
        return '수컷'
      case 'FEMALE':
        return '암컷'
      default:
        return '미확인'
    }
  }

  // 선택된 개체 ID 목록 (중복 선택 방지용)
  const selectedAnimalIds = selectedAnimals.map((a) => a.id)

  // 이미 선택된 개체 제외한 목록
  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => !selectedAnimalIds.includes(animal.id))
  }, [animals, selectedAnimalIds])

  // 총 금액 계산
  const totalPrice = form.watch('items').reduce((sum, item) => sum + (item.price || 0), 0)

  // QR 스캔으로 개체 추가
  const handleQrAnimalSelect = (scanned: { id: string; uniqueId: string; name: string | null; gender: string; acquisitionDate: Date }) => {
    if (selectedAnimalIds.includes(scanned.id)) return
    const animal: AvailableAnimal = {
      id: scanned.id,
      uniqueId: scanned.uniqueId,
      name: scanned.name,
      gender: scanned.gender as Gender,
      acquisitionDate: scanned.acquisitionDate,
      species: null,
      morph: null,
    }
    handleSelectAnimal(animal)
  }

  // 개체 선택 핸들러
  const handleSelectAnimal = (animal: AvailableAnimal) => {
    append({ animalId: animal.id, price: 0 })
    setSelectedAnimals((prev) => [...prev, animal])
    setSearchQuery('')
    setShowResults(false)
  }

  // 개체 삭제 핸들러
  const handleRemoveAnimal = (index: number, animalId: string) => {
    remove(index)
    setSelectedAnimals((prev) => prev.filter((a) => a.id !== animalId))
  }

  // 선택된 개체 정보 가져오기
  const getAnimalById = (id: string) => selectedAnimals.find((a) => a.id === id)

  return (
    <>
    <QrScannerSheet
      open={qrScannerOpen}
      onOpenChange={setQrScannerOpen}
      mode="select"
      onAnimalSelect={handleQrAnimalSelect}
    />
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>분양 등록</SheetTitle>
          {customer && (
            <p className="text-sm text-muted-foreground">
              고객: {customer.name} ({customer.phone})
            </p>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 px-4 pb-4">
              {/* 분양 기본 정보 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium mb-3">분양 정보</h3>

                <FormField
                  control={form.control}
                  name="adoptionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        분양일<span className="text-destructive">*</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'yyyy-MM-dd', { locale: ko })
                              ) : (
                                <span>날짜 선택</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            locale={ko}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">
                    신고서 작성 시 필요한 정보입니다
                  </p>

                  {/* 용도 */}
                  <FormField
                    control={form.control}
                    name="transferPurpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>용도</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="예: 취미 등"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 양도사유 (보관사유) */}
                  <FormField
                    control={form.control}
                    name="transferReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>양도사유 (보관사유)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="예: 분양, 위탁보관 등"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 개체 선택 */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">개체 선택</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    분양할 개체를 검색하여 추가하세요
                  </p>
                </div>

                {/* 개체 검색 */}
                <div className="space-y-2">
                  <div className="relative">
                    <div className="flex gap-2">
                      <Input
                        placeholder="개체코드 또는 이름으로 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSearch()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleSearch}
                        disabled={animalsLoading || !searchQuery.trim()}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setQrScannerOpen(true)}
                      >
                        <ScanLine className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* 검색 결과 드롭다운 */}
                    {showResults && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[200px] overflow-hidden">
                        {animalsLoading ? (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            로딩 중...
                          </div>
                        ) : filteredAnimals.length === 0 ? (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            검색 결과가 없습니다
                          </div>
                        ) : (
                          <div className="max-h-[200px] overflow-y-auto py-1">
                            {filteredAnimals.map((animal) => (
                              <button
                                key={animal.id}
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                                onClick={() => handleSelectAnimal(animal)}
                              >
                                <span className="font-mono text-sm">{animal.uniqueId}</span>
                                {animal.name && (
                                  <span className="text-muted-foreground text-sm">
                                    ({animal.name})
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {getGenderLabel(animal.gender)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 선택된 분양 개체 목록 */}
                {fields.length > 0 && (
                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const animal = getAnimalById(form.watch(`items.${index}.animalId`))
                      return (
                        <div key={field.id} className="flex gap-2 items-start p-3 border rounded-md bg-muted/30">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">
                                {animal?.uniqueId}
                              </span>
                              {animal?.name && (
                                <span className="text-muted-foreground text-sm">
                                  ({animal.name})
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {animal && getGenderLabel(animal.gender)}
                              </span>
                            </div>

                            <FormField
                              control={form.control}
                              name={`items.${index}.price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        placeholder="금액"
                                        value={field.value ? formatPrice(String(field.value)) : ''}
                                        onChange={(e) => {
                                          field.onChange(parsePrice(e.target.value))
                                        }}
                                        className="pr-8"
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                        원
                                      </span>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAnimal(index, form.watch(`items.${index}.animalId`))}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )
                    })}

                    {form.formState.errors.items?.message && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.items.message}
                      </p>
                    )}
                  </div>
                )}

                {/* 총 금액 */}
                {fields.length > 0 && (
                  <div className="flex justify-between items-center py-2 border-t">
                    <span className="font-medium">총 금액</span>
                    <span className="font-bold text-lg">
                      {totalPrice.toLocaleString('ko-KR')}원
                    </span>
                  </div>
                )}
              </div>

              {/* 분양 서류 다운로드 */}
              <div className="space-y-2 pt-4 border-t">
                <FormLabel>분양 서류</FormLabel>
                <div className="flex flex-col gap-1.5 text-sm">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      const link = document.createElement('a')
                      link.href = 'https://pub-0af4299080c54bae944363221ea068a9.r2.dev/docs/%5B%E1%84%87%E1%85%A7%E1%86%AF%E1%84%8C%E1%85%B5%20%E1%84%8C%E1%85%A631%E1%84%92%E1%85%A9%E1%84%8B%E1%85%B49%E1%84%89%E1%85%A5%E1%84%89%E1%85%B5%E1%86%A8%5D%20%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%A5%E1%86%BC%E1%84%80%E1%85%AA%E1%86%AB%E1%84%85%E1%85%B5%20%E1%84%8B%E1%85%A3%E1%84%89%E1%85%A2%E1%86%BC%E1%84%83%E1%85%A9%E1%86%BC%E1%84%86%E1%85%AE%E1%86%AF%20%E1%84%8B%E1%85%A3%E1%86%BC%E1%84%83%E1%85%A9%C2%B7%E1%84%8B%E1%85%A3%E1%86%BC%E1%84%89%E1%85%AE%C2%B7%E1%84%87%E1%85%A9%E1%84%80%E1%85%AA%E1%86%AB%20%E1%84%89%E1%85%B5%E1%86%AB%E1%84%80%E1%85%A9%E1%84%89%E1%85%A5(%E1%84%89%E1%85%B5%E1%86%AB%E1%84%80%E1%85%A9%E1%84%92%E1%85%AA%E1%86%A8%E1%84%8B%E1%85%B5%E1%86%AB%E1%84%8C%E1%85%B3%E1%86%BC).pdf'
                      link.download = '양수_양도_보관_신고서.pdf'
                      link.target = '_blank'
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    className="hover:underline flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    양수/양도/보관 신고서 (PDF)
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      const link = document.createElement('a')
                      link.href = 'https://pub-0af4299080c54bae944363221ea068a9.r2.dev/docs/%5B%E1%84%87%E1%85%A7%E1%86%AF%E1%84%8C%E1%85%B5%20%E1%84%8C%E1%85%A631%E1%84%92%E1%85%A9%E1%84%8B%E1%85%B49%E1%84%89%E1%85%A5%E1%84%89%E1%85%B5%E1%86%A8%5D%20%E1%84%8C%E1%85%B5%E1%84%8C%E1%85%A5%E1%86%BC%E1%84%80%E1%85%AA%E1%86%AB%E1%84%85%E1%85%B5%20%E1%84%8B%E1%85%A3%E1%84%89%E1%85%A2%E1%86%BC%E1%84%83%E1%85%A9%E1%86%BC%E1%84%86%E1%85%AE%E1%86%AF%20%E1%84%8B%E1%85%A3%E1%86%BC%E1%84%83%E1%85%A9%C2%B7%E1%84%8B%E1%85%A3%E1%86%BC%E1%84%89%E1%85%AE%C2%B7%E1%84%87%E1%85%A9%E1%84%80%E1%85%AA%E1%86%AB%20%E1%84%89%E1%85%B5%E1%86%AB%E1%84%80%E1%85%A9%E1%84%89%E1%85%A5(%E1%84%89%E1%85%B5%E1%86%AB%E1%84%80%E1%85%A9%E1%84%92%E1%85%AA%E1%86%A8%E1%84%8B%E1%85%B5%E1%86%AB%E1%84%8C%E1%85%B3%E1%86%BC).hwpx'
                      link.download = '양수_양도_보관_신고서.hwpx'
                      link.target = '_blank'
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    className="hover:underline flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    양수/양도/보관 신고서 (HWPX)
                  </a>
                  <a
                    href="https://wims.mcee.go.kr/wims/minwon/main/main.do"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    야생동물종합관리시스템 민원서비스
                  </a>
                </div>
              </div>
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter>
          <Button
            type="submit"
            disabled={loading || fields.length === 0}
            onClick={form.handleSubmit(onSubmit)}
          >
            {loading ? '저장 중...' : '분양 등록'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </>
  )
}
