# Common Code Patterns

> AI 어시스턴트가 자주 사용하는 코드 패턴 레퍼런스

---

## 📝 Server Action + Service Patterns

### Pattern 1: Create Operation (Service Layer)

**Schema File (`src/actions/[entity]/schemas.ts`):**
```typescript
import { z } from 'zod'

export const createEntitySchema = z.object({
  field1: z.string().min(2),
  field2: z.number().positive(),
})

export type CreateEntityInput = z.infer<typeof createEntitySchema>
```

**Action File (Thin Layer - `src/actions/[entity]/create-entity.ts`):**
```typescript
'use server'

import { createEntitySchema, type CreateEntityInput } from './schemas'
import { createEntityService } from '@/services/entity-service'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type CreateEntityResponse =
  | { success: true; data: Entity }
  | { success: false; error: string }

export async function createEntity(
  input: CreateEntityInput
): Promise<CreateEntityResponse> {
  try {
    // 1. Validation (Actions)
    const validated = createEntitySchema.parse(input)

    // 2. Authorization (Actions)
    // const session = await getSession()
    // if (!session) return { success: false, error: 'Unauthorized' }

    // 3. Business Logic (Service)
    const result = await createEntityService(validated)

    // 4. Cache Revalidation (Actions)
    if (result.success) {
      revalidatePath('/entities')
    }

    return result
  } catch (error) {
    console.error('createEntity error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    return { success: false, error: 'Failed to create entity' }
  }
}
```

**Service File (Business Logic - `src/services/entity-service.ts`):**
```typescript
import { prisma } from '@/lib/prisma'
import { Prisma, type Entity } from '@prisma/client'
import type { CreateEntityInput } from '@/actions/entities/schemas'

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createEntityService(
  data: CreateEntityInput
): Promise<ServiceResponse<Entity>> {
  try {
    const entity = await prisma.entity.create({
      data,
    })

    return { success: true, data: entity }
  } catch (error) {
    console.error('createEntityService error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'Record already exists' }
      }
    }

    return { success: false, error: 'Failed to create entity' }
  }
}
```

---

### Pattern 2: Update Operation

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateSchema = z.object({
  id: z.string().uuid(),
  field1: z.string().min(2).optional(),
  field2: z.number().positive().optional(),
})

export type UpdateInput = z.infer<typeof updateSchema>
export type UpdateResponse =
  | { success: true; data: Entity }
  | { success: false; error: string }

export async function updateEntity(
  input: UpdateInput
): Promise<UpdateResponse> {
  try {
    const validated = updateSchema.parse(input)
    const { id, ...data } = validated

    // Authorization check (if needed)
    // const session = await getSession()
    // const entity = await prisma.entity.findUnique({ where: { id } })
    // if (entity.userId !== session.userId) {
    //   return { success: false, error: 'Unauthorized' }
    // }

    const updated = await prisma.entity.update({
      where: { id },
      data,
    })

    revalidatePath('/entities')
    revalidatePath(`/entities/${id}`)

    return { success: true, data: updated }
  } catch (error) {
    console.error('updateEntity error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'Entity not found' }
      }
    }

    return { success: false, error: 'Failed to update entity' }
  }
}
```

---

### Pattern 3: Delete Operation

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const deleteSchema = z.object({
  id: z.string().uuid(),
})

export type DeleteInput = z.infer<typeof deleteSchema>
export type DeleteResponse =
  | { success: true }
  | { success: false; error: string }

export async function deleteEntity(
  input: DeleteInput
): Promise<DeleteResponse> {
  try {
    const validated = deleteSchema.parse(input)

    // Authorization check (if needed)

    await prisma.entity.delete({
      where: { id: validated.id },
    })

    revalidatePath('/entities')

    return { success: true }
  } catch (error) {
    console.error('deleteEntity error:', error)

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'Entity not found' }
      }
    }

    return { success: false, error: 'Failed to delete entity' }
  }
}
```

