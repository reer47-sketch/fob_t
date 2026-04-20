'use client'

import { useState, useEffect, useCallback } from 'react'
import { CategoryList } from './_components/category-list'
import { SpeciesList } from './_components/species-list'
import { CodeTabs } from './_components/code-tabs'
import { CategoryDialog } from './_components/category-dialog'
import { SpeciesDialog } from './_components/species-dialog'
import { CodeDialog } from './_components/code-dialog'
import { getCategoriesAction } from '@/actions/codes/get-categories'
import { getSpeciesByCategoryAction } from '@/actions/codes/get-species-by-category'
import { getChildCodesAction } from '@/actions/codes/get-child-codes'
import { createCategoryAction } from '@/actions/codes/create-category'
import { createSpeciesAction } from '@/actions/codes/create-species'
import { createChildCodeAction } from '@/actions/codes/create-child-code'
import { updateCodeAction } from '@/actions/codes/update-code'
import { deleteCodeAction } from '@/actions/codes/delete-code'
import { deleteCategoryAction } from '@/actions/codes/delete-category'
import { deleteSpeciesAction } from '@/actions/codes/delete-species'
import { toast } from 'sonner'
import { CodeCategory } from '@prisma/client'
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

type Category = {
  id: string
  code: string
  name: string
  deletable: boolean
}

type Species = {
  id: string
  code: string
  name: string
  scientificName?: string | null
  deletable: boolean
}

type Code = {
  id: string
  code: string
  name: string
  category: CodeCategory
  description: string | null
  displayOrder: number
  _count: {
    animalCodes: number
  }
}

type ChildCodes = {
  morphs: Code[]
  traits: Code[]
  colors: Code[]
}

const CATEGORY_LABELS: Record<CodeCategory, string> = {
  CATEGORY: '카테고리',
  SPECIES: '종',
  MORPH: '모프',
  TRAIT: '형질',
  COLOR: '색깔',
}

