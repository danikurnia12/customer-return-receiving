'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

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

const PAGE_SIZE = 10

export function ReturnsTable({
  rows,
  pagination = false,
}: {
  rows: ReturnSummary[]
  pagination?: boolean
}) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / PAGE_SIZE),
  )

  const currentPage = Math.min(page, totalPages)

  const displayedRows = pagination
    ? rows.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      )
    : rows

  const start =
    rows.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1

  const end = pagination
    ? Math.min(currentPage * PAGE_SIZE, rows.length)
    : rows.length

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>No Return</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>No Surat Jalan</TableHead>
              <TableHead>No Claim</TableHead>
              <TableHead className="text-right">
                Jumlah Item
              </TableHead>
              <TableHead className="text-right">
                Total Qty
              </TableHead>
              <TableHead>PIC</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {displayedRows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link
                    href={`/returns/${r.id}`}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {r.no_return}
                  </Link>
                </TableCell>

                <TableCell className="tabular-nums">
                  {formatDate(r.tanggal_penerimaan)}
                </TableCell>

                <TableCell className="max-w-48 truncate">
                  {r.customer}
                </TableCell>

                <TableCell className="font-mono text-sm">
                  {r.no_sppb}
                </TableCell>

                <TableCell className="font-mono text-sm">
                  {r.no_claim ?? '-'}
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {formatNumber(r.item_count)}
                </TableCell>

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

                <TableCell>
                  {r.pic_penerima ?? '-'}
                </TableCell>

                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && rows.length > PAGE_SIZE && (
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {formatNumber(start)}–{formatNumber(end)} dari{' '}
            {formatNumber(rows.length)} return
          </p>

          <nav
            aria-label="Navigasi halaman Return Items"
            className="flex flex-wrap items-center gap-1"
          >
            <button
              type="button"
              onClick={() =>
                setPage((p) => Math.max(1, p - 1))
              }
              disabled={currentPage === 1}
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm disabled:pointer-events-none disabled:opacity-50"
            >
              <ChevronLeft className="size-4" />
              Sebelumnya
            </button>

            {Array.from(
              { length: totalPages },
              (_, i) => i + 1,
            ).map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => setPage(number)}
                aria-label={`Halaman ${number}`}
                aria-current={
                  currentPage === number
                    ? 'page'
                    : undefined
                }
                className={`h-9 min-w-9 rounded-md border px-3 text-sm ${
                  currentPage === number
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {number}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setPage((p) =>
                  Math.min(totalPages, p + 1),
                )
              }
              disabled={currentPage === totalPages}
              className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm disabled:pointer-events-none disabled:opacity-50"
            >
              Berikutnya
              <ChevronRight className="size-4" />
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}