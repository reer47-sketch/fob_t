'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoreVertical, CheckCircle, XCircle, Ban, PlayCircle, Trash2, RotateCcw } from 'lucide-react'
import type { UserListItem } from '@/services/user-service'
import type { UserPlan } from '@prisma/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface UserListTableProps {
  users: UserListItem[]
  onStatusChange: (userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'DELETED') => void
  onPlanChange: (userId: string, plan: UserPlan) => void
}

const roleLabels: Record<string, string> = {
  ADMIN: '관리자',
  BREEDER: '브리더',
  CLIENT: '고객',
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  PENDING: { label: '승인대기', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  ACTIVE: { label: '활성', variant: 'default', className: 'bg-green-100 text-green-800 border-green-300' },
  REJECTED: { label: '거부', variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300' },
  SUSPENDED: { label: '정지', variant: 'outline', className: 'bg-orange-100 text-orange-800 border-orange-300' },
  DELETED: { label: '삭제', variant: 'destructive', className: 'bg-gray-100 text-gray-800 border-gray-300' },
}

const planLabels: Record<string, { label: string; className: string }> = {
  FREE: { label: 'Free', className: 'bg-gray-100 text-gray-600 border-gray-300' },
  PRO: { label: 'Pro', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  PREMIUM: { label: 'Premium', className: 'bg-purple-100 text-purple-700 border-purple-300' },
}

export function UserListTable({ users, onStatusChange, onPlanChange }: UserListTableProps) {
  return (
    <div className="border rounded-lg h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>이메일</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>역할</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>플랜</TableHead>
            <TableHead>샵코드</TableHead>
            <TableHead>전화번호</TableHead>
            <TableHead>가입일</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                검색 결과가 없습니다
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.name || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{roleLabels[user.role]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusLabels[user.status].variant}
                    className={statusLabels[user.status].className}
                  >
                    {statusLabels[user.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.role === 'BREEDER' ? (
                    <Select
                      value={user.plan}
                      onValueChange={(value) => onPlanChange(user.id, value as UserPlan)}
                    >
                      <SelectTrigger className="h-7 w-[100px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="PRO">Pro</SelectItem>
                        <SelectItem value="PREMIUM">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{user.shopCode || '-'}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  {format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                </TableCell>
                <TableCell>
                  {user.role !== 'ADMIN' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.status === 'PENDING' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => onStatusChange(user.id, 'ACTIVE')}
                              className="text-green-600 focus:text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              승인하기
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onStatusChange(user.id, 'REJECTED')}
                              className="text-red-600 focus:text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2 text-red-600" />
                              거부하기
                            </DropdownMenuItem>
                          </>
                        )}
                        {user.status === 'ACTIVE' && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(user.id, 'SUSPENDED')}
                            className="text-orange-600 focus:text-orange-600"
                          >
                            <Ban className="h-4 w-4 mr-2 text-orange-600" />
                            정지하기
                          </DropdownMenuItem>
                        )}
                        {user.status === 'SUSPENDED' && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(user.id, 'ACTIVE')}
                            className="text-green-600 focus:text-green-600"
                          >
                            <PlayCircle className="h-4 w-4 mr-2 text-green-600" />
                            활성화하기
                          </DropdownMenuItem>
                        )}
                        {user.status === 'REJECTED' && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(user.id, 'ACTIVE')}
                            className="text-green-600 focus:text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            승인하기
                          </DropdownMenuItem>
                        )}
                        {user.status === 'DELETED' ? (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(user.id, 'ACTIVE')}
                            className="text-blue-600 focus:text-blue-600"
                          >
                            <RotateCcw className="h-4 w-4 mr-2 text-blue-600" />
                            복원하기
                          </DropdownMenuItem>
                        ) : (
                          user.status !== 'PENDING' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onStatusChange(user.id, 'DELETED')}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                                삭제하기
                              </DropdownMenuItem>
                            </>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
