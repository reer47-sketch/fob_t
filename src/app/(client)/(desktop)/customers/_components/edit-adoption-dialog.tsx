'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { cn } from '@/lib/utils'
import { updateAdoptionSchema, type UpdateAdoptionInput } from '@/actions/adoptions/schemas'
import { updateAdoption } from '@/actions/adoptions/update-adoption'
import type { CustomerAdoptionItem } from '@/services/adoption-service'
import { toast } from 'sonner'

interface EditAdoptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adoption: CustomerAdoptionItem | null
  onSuccess: () => void
}

export function EditAdoptionDialog({
  open,
  onOpenChange,
  adoption,
  onSuccess,
}: EditAdoptionDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<UpdateAdoptionInput>({
    resolver: zodResolver(updateAdoptionSchema),
    defaultValues: {
      adoptionId: '',
      adoptionDate: new Date(),
      price: 0,
      transferPurpose: '',
      transferReason: '',
    },
  })

  useEffect(() => {
    if (open && adoption) {
      form.reset({
        adoptionId: adoption.id,
        adoptionDate: new Date(adoption.adoptionDate),
        price: adoption.price,
        transferPurpose: adoption.transferPurpose || '',
        transferReason: adoption.transferReason || '',
      })
    }
  }, [open, adoption, form])

  const onSubmit = async (data: UpdateAdoptionInput) => {
    setLoading(true)
    try {
      const result = await updateAdoption(data)
      if (result.success) {
        toast.success('분양 내역이 수정되었습니다')
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || '분양 내역 수정에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to update adoption:', error)
      toast.error('분양 내역 수정 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!adoption) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>분양 내역 수정</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {adoption.animal.uniqueId}
            {adoption.animal.name && ` (${adoption.animal.name})`}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adoptionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>분양일</FormLabel>
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
                            format(field.value, 'yyyy년 MM월 dd일', { locale: ko })
                          ) : (
                            <span>날짜를 선택하세요</span>
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
                        locale={ko}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>분양 금액 (원)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transferPurpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>양도 용도 (선택)</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 애완, 번식 등" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transferReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>양도 사유 (선택)</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 판매, 증여 등" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '수정 중...' : '수정'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
