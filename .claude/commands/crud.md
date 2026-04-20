# Create Complete CRUD

이 커맨드는 Entity의 전체 CRUD (Create, Read, Update, Delete) 작업을 한 번에 생성합니다.

## 작업 단계

1. **Entity 정보 수집**
   - Entity 이름은? (단수형, PascalCase, 예: User, Post, Product)
   - 주요 필드와 타입은?
   - 필수/선택 필드 구분
   - 특수 검증 규칙

2. **Prisma Schema 생성**
   - `schema.prisma`에 추가할 model 생성
   - Relations 정의
   - Unique constraints, indexes

3. **Server Actions 생성**
   - `create-[entity].ts` - 생성
   - `update-[entity].ts` - 수정
   - `delete-[entity].ts` - 삭제
   - `get-[entity].ts` - 단일 조회
   - `get-[entity]-list.ts` - 목록 조회

4. **shadcn/ui 컴포넌트 확인 및 설치**
   - 필요한 컴포넌트 목록 제공
   - 설치 명령어 제공

5. **React 컴포넌트 생성**
   - Form 컴포넌트 (shadcn/ui 사용)
   - Table 컴포넌트 (shadcn/ui table 사용)

6. **Page 예시 제공 (선택)**
   - List page
   - Create page
   - Edit page
   - Detail page

## 예시

### Input

Entity: **Product**

Fields:
- name: string (required, min 2, max 100)
- description: string (required, min 10)
- price: number (required, positive)
- stock: number (required, non-negative, default 0)
- imageUrl: string (optional)
- published: boolean (default false)

Special requirements:
- 이미지 업로드 지원 (R2)
- published=true일 때만 공개 목록에 표시

### Output

#### 1. Prisma Schema

**Add to `prisma/schema.prisma`:**

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String   @db.Text
  price       Float
  stock       Int      @default(0)
  imageUrl    String?
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("products")
}
```

**After adding, run:**
```bash
npx prisma migrate dev --name add_product_model
```

#### 2. Server Actions

생성할 파일들:
```
src/actions/products/
├── create-product.ts
├── update-product.ts
├── delete-product.ts
├── get-product.ts
├── get-product-list.ts
└── upload-product-image.ts
```

**`src/actions/products/create-product.ts`:**
```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10),
  price: z.number().positive(),
  stock: z.number().nonnegative().default(0),
  published: z.boolean().default(false),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type CreateProductResponse =
  | { success: true; data: Product }
  | { success: false; error: string }

export async function createProduct(
  input: CreateProductInput
): Promise<CreateProductResponse> {
  try {
    const validated = createProductSchema.parse(input)

    const product = await prisma.product.create({
      data: validated,
    })

    revalidatePath('/products')

    return { success: true, data: product }
  } catch (error) {
    console.error('createProduct error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    return { success: false, error: 'Failed to create product' }
  }
}
```

(나머지 Server Actions도 TEMPLATES.md 패턴 따라서 생성)

#### 3. shadcn/ui Components Installation

**필요한 컴포넌트:**
```bash
npx shadcn@latest add button input label textarea card alert table badge dialog
```

#### 4. React Components

**`src/components/products/product-form.tsx`:**
```typescript
'use client'

import { useActionState } from 'react'
import { createProduct } from '@/actions/products/create-product'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'

export function ProductForm() {
  const [state, formAction, isPending] = useActionState(createProduct, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Product</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                defaultValue={0}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="published" name="published" disabled={isPending} />
            <Label htmlFor="published">Publish immediately</Label>
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Product'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

**`src/components/products/product-table.tsx`:**
```typescript
import { Product } from '@prisma/client'
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

interface ProductTableProps {
  products: Product[]
}

export function ProductTable({ products }: ProductTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Badge variant={product.published ? 'default' : 'secondary'}>
                    {product.published ? 'Published' : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

#### 5. Page Examples (선택)

**`src/app/products/page.tsx`:**
```typescript
import { getProductList } from '@/actions/products/get-product-list'
import { ProductTable } from '@/components/products/product-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ProductsPage() {
  const result = await getProductList({ page: 1, limit: 10 })

  if (!result.success) {
    return <div>Error loading products</div>
  }

  return (
    <div className="container mx-auto py-10 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/products/new">Create Product</Link>
        </Button>
      </div>

      <ProductTable products={result.data.items} />
    </div>
  )
}
```

## 체크리스트

생성된 CRUD가 다음을 만족하는지 확인:

### Prisma Schema
- [ ] Model 정의
- [ ] Field types 정확
- [ ] Relations 설정
- [ ] Indexes 설정
- [ ] Migration 생성

### Server Actions
- [ ] create-[entity].ts
- [ ] update-[entity].ts
- [ ] delete-[entity].ts
- [ ] get-[entity].ts
- [ ] get-[entity]-list.ts
- [ ] 모두 'use server' directive
- [ ] Zod validation
- [ ] Structured responses
- [ ] Error handling
- [ ] revalidatePath

### Components
- [ ] shadcn/ui 컴포넌트 사용
- [ ] Form component (create/edit)
- [ ] Table component (list)
- [ ] TypeScript types
- [ ] Loading states
- [ ] Error handling

### Integration
- [ ] Server Actions와 Components 연결
- [ ] Import paths (@/*)
- [ ] CONVENTIONS.md 패턴 준수

## 다음 단계

1. **Migration 실행:**
   ```bash
   npx prisma migrate dev --name add_[entity]_model
   ```

2. **shadcn/ui 설치:**
   ```bash
   npx shadcn@latest add [components]
   ```

3. **Pages 생성 (필요시):**
   - List page
   - Create page
   - Edit page
   - Detail page

4. **테스트:**
   - Create 동작 확인
   - Update 동작 확인
   - Delete 동작 확인
   - List 동작 확인

## 참고 문서

- [CONVENTIONS.md](../../../CONVENTIONS.md) - CRUD 패턴
- [TEMPLATES.md](../../../TEMPLATES.md) - 전체 CRUD 예시
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
