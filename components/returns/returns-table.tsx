import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { StatusBadge } from '@/components/app/badges'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatNumber } from '@/lib/format'
import type { ReturnSummary } from '@/lib/types'

export function ReturnsTable({ rows }: { rows: ReturnSummary[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>No Return</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>No Surat Jalan</TableHead>
            <TableHead>No Claim</TableHead>
            <TableHead className="text-right">Jumlah Item</TableHead>
            <TableHead className="text-right">Total Qty</TableHead>
            <TableHead>PIC</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link
                  href={`/returns/${r.id}`}
                  className="font-mono text-sm font-medium text-primary hover:underline"
                >
                  {r.no_return}
                </Link>
              </TableCell>
              <TableCell className="tabular-nums">{formatDate(r.tanggal_penerimaan)}</TableCell>
              <TableCell className="max-w-48 truncate">{r.customer}</TableCell>
              <TableCell className="font-mono text-sm">{r.no_sppb}</TableCell>
              <TableCell className="font-mono text-sm">{r.no_claim ?? '-'}</TableCell>
              <TableCell className="text-right tabular-nums">{formatNumber(r.item_count)}</TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="inline-flex items-center gap-1.5">
                  {r.selisih_count > 0 && (
                    <AlertTriangle
                      className="size-3.5 text-warning"
                      aria-label={`${r.selisih_count} item selisih qty`}
                    />
                  )}
                  {formatNumber(r.total_qty_aktual)}
                </span>
              </TableCell>
              <TableCell>{r.pic_penerima ?? '-'}</TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
