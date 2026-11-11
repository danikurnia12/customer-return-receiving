import {
  Boxes,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Scale,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { formatNumber } from '@/lib/format'
import type { DashboardData } from '@/lib/services/returns'

export function StatCards({ data }: { data: DashboardData }) {
  const stats = [
    {
      label: 'Total Return',
      value: data.totalReturn,
      icon: ClipboardList,
      hint: 'Sesuai filter aktif',
    },
    {
      label: 'Return Hari Ini',
      value: data.returnToday,
      icon: CalendarDays,
      hint: 'Tanggal penerimaan hari ini',
    },
    {
      label: 'Return Bulan Ini',
      value: data.returnMonth,
      icon: CalendarRange,
      hint: 'Sejak awal bulan',
    },
    {
      label: 'Total Item',
      value: data.totalItem,
      icon: Boxes,
      hint: 'Seluruh baris material',
    },
    {
      label: 'Total Qty Aktual',
      value: data.totalQtyAktual,
      icon: Scale,
      hint: `${formatNumber(data.totalSelisih)} Return dengan selisih`,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat, index) => {
        const Icon = stat.icon

        return (
          <Card
            key={stat.label}
            className={`group overflow-hidden border-border/80 bg-card shadow-sm transition-colors hover:border-primary/30 ${
              index === 4 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <CardContent className="flex h-full min-h-32 flex-col justify-between gap-4 p-4 sm:min-h-36 sm:p-5">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                  {stat.label}
                </span>

                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </div>

              <div className="min-w-0">
                <p className="break-words text-2xl font-bold leading-none tracking-tight text-foreground [font-variant-numeric:tabular-nums] sm:text-3xl">
                  {formatNumber(stat.value)}
                </p>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                  {stat.hint}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}