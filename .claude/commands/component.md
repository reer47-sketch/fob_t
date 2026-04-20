# Create React Component

이 커맨드는 프로젝트 컨벤션을 따르는 React 컴포넌트를 생성합니다.

## 작업 단계

1. **컴포넌트 정보 수집**
   - 컴포넌트 이름은? (PascalCase, 예: UserProfileCard)
   - 목적/용도는?
   - 어디에 위치할까? (shared / route-specific)

2. **shadcn/ui 컴포넌트 확인 (필수!)**
   - 필요한 UI 기능이 shadcn/ui에 있는지 확인
   - 있으면 설치 명령어 제공: `npx shadcn@latest add [component]`
   - **없는 경우에만** 직접 작성

3. **컴포넌트 타입 결정**
   - Server Component (기본) - 'use client' 불필요
   - Client Component - 'use client' 필요 (interactivity, hooks, event handlers)

4. **Server Action 사용 여부**
   - Form인가? → Server Action import
   - 데이터 표시만? → Server Component로 데이터 fetch

5. **파일 위치 결정**
   - Shared: `src/components/[feature]/[component].tsx`
   - Route-specific: `src/app/[route]/_components/[component].tsx`
   - UI (shadcn): `src/components/ui/[component].tsx` (자동 생성)

## shadcn/ui 우선 규칙 (MANDATORY!)

### Step 1: shadcn/ui 확인

먼저 https://ui.shadcn.com/docs/components 에서 확인:

**Form Components:**
- button, input, textarea, select, checkbox, radio-group, switch, label, form

**Data Display:**
- table, card, badge, avatar, separator, skeleton

**Feedback:**
- alert, dialog, toast, alert-dialog, progress

**Navigation:**
- tabs, dropdown-menu, navigation-menu, breadcrumb, pagination

**Overlay:**
- popover, tooltip, sheet, drawer

### Step 2: 설치

```bash
# 필요한 컴포넌트 설치
npx shadcn@latest add button input card dialog
```

### Step 3: 사용

```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
```

## 예시

### Example 1: Form Component (with Server Action)

**Input:**
- Component: CreateUserForm
- Purpose: 새 유저 생성 폼
- Server Action: @/actions/users/create-user
- shadcn/ui: button, input, label, card, alert

**설치 먼저:**
```bash
npx shadcn@latest add button input label card alert
```

**Output File:** `src/components/users/create-user-form.tsx`

**코드:**
```typescript
'use client'

import { useActionState } from 'react'
import { createUser } from '@/actions/users/create-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(createUser, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              disabled={isPending}
            />
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### Example 2: Display Component (Server Component)

**Input:**
- Component: UserTable
- Purpose: 유저 목록 테이블
- shadcn/ui: table, badge, button

**설치 먼저:**
```bash
npx shadcn@latest add table badge button
```

**Output File:** `src/components/users/user-table.tsx`

**코드:**
```typescript
import { User } from '@prisma/client'
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

interface UserTableProps {
  users: User[]
}

export function UserTable({ users }: UserTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{user.role}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

## 체크리스트

생성된 컴포넌트가 다음을 만족하는지 확인:
- [ ] shadcn/ui 컴포넌트 우선 사용 (커스텀 버튼/인풋 등 만들지 않음)
- [ ] 필요한 shadcn/ui 컴포넌트 설치 명령어 제공
- [ ] 적절한 'use client' directive (필요한 경우만)
- [ ] TypeScript interface for props
- [ ] @/* import paths 사용
- [ ] Tailwind CSS for styling
- [ ] JSDoc 주석 (복잡한 로직)
- [ ] Server Action과 연동 시 useActionState 사용

## 금지사항

### ❌ 절대 하지 말 것

```typescript
// ❌ WRONG - Custom button (shadcn/ui 있는데 직접 만듦)
export function CustomButton() {
  return <button className="px-4 py-2 bg-blue-500...">Click</button>
}

// ❌ WRONG - Custom input
export function CustomInput() {
  return <input className="border rounded..." />
}

// ❌ WRONG - Custom card
export function CustomCard({ children }) {
  return <div className="border rounded shadow...">{children}</div>
}
```

### ✅ 올바른 방법

```typescript
// ✅ CORRECT - Use shadcn/ui
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  )
}
```

## 참고 문서

- [CONVENTIONS.md](../../../CONVENTIONS.md) - Component 패턴
- [TEMPLATES.md](../../../TEMPLATES.md) - 컴포넌트 템플릿
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
