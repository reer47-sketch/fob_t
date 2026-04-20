# Code Review

이 커맨드는 현재 코드를 프로젝트 컨벤션에 따라 리뷰합니다.

## 리뷰 체크리스트

### 1. Server Actions vs API Routes (95%/5% Rule)

**확인 항목:**
- [ ] CRUD 작업이 Server Actions로 구현되었는가?
- [ ] API Routes가 있다면, Webhook 전용인가?
- [ ] 불필요한 `app/api/` 경로가 있는가?

**❌ 잘못된 패턴:**
```typescript
// app/api/users/route.ts - CRUD에 API Route 사용
export async function POST(req: Request) {
  const body = await req.json()
  const user = await prisma.user.create({ data: body })
  return Response.json(user)
}
```

**✅ 올바른 패턴:**
```typescript
// actions/users/create-user.ts - Server Action 사용
'use server'
export async function createUser(input: CreateUserInput) {
  // ...
}
```

---

### 2. shadcn/ui Components First

**확인 항목:**
- [ ] 커스텀 Button/Input/Card 등을 만들지 않았는가?
- [ ] shadcn/ui 컴포넌트를 사용하고 있는가?
- [ ] 새로운 UI가 필요하면 shadcn/ui부터 확인했는가?

**❌ 잘못된 패턴:**
```typescript
// 커스텀 버튼 만들지 말 것!
export function CustomButton() {
  return <button className="px-4 py-2 bg-blue-500...">Click</button>
}
```

**✅ 올바른 패턴:**
```typescript
import { Button } from '@/components/ui/button'

export function MyComponent() {
  return <Button>Click</Button>
}
```

**개선 방안:**
```bash
# shadcn/ui 컴포넌트 설치
npx shadcn@latest add button input card
```

---

### 3. 'use server' Directive

**확인 항목:**
- [ ] 모든 Server Action 파일에 'use server'가 있는가?
- [ ] 파일 맨 위에 위치하는가?

**❌ 잘못된 패턴:**
```typescript
// actions/users/create-user.ts
import { prisma } from '@/lib/prisma'

export async function createUser() { // 'use server' 없음!
  // ...
}
```

**✅ 올바른 패턴:**
```typescript
'use server' // 맨 위!

import { prisma } from '@/lib/prisma'

export async function createUser() {
  // ...
}
```

---

### 4. Input Validation

**확인 항목:**
- [ ] 모든 Server Action에 Zod 검증이 있는가?
- [ ] Input type이 Zod schema에서 infer되는가?
- [ ] 검증 에러를 적절히 처리하는가?

**❌ 잘못된 패턴:**
```typescript
// 검증 없음!
export async function createUser(input: any) {
  await prisma.user.create({ data: input })
}
```

**✅ 올바른 패턴:**
```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export async function createUser(input: CreateUserInput) {
  const validated = createUserSchema.parse(input)
  // ...
}
```

---

### 5. Structured Responses

**확인 항목:**
- [ ] 모든 Server Action이 structured response를 반환하는가?
- [ ] `{ success: boolean, data?: T, error?: string }` 형태인가?

**❌ 잘못된 패턴:**
```typescript
// 그냥 데이터만 반환
export async function createUser(input: CreateUserInput) {
  const user = await prisma.user.create({ data: input })
  return user
}

// 또는 에러를 throw
export async function createUser(input: CreateUserInput) {
  throw new Error('Something went wrong')
}
```

**✅ 올바른 패턴:**
```typescript
export type CreateUserResponse =
  | { success: true; data: User }
  | { success: false; error: string }

export async function createUser(input: CreateUserInput): Promise<CreateUserResponse> {
  try {
    const user = await prisma.user.create({ data: input })
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: 'Failed to create user' }
  }
}
```

---

### 6. Error Handling

**확인 항목:**
- [ ] try-catch로 감싸져 있는가?
- [ ] Zod validation 에러를 처리하는가?
- [ ] Prisma 에러를 처리하는가?
- [ ] Generic error를 처리하는가?
- [ ] 에러를 console.error로 로깅하는가?

**❌ 잘못된 패턴:**
```typescript
// try-catch 없음
export async function createUser(input: CreateUserInput) {
  const validated = createUserSchema.parse(input) // Zod 에러 처리 안 함
  const user = await prisma.user.create({ data: validated }) // Prisma 에러 처리 안 함
  return user
}
```

**✅ 올바른 패턴:**
```typescript
export async function createUser(input: CreateUserInput) {
  try {
    const validated = createUserSchema.parse(input)
    const user = await prisma.user.create({ data: validated })
    return { success: true, data: user }
  } catch (error) {
    console.error('createUser error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'Already exists' }
      }
    }

    return { success: false, error: 'Failed to create user' }
  }
}
```

---

### 7. Cache Revalidation

**확인 항목:**
- [ ] Mutation 후 `revalidatePath`를 호출하는가?
- [ ] 적절한 경로를 revalidate하는가?

**❌ 잘못된 패턴:**
```typescript
export async function createUser(input: CreateUserInput) {
  const user = await prisma.user.create({ data: input })
  // revalidatePath 없음!
  return { success: true, data: user }
}
```