---

### Pattern 4: Get Single

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { unstable_cache } from 'next/cache'

const getSchema = z.object({
  id: z.string().uuid(),
})

export type GetInput = z.infer<typeof getSchema>
export type GetResponse =
  | { success: true; data: Entity }
  | { success: false; error: string }

export const getEntity = unstable_cache(
  async (input: GetInput): Promise<GetResponse> => {
    try {
      const validated = getSchema.parse(input)

      const entity = await prisma.entity.findUnique({
        where: { id: validated.id },
        include: {
          // Include relations
        },
      })

      if (!entity) {
        return { success: false, error: 'Entity not found' }
      }

      return { success: true, data: entity }
    } catch (error) {
      console.error('getEntity error:', error)
      return { success: false, error: 'Failed to fetch entity' }
    }
  },
  ['entity'],
  { revalidate: 60 }
)
```

---

### Pattern 5: Get List with Pagination

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { unstable_cache } from 'next/cache'

const getListSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
})

export type GetListInput = z.infer<typeof getListSchema>
export type GetListResponse =
  | {
      success: true
      data: {
        items: Entity[]
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }
  | { success: false; error: string }

export const getEntityList = unstable_cache(
  async (input: GetListInput): Promise<GetListResponse> => {
    try {
      const validated = getListSchema.parse(input)
      const { page, limit, search } = validated
      const skip = (page - 1) * limit

      const where = search
        ? {
            OR: [
              { field1: { contains: search, mode: 'insensitive' as const } },
              { field2: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}

      const [items, total] = await Promise.all([
        prisma.entity.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.entity.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        success: true,
        data: { items, total, page, limit, totalPages },
      }
    } catch (error) {
      console.error('getEntityList error:', error)
      return { success: false, error: 'Failed to fetch entities' }
    }
  },
  ['entities-list'],
  { revalidate: 60 }
)
```

---

## 🎨 Component Patterns

### Pattern 1: Form with Server Action

```typescript
'use client'

import { useActionState } from 'react'
import { createEntity } from '@/actions/entities/create-entity'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function CreateEntityForm() {
  const [state, formAction, isPending] = useActionState(createEntity, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Entity</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field1">Field 1</Label>
            <Input
              id="field1"
              name="field1"
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
            {isPending ? 'Creating...' : 'Create'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

---

### Pattern 2: Table with Data

```typescript
import { Entity } from '@prisma/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface EntityTableProps {
  data: Entity[]
}

export function EntityTable({ data }: EntityTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field 1</TableHead>
            <TableHead>Field 2</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No data found
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.field1}</TableCell>
                <TableCell>{item.field2}</TableCell>
                <TableCell>
                  <Badge>{item.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Edit
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

---

### Pattern 3: Dialog with Form

```typescript
'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { createEntity } from '@/actions/entities/create-entity'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateEntityDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createEntity, null)

  // Close dialog on success
  if (state?.success) {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Entity</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Entity</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field1">Field 1</Label>
            <Input
              id="field1"
              name="field1"
              required
              disabled={isPending}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 📄 Page Patterns

### Pattern 1: List Page (Server Component)

```typescript
import { getEntityList } from '@/actions/entities/get-entity-list'
import { EntityTable } from '@/components/entities/entity-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function EntitiesPage() {
  const result = await getEntityList({ page: 1, limit: 10 })

  if (!result.success) {
    return <div>Error: {result.error}</div>
  }

  return (
    <div className="container mx-auto py-10 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Entities</h1>
        <Button asChild>
          <Link href="/entities/new">Create Entity</Link>
        </Button>
      </div>

      <EntityTable data={result.data.items} />
    </div>
  )
}
```

---

### Pattern 2: Create Page

```typescript
import { CreateEntityForm } from '@/components/entities/create-entity-form'

