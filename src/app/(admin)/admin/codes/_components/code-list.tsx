'use client'

import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { CodeCategory } from '@prisma/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

type CodeListProps = {
  codes: Code[]
  category: CodeCategory
  categoryLabel: string
  onEdit: (code: Code) => void
  onDelete: (id: string) => void
}

export function CodeList({ codes, categoryLabel, onEdit, onDelete }: CodeListProps) {
  return (
    <div className="flex flex-col border rounded-lg overflow-hidden h-full mx-2">
      <div className="overflow-auto flex-1">
        {codes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            등록된 {categoryLabel}가 없습니다
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-secondary z-10">
              <TableRow>
                <TableHead className="w-[80px]">순서</TableHead>
                <TableHead className="w-[100px]">코드</TableHead>
                <TableHead>이름</TableHead>
                <TableHead className="w-[300px]">설명</TableHead>
                <TableHead className="w-[100px] text-center">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="text-center">{code.displayOrder}</TableCell>
                  <TableCell className="font-mono font-medium">{code.code}</TableCell>
                  <TableCell>{code.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {code.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(code)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(code.id)}
                        disabled={code._count.animalCodes > 0}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
