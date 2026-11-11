'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'

import {
  AlertTriangle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Package,
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

import {
  formatDate,
  formatNumber,
} from '@/lib/format'

import type {
  ReturnItem,
  ReturnSummary,
} from '@/lib/types'

const PAGE_SIZE = 10

type ReturnDetailRow = {
  header: ReturnSummary
  items: ReturnItem[]
}

type ReturnsTableProps = {
  rows: ReturnSummary[]
  details?: ReturnDetailRow[]
  pagination?: boolean
  variant?: 'table' | 'dashboard'
}

function formatItemSize(item: ReturnItem) {
  const diameter = item.diameter ?? '-'
  const thickness =
    item.tebal == null ? '-' : formatNumber(Number(item.tebal))
  const length =
    item.panjang == null ? '-' : formatNumber(Number(item.panjang))

  return `Ø ${diameter} × ${thickness} × ${length} mm`
}

function DashboardReturnsList({
  rows,
  details,
}: {
  rows: ReturnSummary[]
  details?: ReturnDetailRow[]
}) {
  const detailsByHeader = new Map<string, ReturnItem[]>()

  for (const detail of details ?? []) {
    detailsByHeader.set(String(detail.header.id), detail.items)
  }

  if (rows.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {rows.map((header) => {
        const items = detailsByHeader.get(String(header.id)) ?? []

        return (
          <article
            key={header.id}
            className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm"
          >
            <div className="flex flex-col gap-3 border-b bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/returns/${header.id}`}
                    className="inline-flex items-center gap-1 font-mono text-sm font-bold text-primary hover:underline"
                  >
                    Return #{header.no_return}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                  <StatusBadge status={header.status} />
                </div>

                <p className="mt-1 break-words text-sm font-semibold text-foreground">
                  {header.customer || 'Customer belum diisi'}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tanggal penerimaan: {formatDate(header.tanggal_penerimaan)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 text-xs">
                <span className="rounded-lg border bg-background px-2.5 py-1.5 text-muted-foreground">
                  {formatNumber(header.item_count)} item
                </span>
                <span className="rounded-lg border bg-background px-2.5 py-1.5 font-semibold text-foreground [font-variant-numeric:tabular-nums]">
                  Qty Aktual: {formatNumber(header.total_qty_aktual)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  No. Surat Jalan
                </p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">
                  {header.no_sppb || '—'}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  No. Claim
                </p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">
                  {header.no_claim || '—'}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  PIC Penerima
                </p>
                <p className="mt-1 break-words text-sm font-medium text-foreground">
                  {header.pic_penerima || '—'}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Selisih Item
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {header.selisih_count > 0 && (
                    <AlertTriangle
                      className="size-3.5 text-warning"
                      aria-label={`${header.selisih_count} item memiliki selisih kuantitas`}
                    />
                  )}
                  {formatNumber(header.selisih_count)}
                </p>
              </div>
            </div>

            <div className="border-t px-4 py-3 sm:px-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-primary" />
                  <h3 className="text-xs font-semibold text-foreground">
                    Rincian Material
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatNumber(items.length)} item material
                </span>
              </div>

              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                  Belum ada detail material pada transaksi ini.
                </p>
              ) : (
                <div className="grid gap-2 lg:grid-cols-2">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="min-w-0 rounded-lg border bg-muted/15 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Item {index + 1}
                        </span>
                        <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary [font-variant-numeric:tabular-nums]">
                          Qty Aktual: {formatNumber(Number(item.qty_aktual ?? 0))}
                        </span>
                      </div>

                      <p className="mt-2 break-words text-sm font-semibold text-foreground [font-variant-numeric:tabular-nums]">
                        {formatItemSize(item)}
                      </p>

                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-3">
                        <p className="min-w-0 break-words">
                          Batch: <span className="font-medium text-foreground">{item.batch || '—'}</span>
                        </p>
                        <p className="min-w-0 break-words">
                          No. Box: <span className="font-medium text-foreground">{item.no_box || '—'}</span>
                        </p>
                        <p className="min-w-0 break-words">
                          Qty SJ: <span className="font-medium text-foreground">{formatNumber(Number(item.qty_surat_jalan ?? 0))}</span>
                        </p>
                        <p className="min-w-0 break-words">
                          Lokasi: <span className="font-medium text-foreground">{item.location || '—'}</span>
                        </p>
                        <p className="min-w-0 break-words sm:col-span-2">
                          Kondisi: <span className="font-medium text-foreground">{item.kondisi_material || '—'}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function ReturnsTable({
  rows,
  details,
  pagination = false,
  variant = 'table',
}: ReturnsTableProps) {
  const [page, setPage] = useState(1)

  if (variant === 'dashboard') {
    return <DashboardReturnsList rows={rows} details={details} />
  }

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

  /* Hubungkan rincian item dengan header berdasarkan ID. */

  const detailsByHeader = new Map<string, ReturnItem[]>()

  for (const detail of details ?? []) {
    detailsByHeader.set(
      String(detail.header.id),
      detail.items,
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
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
              {displayedRows.map((r) => {
                const detailItems =
                  detailsByHeader.get(String(r.id)) ?? []

                return (
                  <Fragment key={r.id}>
                    <TableRow>
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

                    {details !== undefined && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={9} className="p-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-foreground">
                                Rincian Material — {r.no_return}
                              </p>

                              <span className="text-xs text-muted-foreground">
                                {formatNumber(detailItems.length)} item
                              </span>
                            </div>

                            {detailItems.length === 0 ? (
                              <p className="rounded-md border border-dashed bg-card p-3 text-xs text-muted-foreground">
                                Belum ada detail item untuk Return ini.
                              </p>
                            ) : (
                              <div className="overflow-x-auto rounded-md border bg-card">
                                <Table className="min-w-[900px]">
                                  <TableHeader>
                                    <TableRow className="bg-muted/40">
                                      <TableHead>Diameter</TableHead>
                                      <TableHead>Tebal</TableHead>
                                      <TableHead>Panjang</TableHead>
                                      <TableHead>Batch</TableHead>
                                      <TableHead>No Box</TableHead>

                                      <TableHead className="text-right">
                                        Qty Surat Jalan
                                      </TableHead>

                                      <TableHead className="text-right">
                                        Qty Aktual
                                      </TableHead>

                                      <TableHead>Lokasi</TableHead>
                                      <TableHead>Kondisi</TableHead>
                                    </TableRow>
                                  </TableHeader>

                                  <TableBody>
                                    {detailItems.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                          {item.diameter ?? '-'}
                                        </TableCell>

                                        <TableCell className="tabular-nums">
                                          {item.tebal == null
                                            ? '-'
                                            : formatNumber(Number(item.tebal))}
                                        </TableCell>

                                        <TableCell className="tabular-nums">
                                          {item.panjang == null
                                            ? '-'
                                            : formatNumber(Number(item.panjang))}
                                        </TableCell>

                                        <TableCell>
                                          {item.batch ?? '-'}
                                        </TableCell>

                                        <TableCell>
                                          {item.no_box ?? '-'}
                                        </TableCell>

                                        <TableCell className="text-right tabular-nums">
                                          {formatNumber(Number(item.qty_surat_jalan ?? 0))}
                                        </TableCell>

                                        <TableCell className="text-right tabular-nums font-semibold">
                                          {formatNumber(Number(item.qty_aktual ?? 0))}
                                        </TableCell>

                                        <TableCell>
                                          {item.location ?? '-'}
                                        </TableCell>

                                        <TableCell>
                                          {item.kondisi_material ?? '-'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  currentPage === number ? 'page' : undefined
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
                setPage((p) => Math.min(totalPages, p + 1))
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