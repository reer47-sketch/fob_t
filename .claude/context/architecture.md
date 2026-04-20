# POB Architecture Context

> AI 어시스턴트가 프로젝트 아키텍처를 이해하기 위한 컨텍스트 문서

---

## 🎯 Core Architectural Principle

### Server Actions First (95% / 5% Rule)

**PRIMARY (95%): Server Actions**
- 모든 CRUD operations
- Form submissions
- Data mutations
- Client-initiated data fetching
- File uploads
- Authentication actions

**SECONDARY (5%): API Routes**
- Webhook endpoints (Stripe, payment providers, etc.)
- Third-party service callbacks
- Public APIs for external consumption (rare)

**Why Server Actions?**
1. **Type Safety**: End-to-end TypeScript inference
2. **Simplicity**: Direct function calls, no API layer
3. **Security**: POST-only, built-in CSRF protection
4. **Performance**: Server Components by default, smaller bundles
5. **Developer Experience**: Less boilerplate, faster iteration

---

## 🏗️ Project Structure

```
src/
├── actions/              # Server Actions (얇은 레이어)
│   ├── users/
│   │   ├── schemas.ts        # Zod schemas
│   │   ├── create-user.ts    # Validation + Service 호출
│   │   ├── update-user.ts
│   │   ├── delete-user.ts
│   │   ├── get-user.ts
│   │   └── get-user-list.ts
│   ├── posts/
│   └── auth/
│
├── services/            # Business Logic Layer (MANDATORY!)
│   ├── user-service.ts       # User 비즈니스 로직
│   ├── post-service.ts       # Post 비즈니스 로직
│   └── auth-service.ts       # Auth 비즈니스 로직
│
├── app/                  # Next.js App Router
│   ├── (routes)/
│   │   ├── page.tsx          # Server Component (default)
│   │   ├── layout.tsx
│   │   └── _components/      # Route-private components
│   │       └── form.tsx      # Client Component (if interactive)
│   └── api/                  # API Routes (SECONDARY - 5%)
│       └── webhooks/         # Webhooks ONLY!
│           └── stripe/
│               └── route.ts
│
├── components/          # Shared components
│   ├── ui/              # shadcn/ui components (ALWAYS USE THESE!)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── [feature]/       # Custom feature components
│       └── user-profile-card.tsx
│
└── lib/                 # Utilities & configurations
    ├── prisma.ts        # Database client singleton
    ├── r2.ts            # Cloudflare R2 file storage
    └── utils.ts         # Helper functions
```

**레이어 역할:**
- **Actions**: Validation (Zod), Authorization, Cache revalidation, Service 호출
- **Services**: Database operations (Prisma), Business logic, Error handling

---

## 🔄 Data Flow (Service Layer Pattern)

### Standard Flow

```
1. Client Component (form, button click)
        ↓
2. Server Action ('use server')
        ↓
3. Validation (Zod) ← Actions Layer
        ↓
4. Authorization ← Actions Layer
        ↓
5. Service Call ← Actions Layer
        ↓
6. Business Logic ← Service Layer
        ↓
7. Database (Prisma) ← Service Layer
        ↓
8. Return to Action ← Service Layer
        ↓
9. Cache Revalidation (revalidatePath) ← Actions Layer
        ↓
10. Return Structured Response
        ↓
11. Client handles success/error
```

### Example

**Client Component:**
```typescript
'use client'
import { useActionState } from 'react'
import { createUser } from '@/actions/users/create-user'

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(createUser, null)

  return (
    <form action={formAction}>
      {/* form fields */}
    </form>
  )
}
```

**Server Action (Thin Layer):**
```typescript
'use server'
import { createUserSchema } from './schemas'
import { createUserService } from '@/services/user-service'
import { revalidatePath } from 'next/cache'

export async function createUser(input: CreateUserInput) {
  // 1. Validate (Actions)
  const validated = createUserSchema.parse(input)

  // 2. Authorization (Actions)
  // const session = await getSession()
  // if (!session) return { success: false, error: 'Unauthorized' }

  // 3. Business Logic (Service)
  const result = await createUserService(validated)

  // 4. Revalidate (Actions)
  if (result.success) {
    revalidatePath('/users')
  }

  // 5. Return
  return result
}
```

**Service (Business Logic):**
```typescript
import { prisma } from '@/lib/prisma'

export async function createUserService(data: CreateUserInput) {
  try {
    const user = await prisma.user.create({ data })
    return { success: true, data: user }
  } catch (error) {
    // Handle Prisma errors
    return { success: false, error: 'Failed to create user' }
  }
}
```

---

## 🎨 UI Architecture

### shadcn/ui First (MANDATORY)

**Rule:** 모든 UI 컴포넌트는 shadcn/ui를 우선 사용

**Available Components:**
- Form: button, input, textarea, select, checkbox, radio-group, switch, label
- Data: table, card, badge, avatar, separator, skeleton
- Feedback: alert, dialog, toast, alert-dialog, progress
- Navigation: tabs, dropdown-menu, navigation-menu, breadcrumb, pagination
- Overlay: popover, tooltip, sheet, drawer

**Installation:**
```bash
npx shadcn@latest add button input card dialog
```

**Usage:**
```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
```

**❌ NEVER do this:**
```typescript
// Don't create custom Button/Input/Card
export function CustomButton() {
  return <button className="...">
}
```

---

## 💾 Database Architecture

### Prisma ORM

**Client Location:** `@/lib/prisma`

**Schema Location:** `prisma/schema.prisma`

**Generated Client:** `src/generated/prisma` (custom output path)

