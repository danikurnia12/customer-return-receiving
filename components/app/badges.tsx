import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  diterima: {
    label: 'Diterima',
    className: 'border-success/30 bg-success/10 text-success',
  },
  dibatalkan: {
    label: 'Dibatalkan',
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
}

export const STATUS_OPTIONS = [
  { value: 'diterima', label: 'Diterima' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
]

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: '' }
  return (
    <Badge variant="outline" className={cn('font-medium', s.className)}>
      {s.label}
    </Badge>
  )
}

export function QtyDiff({
  qtySj,
  qtyAktual,
  compact = false,
}: {
  qtySj: number
  qtyAktual: number
  compact?: boolean
}) {
  const diff = qtyAktual - qtySj
  if (Number.isNaN(diff) || diff === 0) return null
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-warning-foreground"
      title={`Selisih Qty: SJ ${formatNumber(qtySj)}, Aktual ${formatNumber(qtyAktual)}`}
    >
      <AlertTriangle className="size-3" aria-hidden="true" />
      {compact ? '' : 'Selisih '}
      {formatNumber(Math.abs(diff))}
      <span className="sr-only">{diff < 0 ? ' kurang' : ' lebih'}</span>
    </span>
  )
}