export default function CodesPage() {
  // 데이터
  const [categories, setCategories] = useState<Category[]>([])
  const [species, setSpecies] = useState<Species[]>([])
  const [childCodes, setChildCodes] = useState<ChildCodes>({
    morphs: [],
    traits: [],
    colors: [],
  })
  const [loading, setLoading] = useState(true)

  // 선택 상태
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null)

  // 카테고리 Dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // 종 Dialog
  const [speciesDialogOpen, setSpeciesDialogOpen] = useState(false)
  const [editingSpecies, setEditingSpecies] = useState<Species | null>(null)

  // 코드 Dialog
  const [codeDialogOpen, setCodeDialogOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<Code | null>(null)
  const [addingCategory, setAddingCategory] = useState<CodeCategory | null>(null)

  // 삭제 Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingType, setDeletingType] = useState<'category' | 'species' | 'code'>('code')

  // ============================================
  // 데이터 로딩
  // ============================================

  const loadCategories = useCallback(async () => {
    try {
      const result = await getCategoriesAction()
      if (result.success && result.data) {
        setCategories(result.data)
        if (result.data.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
      toast.error('카테고리 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [selectedCategoryId])

  const loadSpecies = useCallback(async (categoryId: string) => {
    try {
      const result = await getSpeciesByCategoryAction(categoryId)
      if (result.success && result.data) {
        setSpecies(result.data)
        if (result.data.length > 0) {
          setSelectedSpeciesId(result.data[0].id)
        } else {
          setSelectedSpeciesId(null)
          setChildCodes({ morphs: [], traits: [], colors: [] })
        }
      }
    } catch (error) {
      console.error('Failed to load species:', error)
      toast.error('종 목록을 불러오는데 실패했습니다.')
    }
  }, [])

  const loadChildCodes = useCallback(async (speciesId: string) => {
    try {
      const result = await getChildCodesAction(speciesId)
      if (result.success && result.data) {
        setChildCodes(result.data)
      }
    } catch (error) {
      console.error('Failed to load child codes:', error)
      toast.error('코드 목록을 불러오는데 실패했습니다.')
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (selectedCategoryId) {
      loadSpecies(selectedCategoryId)
    } else {
      setSpecies([])
      setSelectedSpeciesId(null)
    }
  }, [selectedCategoryId, loadSpecies])

  useEffect(() => {
    if (selectedSpeciesId) {
      loadChildCodes(selectedSpeciesId)
    } else {
      setChildCodes({ morphs: [], traits: [], colors: [] })
    }
  }, [selectedSpeciesId, loadChildCodes])

  // ============================================
  // 카테고리 핸들러
  // ============================================

  const handleAddCategory = () => {
    setEditingCategory(null)
    setCategoryDialogOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryDialogOpen(true)
  }

  const handleSaveCategory = async (data: { code: string; name: string }) => {
    if (editingCategory) {
      const result = await updateCodeAction({ id: editingCategory.id, ...data })
      if (result.success) {
        toast.success('카테고리가 수정되었습니다.')
        loadCategories()
      } else {
        toast.error(result.error || '카테고리 수정에 실패했습니다.')
        throw new Error(result.error)
      }
    } else {
      const result = await createCategoryAction(data)
      if (result.success) {
        toast.success('카테고리가 추가되었습니다.')
        loadCategories()
      } else {
        toast.error(result.error || '카테고리 추가에 실패했습니다.')
        throw new Error(result.error)
      }
    }
  }

  const handleDeleteCategory = (category: Category) => {
    setDeletingId(category.id)
    setDeletingType('category')
    setDeleteDialogOpen(true)
  }

  const handleSelectCategory = (id: string) => {
    setSelectedCategoryId(id)
    setSelectedSpeciesId(null)
  }

  // ============================================
  // 종 핸들러
  // ============================================

  const handleAddSpecies = () => {
    setEditingSpecies(null)
    setSpeciesDialogOpen(true)
  }

  const handleEditSpecies = (species: Species) => {
    setEditingSpecies(species)
    setSpeciesDialogOpen(true)
  }

  const handleSaveSpecies = async (data: {
    code: string
    name: string
    scientificName: string
    description?: string
  }) => {
    if (editingSpecies) {
      const result = await updateCodeAction({ id: editingSpecies.id, ...data })
      if (result.success) {
        toast.success('종이 수정되었습니다.')
        if (selectedCategoryId) loadSpecies(selectedCategoryId)
      } else {
        toast.error(result.error || '종 수정에 실패했습니다.')
        throw new Error(result.error)
      }
    } else {
      if (!selectedCategoryId) return
      const result = await createSpeciesAction({ parentId: selectedCategoryId, ...data })
      if (result.success) {
        toast.success('종이 추가되었습니다.')
        loadSpecies(selectedCategoryId)
        loadCategories()
      } else {
        toast.error(result.error || '종 추가에 실패했습니다.')
        throw new Error(result.error)
      }
    }
  }

  const handleDeleteSpecies = (species: Species) => {
    setDeletingId(species.id)
    setDeletingType('species')
    setDeleteDialogOpen(true)
  }

  // ============================================
  // 코드 핸들러 (모프/형질/색깔)
  // ============================================

  const handleAddCode = (category: CodeCategory) => {
    if (!selectedSpeciesId) {
      toast.error('종을 먼저 선택해주세요.')
      return
    }
    setEditingCode(null)
    setAddingCategory(category)
    setCodeDialogOpen(true)
  }

  const handleEditCode = (code: Code) => {
    setEditingCode(code)
    setAddingCategory(code.category)
    setCodeDialogOpen(true)
  }

  const handleSaveCode = async (data: {
    category: CodeCategory
    code: string
    name: string
    description?: string
    displayOrder?: number
  }) => {
    if (!selectedSpeciesId) return

    if (editingCode) {
      const result = await updateCodeAction({
        id: editingCode.id,
        code: data.code,
        name: data.name,
        description: data.description,
        displayOrder: data.displayOrder,
      })
      if (result.success) {
        toast.success('코드가 수정되었습니다.')
        loadChildCodes(selectedSpeciesId)
      } else {
        toast.error(result.error || '코드 수정에 실패했습니다.')
        throw new Error(result.error)
      }
    } else {
      const result = await createChildCodeAction({
        parentId: selectedSpeciesId,
        category: data.category,
        code: data.code,
        name: data.name,
        description: data.description,
        displayOrder: data.displayOrder,
      })
      if (result.success) {
        toast.success('코드가 추가되었습니다.')
        loadChildCodes(selectedSpeciesId)
      } else {
        toast.error(result.error || '코드 추가에 실패했습니다.')
        throw new Error(result.error)
      }
    }
  }

  const handleDeleteCode = (id: string) => {
    setDeletingId(id)
    setDeletingType('code')
    setDeleteDialogOpen(true)
  }

  // ============================================
  // 삭제 확인
  // ============================================

  const handleConfirmDelete = async () => {
    if (!deletingId) return

    if (deletingType === 'category') {
      const result = await deleteCategoryAction(deletingId)
      if (result.success) {
        toast.success('카테고리가 삭제되었습니다.')
        if (deletingId === selectedCategoryId) {
          setSelectedCategoryId(null)
        }
        loadCategories()
      } else {
        toast.error(result.error || '카테고리 삭제에 실패했습니다.')
      }
    } else if (deletingType === 'species') {
      const result = await deleteSpeciesAction(deletingId)
      if (result.success) {
        toast.success('종이 삭제되었습니다.')
        if (deletingId === selectedSpeciesId) {
          setSelectedSpeciesId(null)
        }
        if (selectedCategoryId) {
          loadSpecies(selectedCategoryId)
          loadCategories()
        }
      } else {
        toast.error(result.error || '종 삭제에 실패했습니다.')
      }
    } else {
      const result = await deleteCodeAction(deletingId)
      if (result.success) {
        toast.success('코드가 삭제되었습니다.')
        if (selectedSpeciesId) loadChildCodes(selectedSpeciesId)
      } else {
        toast.error(result.error || '코드 삭제에 실패했습니다.')
      }
    }

    setDeleteDialogOpen(false)
    setDeletingId(null)
  }

  const deleteDialogMessages = {
    category: {
      title: '카테고리 삭제',
      description: '이 카테고리를 삭제하시겠습니까? 하위 종이 있으면 삭제할 수 없습니다. 이 작업은 되돌릴 수 없습니다.',
    },
    species: {
      title: '종 삭제',
      description: '이 종을 삭제하시겠습니까? 하위 코드나 개체가 있으면 삭제할 수 없습니다. 이 작업은 되돌릴 수 없습니다.',
    },
    code: {
      title: '코드 삭제',
      description: '이 코드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
      {/* 1뎁스: 카테고리 목록 */}
      <div className="w-48 shrink-0">
        <CategoryList
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={handleSelectCategory}
          onAdd={handleAddCategory}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
        />
      </div>

      {/* 2뎁스: 종 목록 */}
      <div className="w-56 shrink-0">
        {selectedCategoryId ? (
          <SpeciesList
            species={species}
            selectedId={selectedSpeciesId}
            onSelect={setSelectedSpeciesId}
            onAdd={handleAddSpecies}
            onEdit={handleEditSpecies}
            onDelete={handleDeleteSpecies}
          />
        ) : (
          <div className="flex items-center justify-center h-full border-r">
            <p className="text-sm text-muted-foreground">카테고리를 선택해주세요</p>
          </div>
        )}
      </div>

      {/* 3뎁스: 모프/형질/색깔 탭 */}
      <div className="flex-1 flex flex-col">
        {selectedSpeciesId ? (
          <CodeTabs
            morphs={childCodes.morphs}
            traits={childCodes.traits}
            colors={childCodes.colors}
            onAdd={handleAddCode}
            onEdit={handleEditCode}
            onDelete={handleDeleteCode}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">
              {selectedCategoryId ? '종을 선택해주세요' : '카테고리를 선택해주세요'}
            </p>
          </div>
        )}
      </div>

      {/* 카테고리 추가/수정 Dialog */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        onSave={handleSaveCategory}
      />

      {/* 종 추가/수정 Dialog */}
      <SpeciesDialog
        open={speciesDialogOpen}
        onOpenChange={setSpeciesDialogOpen}
        species={editingSpecies}
        onSave={handleSaveSpecies}
      />

      {/* 코드 추가/수정 Dialog */}
      <CodeDialog
        open={codeDialogOpen}
        onOpenChange={setCodeDialogOpen}
        code={editingCode}
        category={addingCategory}
        categoryLabel={addingCategory ? CATEGORY_LABELS[addingCategory] : ''}
        onSave={handleSaveCode}
      />

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialogMessages[deletingType].title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogMessages[deletingType].description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