**Best Practices:**
```typescript
// ✅ Include relations you need
const post = await prisma.post.findUnique({
  where: { id },
  include: {
    author: true,
    comments: true,
  },
})

// ✅ Use select for specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    // Don't include password hash!
  },
})

// ✅ Use transactions for multi-step operations
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data })
  await tx.product.update({ where: { id }, data })
})
```

---

## 📦 File Storage Architecture

### Cloudflare R2 (S3-compatible)

**Client Location:** `@/lib/r2`

**Upload Pattern:**
```typescript
import { uploadToR2, deleteFromR2 } from '@/lib/r2'

// Upload
const url = await uploadToR2(
  `products/${productId}/${Date.now()}-${file.name}`,
  file,
  file.type
)

// Delete
await deleteFromR2(key)
```

**Key Pattern:** `[entity]/[id]/[timestamp]-[filename]`

**Validation:**
- File type check
- File size limit
- Unique key generation

---

## 🔒 Authentication & Authorization

### Pattern

**Authentication Check:**
```typescript
'use server'
import { getSession } from '@/lib/auth'

export async function protectedAction() {
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }
  // ...
}
```

**Authorization Check:**
```typescript
export async function updatePost(input: UpdatePostInput) {
  const session = await getSession()
  const post = await prisma.post.findUnique({ where: { id: input.id } })

  if (post.authorId !== session.userId) {
    return { success: false, error: 'Forbidden' }
  }
  // ...
}
```

---

## 📝 Response Pattern

### Structured Responses (MANDATORY)

**Type Definition:**
```typescript
export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }
```

**Usage:**
```typescript
export type CreateUserResponse = ActionResponse<User>

export async function createUser(
  input: CreateUserInput
): Promise<CreateUserResponse> {
  try {
    const user = await prisma.user.create({ data: input })
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: 'Failed to create user' }
  }
}
```

**Why?**
- Consistent error handling
- Type-safe on client side
- Easy to handle in UI

---

## 🔄 Cache Strategy

### Revalidation Pattern

**After Mutations:**
```typescript
import { revalidatePath, revalidateTag } from 'next/cache'

// Revalidate specific path
revalidatePath('/users')

// Revalidate multiple paths
revalidatePath('/users')
revalidatePath(`/users/${userId}`)

// Revalidate by tag
revalidateTag('users')
```

**For Reads (optional):**
```typescript
import { unstable_cache } from 'next/cache'

export const getUser = unstable_cache(
  async (id: string) => {
    return await prisma.user.findUnique({ where: { id } })
  },
  ['user'],
  { revalidate: 60 } // Cache for 60 seconds
)
```

---

## 🛡️ Security Architecture

### Input Validation

**Always use Zod:**
```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
})
```

### SQL Injection Prevention

**Always use Prisma (NO raw SQL):**
```typescript
// ✅ Safe
await prisma.user.findUnique({ where: { email: input.email } })

// ❌ Dangerous (avoid)
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`
```

### File Upload Security

```typescript
// Validate type
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
if (!allowedTypes.includes(file.type)) {
  return { success: false, error: 'Invalid file type' }
}

// Validate size (5MB)
const maxSize = 5 * 1024 * 1024
if (file.size > maxSize) {
  return { success: false, error: 'File too large' }
}

// Generate unique key
const key = `${entity}/${id}/${Date.now()}-${crypto.randomUUID()}.${ext}`
```

---

## 🧩 Component Architecture

### Server Components (Default)

**Use for:**
- Data fetching
- Static content
- SEO-important content

```typescript
// No 'use client' needed
export default async function UsersPage() {
  const users = await getUsers()
  return <UserTable users={users} />
}
```

### Client Components

**Use ONLY for:**
- Interactivity (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser APIs (localStorage, window, etc.)

```typescript
'use client'

import { useState } from 'react'

export function InteractiveComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

---

## 📚 Key Files Reference

### Configuration
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `components.json` - shadcn/ui configuration
- `prisma/schema.prisma` - Database schema

### Core Libraries
- `src/lib/prisma.ts` - Database client
- `src/lib/r2.ts` - File storage client
- `src/lib/utils.ts` - Utility functions

### Type Definitions
- `src/types/index.ts` - Common types
- Action files export their own types

---

## 🚀 Development Workflow

### 1. Create Feature

1. **Prisma Schema** → 2. **Server Actions** → 3. **Components** → 4. **Pages**

### 2. Migration Path

```bash
# Database changes
npx prisma migrate dev --name add_feature

# Install UI components
npx shadcn@latest add button input card

# Create Server Actions
# Create Components
# Create Pages
```

### 3. Testing Flow

1. Test Server Actions directly (in UI)
2. Test Components with Server Actions
3. Test full pages

---

## 🤖 AI Assistant Guidelines

**When generating code, AI MUST:**

1. ✅ Use Server Actions (95%) - NOT API routes
2. ✅ Use shadcn/ui components - Check and install first
3. ✅ Include 'use server' directive
4. ✅ Validate with Zod
5. ✅ Return structured responses
6. ✅ Handle errors with try-catch
7. ✅ Revalidate cache after mutations
8. ✅ Use @/* import paths
9. ✅ Add TypeScript types
10. ✅ Follow CONVENTIONS.md patterns

**NEVER:**
- ❌ Create API routes for CRUD
- ❌ Create custom Button/Input/Card (use shadcn/ui)
- ❌ Skip validation
- ❌ Return unstructured responses
- ❌ Forget 'use server' directive
- ❌ Use relative import paths

---

## 📖 Related Documentation

- [CONVENTIONS.md](../../CONVENTIONS.md) - Detailed conventions
- [TEMPLATES.md](../../TEMPLATES.md) - Code templates
- [AI_PROMPTING.md](../../AI_PROMPTING.md) - AI usage guide
- [README.md](../../README.md) - Project overview
