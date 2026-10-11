
'use client'

import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2, RotateCcw, Search } from 'lucide-react'

import { STATUS_OPTIONS } from '@/components/app/badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ALL = '__all__'

export function FilterBar({
  customers,
  showSearch = false,
  showCustomer = true,
  showStatus = true,
  searchPlaceholder = 'Cari No Return, Surat Jalan, Claim, Customer',
}: {
  customers?: string[]
  showSearch?: boolean
  showCustomer?: boolean
  showStatus?: boolean
  searchPlaceholder?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [pending, startTransition] = useTransition()

  const [q, setQ] = useState(params.get('q') ?? '')
  const [from, setFrom] = useState(params.get('from') ?? '')
  const [to, setTo] = useState(params.get('to') ?? '')
  const [customer, setCustomer] = useState(
    params.get('customer') ?? ALL,
  )
  const [status, setStatus] = useState(
    params.get('status') ?? ALL,
  )

  const apply = () => {
    const values = { q, from, to, customer, status }
    const next = new URLSearchParams()

    for (const [key, value] of Object.entries(values)) {
      if (value && value !== ALL) {
        next.set(key, value)
      }
    }

    startTransition(() => {
      router.push(
        next.toString() ? `${pathname}?${next}` : pathname,
      )
    })
  }

  const reset = () => {
    setQ('')
    setFrom('')
    setTo('')
    setCustomer(ALL)
    setStatus(ALL)

    startTransition(() => {
      router.push(pathname)
    })
  }

  const customerItems = [
    { value: ALL, label: 'Semua Customer' },
    ...(customers ?? []).map((customer) => ({
      value: customer,
      label: customer,
    })),
  ]

  const statusItems = [
    { value: ALL, label: 'Semua Status' },
    ...STATUS_OPTIONS,
  ]

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        apply()
      }}
      className="
        grid grid-cols-2 items-end gap-2
        rounded-md border bg-card p-3
        sm:flex sm:flex-wrap sm:gap-2
      "
    >
      {showSearch && (
        <div className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1 sm:min-w-[220px] sm:flex-1">
          <Label
            htmlFor="filter-q"
            className="text-xs text-muted-foreground"
          >
            Pencarian
          </Label>

          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="filter-q"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full min-w-0 pl-8 text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-1 sm:w-[118px] sm:shrink-0">
        <Label
          htmlFor="filter-from"
          className="text-xs text-muted-foreground"
        >
          Dari
        </Label>
        <Input
          id="filter-from"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className="h-9 w-full min-w-0 px-1.5 text-xs"
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1 sm:w-[118px] sm:shrink-0">
        <Label
          htmlFor="filter-to"
          className="text-xs text-muted-foreground"
        >
          Sampai
        </Label>
        <Input
          id="filter-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => setTo(event.target.value)}
          className="h-9 w-full min-w-0 px-1.5 text-xs"
        />
      </div>

      {showCustomer && (
        <div className="flex min-w-0 flex-col gap-1 sm:w-[145px] sm:shrink-0">
          <Label className="text-xs text-muted-foreground">
            Customer
          </Label>

          <Select
            items={customerItems}
            value={customer}
            onValueChange={(value) =>
              setCustomer((value as string) ?? ALL)
            }
          >
            <SelectTrigger
              aria-label="Filter customer"
              className="h-9 w-full min-w-0 px-2 text-xs"
            >
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {customerItems.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="text-xs"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showStatus && (
        <div className="flex min-w-0 flex-col gap-1 sm:w-[125px] sm:shrink-0">
          <Label className="text-xs text-muted-foreground">
            Status
          </Label>

          <Select
            items={statusItems}
            value={status}
            onValueChange={(value) =>
              setStatus((value as string) ?? ALL)
            }
          >
            <SelectTrigger
              aria-label="Filter status"
              className="h-9 w-full min-w-0 px-2 text-xs"
            >
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {statusItems.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="text-xs"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-9 w-full min-w-0 gap-1 px-2 text-xs sm:w-auto sm:shrink-0 sm:px-3"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Search className="size-4" />
        )}
        Terapkan
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={reset}
        disabled={pending}
        className="h-9 w-full min-w-0 gap-1 px-2 text-xs sm:w-auto sm:shrink-0 sm:px-3"
      >
        <RotateCcw className="size-4" />
        Reset
      </Button>
    </form>
  )
}