export default function NewEntityPage() {
  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create New Entity</h1>
      <CreateEntityForm />
    </div>
  )
}
```

---

### Pattern 3: Detail Page

```typescript
import { getEntity } from '@/actions/entities/get-entity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EntityDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getEntity({ id: params.id })

  if (!result.success) {
    notFound()
  }

  const entity = result.data

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{entity.field1}</h1>
        <Button asChild>
          <Link href={`/entities/${entity.id}/edit`}>Edit</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-semibold">Field 1:</span> {entity.field1}
          </div>
          <div>
            <span className="font-semibold">Field 2:</span> {entity.field2}
          </div>
          <div>
            <span className="font-semibold">Status:</span>{' '}
            <Badge>{entity.status}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 📤 File Upload Patterns

### Pattern: Image Upload with R2

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { uploadToR2, deleteFromR2 } from '@/lib/r2'
import { revalidatePath } from 'next/cache'

export async function uploadEntityImage(formData: FormData) {
  try {
    const entityId = formData.get('entityId') as string
    const image = formData.get('image') as File

    if (!entityId || !image) {
      return { success: false, error: 'Missing required fields' }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(image.type)) {
      return { success: false, error: 'Invalid file type' }
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (image.size > maxSize) {
      return { success: false, error: 'File too large (max 5MB)' }
    }

    // Get existing entity
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
    })

    if (!entity) {
      return { success: false, error: 'Entity not found' }
    }

    // Upload to R2
    const key = `entities/${entityId}/${Date.now()}-${image.name}`
    const url = await uploadToR2(key, image, image.type)

    // Delete old image
    if (entity.imageUrl) {
      const oldKey = entity.imageUrl.split('/').slice(-2).join('/')
      await deleteFromR2(oldKey).catch(console.error)
    }

    // Update database
    const updated = await prisma.entity.update({
      where: { id: entityId },
      data: { imageUrl: url },
    })

    revalidatePath('/entities')
    revalidatePath(`/entities/${entityId}`)

    return { success: true, data: updated }
  } catch (error) {
    console.error('uploadEntityImage error:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}
```

**Form Component:**
```typescript
'use client'

import { useActionState } from 'react'
import { uploadEntityImage } from '@/actions/entities/upload-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ImageUploadForm({ entityId }: { entityId: string }) {
  const [state, formAction, isPending] = useActionState(uploadEntityImage, null)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="entityId" value={entityId} />

      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>
        <Input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={isPending}
        />
      </div>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Uploading...' : 'Upload'}
      </Button>
    </form>
  )
}
```

---

## 🔍 Search & Filter Pattern

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function SearchForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      router.push(`/entities?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={isPending}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Searching...' : 'Search'}
      </Button>
    </form>
  )
}
```

---

## 🔐 Authorization Pattern

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function updateEntity(input: UpdateInput) {
  try {
    // 1. Get session
    const session = await getSession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Get entity
    const entity = await prisma.entity.findUnique({
      where: { id: input.id },
    })

    if (!entity) {
      return { success: false, error: 'Entity not found' }
    }

    // 3. Check ownership
    if (entity.userId !== session.userId && session.role !== 'admin') {
      return { success: false, error: 'Forbidden' }
    }

    // 4. Update
    const updated = await prisma.entity.update({
      where: { id: input.id },
      data: input,
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error('updateEntity error:', error)
    return { success: false, error: 'Failed to update entity' }
  }
}
```

---

## 📚 Quick Reference

### shadcn/ui Component Imports

```typescript
// Form
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

// Data Display
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Feedback
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
```

### Common Imports

```typescript
// Next.js
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// React
import { useActionState } from 'react'
import { useState, useTransition } from 'react'

// Validation
import { z } from 'zod'

// Database
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Storage
import { uploadToR2, deleteFromR2 } from '@/lib/r2'
```

---

이 패턴들은 프로젝트 전반에 걸쳐 일관되게 사용되어야 합니다.
