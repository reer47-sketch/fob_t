# Create Server Action + Service

이 커맨드는 Service Layer 패턴을 따르는 Server Action과 Service를 생성합니다.

## 작업 단계

1. **Entity와 Operation 확인**
   - Entity 이름이 무엇인가요? (예: User, Post, Product)
   - Operation은 무엇인가요? (create, update, delete, get, list 중 선택)

2. **필드 정보 수집**
   - 어떤 필드가 필요한가요?
   - 각 필드의 타입은 무엇인가요?
   - 필수(required) 필드와 선택(optional) 필드는?
   - 특수 검증 규칙이 있나요?

3. **파일 생성 (3개)**
   - Schema: `src/actions/[entity]/schemas.ts` (첫 operation이면)
   - Action: `src/actions/[entity]/[verb]-[entity].ts`
   - Service: `src/services/[entity]-service.ts` (첫 operation이면)

4. **Schema 파일** (`schemas.ts`)
   - Zod validation schema
   - TypeScript type exports

5. **Action 파일** (얇은 레이어)
   - `'use server'` directive
   - Validation (Zod)
   - Authorization checks
   - Service 호출
   - Cache revalidation
   - Structured response

6. **Service 파일** (비즈니스 로직)
   - Database operations (Prisma)
   - Business logic
   - Error handling
   - Structured response

7. **TEMPLATES.md 패턴 따르기**
   - Schema Template
   - Server Action Template (Thin Layer)
   - Service Template (Business Logic)

## 예시

**Input:**
- Entity: User
- Operation: create
- Fields:
  - email: string (required, unique, email format)
  - name: string (required, min 2 characters)
  - role: enum (admin | user, default: user)

**Output Files:**

1. `src/actions/users/schemas.ts`
2. `src/actions/users/create-user.ts`
3. `src/services/user-service.ts`

**코드 스니펫:**

**1. Schema (`schemas.ts`):**
```typescript
import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'user']).default('user'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
```

**2. Action (얇은 레이어):**
```typescript
'use server'

import { createUserSchema, type CreateUserInput } from './schemas'
import { createUserService } from '@/services/user-service'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type CreateUserResponse =
  | { success: true; data: User }
  | { success: false; error: string }

export async function createUser(
  input: CreateUserInput
): Promise<CreateUserResponse> {
  try {
    // 1. Validation
    const validated = createUserSchema.parse(input)

    // 2. Authorization (if needed)
    // const session = await getSession()
    // if (!session) return { success: false, error: 'Unauthorized' }

    // 3. Business Logic (Service)
    const result = await createUserService(validated)

    // 4. Cache Revalidation
    if (result.success) {
      revalidatePath('/users')
    }

    return result
  } catch (error) {
    console.error('createUser error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    return { success: false, error: 'Failed to create user' }
  }
}
```

**3. Service (비즈니스 로직):**
```typescript
import { prisma } from '@/lib/prisma'
import { Prisma, type User } from '@prisma/client'
import type { CreateUserInput } from '@/actions/users/schemas'

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createUserService(
  data: CreateUserInput
): Promise<ServiceResponse<User>> {
  try {
    const user = await prisma.user.create({
      data,
    })

    return { success: true, data: user }
  } catch (error) {
    console.error('createUserService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'Email already exists' }
      }
    }

    return { success: false, error: 'Failed to create user' }
  }
}
```

## 체크리스트

생성된 파일들이 다음을 만족하는지 확인:

**Schema 파일:**
- [ ] Zod schemas 정의
- [ ] Type exports
- [ ] @/* import paths

**Action 파일:**
- [ ] 'use server' directive 있음
- [ ] Schema import
- [ ] Service 호출
- [ ] Validation (Actions 레이어)
- [ ] Authorization check (Actions 레이어, if needed)
- [ ] Cache revalidation (Actions 레이어)
- [ ] Error handling (try-catch)
- [ ] Structured response
- [ ] @/* import paths

**Service 파일:**
- [ ] Prisma operations (Service 레이어)
- [ ] Business logic (Service 레이어)
- [ ] Prisma error handling
- [ ] Structured response
- [ ] No 'use server' (Service는 일반 함수)
- [ ] @/* import paths

## 참고 문서

- [CONVENTIONS.md](../../../CONVENTIONS.md) - Server Action 패턴
- [TEMPLATES.md](../../../TEMPLATES.md) - 코드 템플릿
