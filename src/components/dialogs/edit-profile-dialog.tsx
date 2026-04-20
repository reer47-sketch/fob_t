"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Camera } from "lucide-react"
import { updateProfile } from "@/actions/auth/update-profile"
import { uploadProfileImage } from "@/actions/auth/upload-profile-image"
import { resizeImage } from "@/lib/image-resize"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

const updateProfileSchema = z.object({
  name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다"),
  phone: z
    .string()
    .min(1, "연락처를 입력해주세요")
    .regex(/^010-\d{4}-\d{4}$/, "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)"),
  shopName: z.string().min(2, "샵이름은 최소 2자 이상이어야 합니다"),
  address: z.string().optional(),
  profileImage: z.string().optional(),
  marketingAgreed: z.boolean().optional(),
})

type UpdateProfileInput = z.infer<typeof updateProfileSchema>

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    name: string | null
    phone?: string | null
    profileImage?: string | null
    marketingAgreed?: boolean | null
    tenant: {
      id: string
      name: string
      address?: string | null
    } | null
  }
}

// 전화번호 포맷팅 함수
const formatPhoneNumber = (value: string) => {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, "")

  // 11자리 숫자만 허용
  if (numbers.length > 11) {
    return value.slice(0, -1)
  }

  // 010-1234-5678 형식으로 포맷팅
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }
}

export function EditProfileDialog({ open, onOpenChange, user }: EditProfileDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(user.profileImage || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
      shopName: user.tenant?.name || "",
      address: user.tenant?.address || "",
      profileImage: user.profileImage || undefined,
      marketingAgreed: user.marketingAgreed || false,
    },
  })

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("이미지 파일만 업로드할 수 있습니다")
      return
    }

    try {
      const resized = await resizeImage(file, { maxWidth: 800, maxHeight: 800 })
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
        setSelectedFile(resized)
      }
      reader.readAsDataURL(resized)
    } catch {
      toast.error("이미지 처리 중 오류가 발생했습니다")
    }
  }

  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      setIsLoading(true)

      // 1. 이미지가 선택되었다면 먼저 업로드
      if (selectedFile) {
        const uploadResult = await uploadProfileImage(selectedFile)

        if (!uploadResult.success || !uploadResult.data) {
          toast.error(uploadResult.error || "이미지 업로드에 실패했습니다")
          setIsLoading(false)
          return
        }

        // 업로드된 이미지 URL을 데이터에 추가
        data.profileImage = uploadResult.data.imageUrl
      }

      // 2. 프로필 업데이트
      const result = await updateProfile(data)

      if (result.success) {
        toast.success("정보가 변경되었습니다")
        // 다이얼로그를 닫기 전에 페이지 리로드
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } else {
        toast.error(result.error || "정보 변경에 실패했습니다")
      }
    } catch (error) {
      toast.error("정보 변경 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = user.tenant?.name && user.name
    ? `${user.tenant.name}(${user.name})`
    : user.tenant?.name || user.name || "사용자"
  const fallback = displayName.substring(0, 2).toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>정보 변경</DialogTitle>
          <DialogDescription>
            회원 정보를 수정할 수 있습니다
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 프로필 이미지 */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewImage || undefined} alt={displayName} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleImageClick}
                  disabled={isLoading}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                클릭하여 프로필 이미지 변경
              </p>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>연락처</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="010-1234-5678"
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value)
                        field.onChange(formatted)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shopName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>샵이름</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>주소</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="주소를 입력해주세요" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="marketingAgreed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      마케팅 수신동의 (선택)
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
