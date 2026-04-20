'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical, Pencil, Heart, List, Trash2 } from 'lucide-react'
import type { CustomerListItem } from '@/services/customer-service'

interface CustomerListTableProps {
  customers: CustomerListItem[]
  onEdit: (customerId: string) => void
  onAdopt: (customerId: string) => void
  onViewAdoptions: (customerId: string) => void
  onDelete: (customerId: string) => void
}

export function CustomerListTable({
  customers,
  onEdit,
  onAdopt,
  onViewAdoptions,
  onDelete,
}: CustomerListTableProps) {
  return (
    <div className="flex flex-col border rounded-lg overflow-hidden h-full">
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary z-10">
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>전화번호</TableHead>
              <TableHead>자택</TableHead>
              <TableHead>총 입양 수</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-[400px] text-center text-muted-foreground">
                  고객이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      className="hover:underline text-left"
                      onClick={() => onViewAdoptions(customer.id)}
                    >
                      {customer.name}
                    </button>
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    {customer.address || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {customer.adoptionCount > 0 ? customer.adoptionCount : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(customer.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          편집
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAdopt(customer.id)}>
                          <Heart className="mr-2 h-4 w-4" />
                          분양
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewAdoptions(customer.id)}>
                          <List className="mr-2 h-4 w-4" />
                          입양내역
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(customer.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
