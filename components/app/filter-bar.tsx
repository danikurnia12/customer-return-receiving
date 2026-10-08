'use client'

import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import {
  useState,
  useTransition,
} from 'react'
import {
  Loader2,
  RotateCcw,
  Search,
} from 'lucide-react'

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
    const values = {
      q,
      from,
      to,
      customer,
      status,
    }

    const next = new URLSearchParams()

    for (const [key, value] of Object.entries(values)) {
      if (value && value !== ALL) {
        next.set(key, value)
      }
    }

    startTransition(() => {
      router.push(
        next.toString()
          ? `${pathname}?${next}`
          : pathname,
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
    {
      value: ALL,
      label: 'Semua Customer',
    },
    ...(customers ?? []).map((customer) => ({
      value: customer,
      label: customer,
    })),
  ]

  const statusItems = [
    {
      value: ALL,
      label: 'Semua Status',
    },
    ...STATUS_OPTIONS,
  ]

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        apply()
      }}
      className="
        flex
        w-full
        items-end
        gap-1.5
        rounded-md
        border
        bg-card
        px-2
        py-1.5
      "
    >
      {/* SEARCH */}
      {showSearch && (
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Label
            htmlFor="filter-q"
            className="text-[10px] leading-3 text-muted-foreground"
          >
            Pencarian
          </Label>

          <div className="relative">
            <Search
              className="
                pointer-events-none
                absolute
                left-2
                top-1/2
                size-3
                -translate-y-1/2
                text-muted-foreground
              "
            />

            <Input
              id="filter-q"
              value={q}
              onChange={(event) =>
                setQ(event.target.value)
              }
              placeholder={searchPlaceholder}
              className="
                h-7
                min-h-7
                rounded-md
                border
                px-2
                pl-6
                text-[11px]
                leading-none
              "
            />
          </div>
        </div>
      )}

      {/* FROM */}
      <div className="flex shrink-0 flex-col gap-0.5">
        <Label
          htmlFor="filter-from"
          className="text-[10px] leading-3 text-muted-foreground"
        >
          Dari
        </Label>

        <Input
          id="filter-from"
          type="date"
          value={from}
          onChange={(event) =>
            setFrom(event.target.value)
          }
          className="
            h-7
            min-h-7
            w-[118px]
            rounded-md
            px-1.5
            text-[10px]
            leading-none
          "
        />
      </div>

      {/* TO */}
      <div className="flex shrink-0 flex-col gap-0.5">
        <Label
          htmlFor="filter-to"
          className="text-[10px] leading-3 text-muted-foreground"
        >
          Sampai
        </Label>

        <Input
          id="filter-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) =>
            setTo(event.target.value)
          }
          className="
            h-7
            min-h-7
            w-[118px]
            rounded-md
            px-1.5
            text-[10px]
            leading-none
          "
        />
      </div>

      {/* CUSTOMER */}
      {showCustomer && (
        <div className="flex w-[145px] shrink-0 flex-col gap-0.5">
          <Label className="text-[10px] leading-3 text-muted-foreground">
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
              className="
                h-7
                min-h-7
                w-full
                rounded-md
                px-2
                text-[10px]
              "
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

      {/* STATUS */}
      {showStatus && (
        <div className="flex w-[125px] shrink-0 flex-col gap-0.5">
          <Label className="text-[10px] leading-3 text-muted-foreground">
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
              className="
                h-7
                min-h-7
                w-full
                rounded-md
                px-2
                text-[10px]
              "
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

      {/* BUTTON APPLY */}
      <Button
        type="submit"
        disabled={pending}
        className="
          h-7
          min-h-7
          shrink-0
          gap-1
          rounded-md
          px-2.5
          text-[10px]
          font-semibold
        "
      >
        {pending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Search className="size-3" />
        )}
        Terapkan
      </Button>

      {/* BUTTON RESET */}
      <Button
        type="button"
        variant="outline"
        onClick={reset}
        disabled={pending}
        className="
          h-7
          min-h-7
          shrink-0
          gap-1
          rounded-md
          px-2.5
          text-[10px]
          font-semibold
        "
      >
        <RotateCcw className="size-3" />
        Reset
      </Button>
    </form>
  )
}