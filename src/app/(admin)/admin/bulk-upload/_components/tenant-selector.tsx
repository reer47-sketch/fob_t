'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Tenant {
  id: string
  name: string
  slug: string | null
  users: Array<{ name: string | null }>
}

interface TenantSelectorProps {
  tenants: Tenant[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function TenantSelector({ tenants, value, onChange, disabled }: TenantSelectorProps) {
  const [open, setOpen] = useState(false)

  const selected = tenants.find((t) => t.id === value)
  const displayLabel = selected
    ? `${selected.name} — ${selected.users[0]?.name || ''}`
    : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size="sm"
          className="w-[320px] justify-between font-normal"
          disabled={disabled}
        >
          {value ? displayLabel : '파트너사 선택...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="샵 이름, 슬러그로 검색..." />
            <CommandList>
              <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
              <CommandGroup>
                {tenants.map((tenant) => {
                  const label = `${tenant.name} ${tenant.slug || ''} ${tenant.users[0]?.name || ''}`
                  return (
                    <CommandItem
                      key={tenant.id}
                      value={label}
                      onSelect={() => {
                        onChange(tenant.id)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === tenant.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="font-medium">{tenant.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        {tenant.users[0]?.name || ''}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
  )
}
