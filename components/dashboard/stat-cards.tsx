import { Boxes, CalendarDays, CalendarRange, ClipboardList, Scale } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatNumber } from '@/lib/format'
import type { DashboardData } from '@/lib/services/returns'

export function StatCards({ data }: { data: DashboardData }) {
  const stats = [
    { label: 'Total Return', value: data.totalReturn, icon: ClipboardList, hint: 'Sesuai filter' },
    { label: 'Return Hari Ini', value: data.returnToday, icon: CalendarDays, hint: 'Tanggal penerimaan hari ini' },
    { label: 'Return Bulan Ini', value: data.returnMonth, icon: CalendarRange, hint: 'Sejak awal bulan' },
    { label: 'Total Item', value: data.totalItem, icon: Boxes, hint: 'Baris material' },
    { label: 'Total Qty Aktual', value: data.totalQtyAktual, icon: Scale, hint: `${formatNumber(data.totalSelisih)} return dengan selisih` },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
      {stats.map((s, idx) => (
        <Card key={s.label} className={idx === 4 ? 'col-span-2 lg:col-span-1' : undefined}>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground md:text-sm">{s.label}</span>
              <s.icon className="size-4 text-primary" aria-hidden="true" />
            </div>
            <span className="text-2xl font-semibold tabular-nums tracking-tight">
              {formatNumber(s.value)}
            </span>
            <span className="truncate text-xs text-muted-foreground">{s.hint}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