**✅ 올바른 패턴:**
```typescript
export async function createUser(input: CreateUserInput) {
  const user = await prisma.user.create({ data: input })
  revalidatePath('/users') // 목록 페이지 revalidate
  return { success: true, data: user }
}

export async function updateUser(input: UpdateUserInput) {
  const user = await prisma.user.update({ where: { id }, data })
  revalidatePath('/users') // 목록 페이지
  revalidatePath(`/users/${id}`) // 상세 페이지
  return { success: true, data: user }
}
```

---

### 8. Import Paths

**확인 항목:**
- [ ] `@/*` alias를 사용하는가?
- [ ] 상대 경로를 사용하지 않는가?

**❌ 잘못된 패턴:**
```typescript
import { prisma } from '../../lib/prisma'
import { Button } from '../ui/button'
import { createUser } from './create-user'
```

**✅ 올바른 패턴:**
```typescript
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { createUser } from '@/actions/users/create-user'
```

---

### 9. TypeScript Types

**확인 항목:**
- [ ] 모든 함수에 type annotation이 있는가?
- [ ] `any` 타입을 사용하지 않는가?
- [ ] Props에 interface를 정의했는가?

**❌ 잘못된 패턴:**
```typescript
export async function createUser(input: any) { // any 사용!
  // ...
}

export function UserForm({ onSubmit }) { // Props 타입 없음!
  // ...
}
```

**✅ 올바른 패턴:**
```typescript
export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreateUserResponse = ...

export async function createUser(
  input: CreateUserInput
): Promise<CreateUserResponse> {
  // ...
}

interface UserFormProps {
  onSubmit?: (data: User) => void
  defaultValues?: Partial<User>
}

export function UserForm({ onSubmit, defaultValues }: UserFormProps) {
  // ...
}
```

---

### 10. File Naming & Location

**확인 항목:**
- [ ] Server Action: `src/actions/[entity]/[verb]-[entity].ts`
- [ ] Component: `src/components/[feature]/[component].tsx`
- [ ] shadcn/ui: `src/components/ui/[component].tsx`

**❌ 잘못된 패턴:**
```
src/actions/userActions.ts  // 단수 파일에 여러 액션
src/components/form.tsx     // 이름이 너무 generic
```

**✅ 올바른 패턴:**
```
src/actions/users/create-user.ts
src/actions/users/update-user.ts
src/components/users/user-form.tsx
src/components/ui/button.tsx
```

---

### 11. Security

**확인 항목:**
- [ ] Authorization check가 필요한 곳에 있는가?
- [ ] 파일 업로드 시 타입/크기 검증을 하는가?
- [ ] SQL Injection 방지 (Prisma 사용, raw query 없음)
- [ ] 민감한 데이터 (password hash 등) select에서 제외?

**❌ 잘못된 패턴:**
```typescript
// Authorization 없음!
export async function deleteUser(input: DeleteUserInput) {
  await prisma.user.delete({ where: { id: input.id } })
}

// 파일 검증 없음!
export async function uploadFile(file: File) {
  await uploadToR2(key, file) // 타입/크기 체크 없음
}

// Password hash 노출!
const user = await prisma.user.findUnique({ where: { id } })
return user // password hash 포함!
```

**✅ 올바른 패턴:**
```typescript
export async function deleteUser(input: DeleteUserInput) {
  // Authorization check
  const session = await getSession()
  const user = await prisma.user.findUnique({ where: { id: input.id } })
  if (user.id !== session.userId && session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  await prisma.user.delete({ where: { id: input.id } })
}

export async function uploadFile(file: File) {
  // File validation
  const allowedTypes = ['image/jpeg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type' }
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { success: false, error: 'File too large' }
  }

  await uploadToR2(key, file, file.type)
}

const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    // password 제외!
  }
})
```

---

## 리뷰 결과 포맷

리뷰 결과는 다음 형식으로 제공:

```markdown
## 코드 리뷰 결과

### ✅ 잘된 점
- Server Actions 사용
- Zod validation 적용
- ...

### ⚠️ 개선 필요
1. **API Route 대신 Server Action 사용**
   - 위치: `app/api/users/route.ts`
   - 문제: CRUD에 API Route 사용
   - 해결: Server Action으로 이동

2. **shadcn/ui 컴포넌트 사용**
   - 위치: `components/custom-button.tsx`
   - 문제: 커스텀 버튼 생성
   - 해결: `import { Button } from '@/components/ui/button'` 사용

3. **Validation 추가**
   - 위치: `actions/users/create-user.ts`
   - 문제: Zod validation 없음
   - 해결: createUserSchema 추가

### 🚨 Critical Issues
- [ ] Authorization 없음
- [ ] SQL Injection 가능성
- [ ] 민감 데이터 노출

### 📝 권장사항
- CONVENTIONS.md 패턴 준수
- TEMPLATES.md 템플릿 사용
- ...
```

---

## 참고 문서

- [CONVENTIONS.md](../../../CONVENTIONS.md) - 모든 컨벤션
- [TEMPLATES.md](../../../TEMPLATES.md) - 올바른 패턴
- [AI_PROMPTING.md](../../../AI_PROMPTING.md) - Common pitfalls
