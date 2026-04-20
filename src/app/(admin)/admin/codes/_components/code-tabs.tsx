'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CodeList } from './code-list'
import { CodeCategory } from '@prisma/client'

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

type CodeTabsProps = {
  morphs: Code[]
  traits: Code[]
  colors: Code[]
  onAdd: (category: CodeCategory) => void
  onEdit: (code: Code) => void
  onDelete: (id: string) => void
}

export function CodeTabs({ morphs, traits, colors, onAdd, onEdit, onDelete }: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState('morphs')

  const getCategoryLabel = (tab: string) => {
    switch (tab) {
      case 'morphs':
        return '모프'
      case 'traits':
        return '형질'
      case 'colors':
        return '색깔'
      default:
        return ''
    }
  }

  const getCategoryEnum = (tab: string) => {
    switch (tab) {
      case 'morphs':
        return CodeCategory.MORPH
      case 'traits':
        return CodeCategory.TRAIT
      case 'colors':
        return CodeCategory.COLOR
      default:
        return CodeCategory.MORPH
    }
  }

  return (
    <Tabs
      defaultValue="morphs"
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col gap-4 h-full overflow-hidden w-full"
    >
      <div className="shrink-0 flex items-center justify-between px-2 py-2">
        <TabsList className="h-10">
          <TabsTrigger value="morphs" className="px-6">
            모프
          </TabsTrigger>
          <TabsTrigger value="traits" className="px-6">
            형질
          </TabsTrigger>
          <TabsTrigger value="colors" className="px-6">
            색깔
          </TabsTrigger>
        </TabsList>

        <Button size="sm" onClick={() => onAdd(getCategoryEnum(activeTab))}>
          <Plus className="h-4 w-4 mr-1" />새 {getCategoryLabel(activeTab)} 추가
        </Button>
      </div>

      <TabsContent value="morphs" className="flex-1 mt-0 min-h-0">
        <CodeList
          codes={morphs}
          category={CodeCategory.MORPH}
          categoryLabel="모프"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TabsContent>

      <TabsContent value="traits" className="flex-1 mt-0 min-h-0">
        <CodeList
          codes={traits}
          category={CodeCategory.TRAIT}
          categoryLabel="형질"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TabsContent>

      <TabsContent value="colors" className="flex-1 mt-0 min-h-0">
        <CodeList
          codes={colors}
          category={CodeCategory.COLOR}
          categoryLabel="색깔"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TabsContent>
    </Tabs>
  )
}
