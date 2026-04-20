'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Trash2, Pencil, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { getCustomerAdoptions } from '@/actions/adoptions/get-customer-adoptions'
import { deleteAdoption } from '@/actions/adoptions/delete-adoption'
import { updateAdoptionReport } from '@/actions/adoptions/update-adoption-report'
import type { CustomerAdoptionItem } from '@/services/adoption-service'
import type { CustomerListItem } from '@/services/customer-service'
import { AnimalDetailSheet } from '@/app/(client)/(desktop)/animals/_components/animal-detail-sheet'
import { EditAdoptionDialog } from './edit-adoption-dialog'

interface AdoptionHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: CustomerListItem | null
}

export function AdoptionHistorySheet({
  open,
  onOpenChange,
  customer,
}: AdoptionHistorySheetProps) {
  const [loading, setLoading] = useState(false)
  const [adoptions, setAdoptions] = useState<CustomerAdoptionItem[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null)
  const [animalDetailOpen, setAnimalDetailOpen] = useState(false)
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<CustomerAdoptionItem | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    if (open && customer) {
      fetchAdoptions()
    }
  }, [open, customer])

  const fetchAdoptions = async () => {
    if (!customer) return

    setLoading(true)
    try {
      const result = await getCustomerAdoptions(customer.id)
      if (result.success) {
        setAdoptions(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch adoptions:', error)
    } finally {
      setLoading(false)
    }
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

  const handleDeleteClick = (adoptionId: string) => {
    setDeleteTarget(adoptionId)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setDeleting(deleteTarget)
    setDeleteTarget(null)
    try {
      const result = await deleteAdoption(deleteTarget)
      if (result.success) {
        setAdoptions((prev) => prev.filter((a) => a.id !== deleteTarget))
      }
    } catch (error) {
      console.error('Failed to delete adoption:', error)
    } finally {
      setDeleting(null)
    }
  }

  const handleAnimalClick = (animalId: string) => {
    setSelectedAnimalId(animalId)
    setAnimalDetailOpen(true)
  }

  const handleReportToggle = async (adoptionId: string, currentStatus: boolean) => {
    setUpdatingReportId(adoptionId)
    try {
      const result = await updateAdoptionReport(adoptionId, !currentStatus)
      if (result.success) {
        setAdoptions((prev) =>
          prev.map((a) => (a.id === adoptionId ? { ...a, isReported: !currentStatus } : a))
        )
      } else {
        console.error('Failed to update report status:', result.error)
      }
    } catch (error) {
      console.error('Error updating report status:', error)
    } finally {
      setUpdatingReportId(null)
    }
  }

  const handleEditClick = (adoption: CustomerAdoptionItem) => {
    setEditTarget(adoption)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    fetchAdoptions()
  }

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full overflow-hidden">
        <SheetHeader>
          <SheetTitle>분양 내역</SheetTitle>
          {customer && (
            <p className="text-sm text-muted-foreground">
              {customer.name} ({customer.phone})
            </p>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : adoptions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">분양 내역이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4 pb-6">
              {adoptions.map((adoption) => (
                <div
                  key={adoption.id}
                  className="flex gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted">
                    {adoption.animal.imageUrl ? (
                      <img
                        src={adoption.animal.imageUrl}
                        alt={adoption.animal.uniqueId}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAnimalClick(adoption.animal.id)}
                        className="font-mono text-sm font-medium hover:underline cursor-pointer text-left"
                      >
                        {adoption.animal.uniqueId}
                      </button>
                      {adoption.animal.name && (
                        <button
                          onClick={() => handleAnimalClick(adoption.animal.id)}
                          className="text-muted-foreground text-sm truncate hover:underline cursor-pointer"
                        >
                          ({adoption.animal.name})
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{getGenderLabel(adoption.animal.gender)}</span>
                      {adoption.animal.species && (
                        <>
                          <span>·</span>
                          <span>{adoption.animal.species}</span>
                        </>
                      )}
                      {adoption.animal.morph && (
                        <>
                          <span>·</span>
                          <span className="truncate">{adoption.animal.morph}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(adoption.adoptionDate), 'yyyy.MM.dd', { locale: ko })}
                      </span>
                      <span className="text-sm font-medium">
                        {adoption.price.toLocaleString('ko-KR')}원
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        id={`report-${adoption.id}`}
                        checked={adoption.isReported}
                        onCheckedChange={() => handleReportToggle(adoption.id, adoption.isReported)}
                        disabled={updatingReportId === adoption.id}
                      />
                      <Label
                        htmlFor={`report-${adoption.id}`}
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        양수양도 신고
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          disabled={deleting === adoption.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(adoption)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(adoption.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2 text-destructive focus:text-destructive" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>

    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>분양 내역 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            정말 이 분양 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AnimalDetailSheet
      animalId={selectedAnimalId}
      open={animalDetailOpen}
      onOpenChange={setAnimalDetailOpen}
    />

    <EditAdoptionDialog
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      adoption={editTarget}
      onSuccess={handleEditSuccess}
    />
    </>
  )
}
