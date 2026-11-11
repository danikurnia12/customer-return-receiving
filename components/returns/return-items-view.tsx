'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  ExternalLink,
  Loader2,
  Package,
  Search,
} from 'lucide-react'

import { loadReturnItemsForViewAction } from '@/app/actions/returns'
import type { ReturnFilters, ReturnItem } from '@/lib/types'
import type { ReturnItemsViewRow } from '@/lib/services/returns'
import { formatNumber } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type MonthGroup = {
  key: string
  label: string
  rows: ReturnItemsViewRow[]
}

type YearGroup = {
  year: string
  months: MonthGroup[]
}

function formatDate(value: string | null) {
  if (!value) return 'Tanggal tidak tersedia'

  const date = new Date(`${value.slice(0, 10)}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function groupByDate(rows: ReturnItemsViewRow[]): YearGroup[] {
  const grouped = new Map<string, Map<string, MonthGroup>>()

  for (const row of rows) {
    const rawDate = row.header.tanggal_penerimaan
    const date = rawDate
      ? new Date(`${rawDate.slice(0, 10)}T00:00:00`)
      : null

    const validDate = date && !Number.isNaN(date.getTime())
    const year = validDate
      ? String(date.getFullYear())
      : 'Tanpa tanggal'

    const monthKey = validDate
      ? `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`
      : 'unknown'

    const monthLabel = validDate
      ? new Intl.DateTimeFormat('id-ID', {
          month: 'long',
        }).format(date)
      : 'Tanggal tidak tersedia'

    if (!grouped.has(year)) {
      grouped.set(year, new Map())
    }

    const months = grouped.get(year)!

    if (!months.has(monthKey)) {
      months.set(monthKey, {
        key: monthKey,
        label: monthLabel,
        rows: [],
      })
    }

    months.get(monthKey)!.rows.push(row)
  }

  return Array.from(grouped.entries()).map(([year, months]) => ({
    year,
    months: Array.from(months.values()),
  }))
}

export function ReturnItemsView({
  rows,
  filters,
}: {
  rows: ReturnItemsViewRow[]
  filters: ReturnFilters
}) {
  const [selectedId, setSelectedId] = useState<string>(
    rows[0] ? String(rows[0].header.id) : '',
  )

  /* Cache detail per Header agar tidak diambil ulang saat berpindah kembali. */
  const [itemsByHeader, setItemsByHeader] = useState<
    Record<string, ReturnItem[]>
  >({})
  const itemsCacheRef = useRef<Record<string, ReturnItem[]>>({})
  const requestRef = useRef(0)

  const [loadingHeaderId, setLoadingHeaderId] = useState<string | null>(null)
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({})
  const [retryVersion, setRetryVersion] = useState(0)

  const groups = useMemo(() => groupByDate(rows), [rows])

  const selected =
    rows.find(
      (row) => String(row.header.id) === selectedId,
    ) ?? rows[0]

  const selectedHeaderId = selected
    ? String(selected.header.id)
    : ''

  /*
   * Detail diminta setelah Header dipilih.
   * Hasil request lama tidak boleh menimpa pilihan yang lebih baru.
   */
  useEffect(() => {
    if (!selectedHeaderId) return

    if (
      Object.prototype.hasOwnProperty.call(
        itemsCacheRef.current,
        selectedHeaderId,
      )
    ) {
      return
    }

    let cancelled = false
    const requestId = ++requestRef.current

    setLoadingHeaderId(selectedHeaderId)
    setDetailErrors((current) => {
      if (!current[selectedHeaderId]) return current
      const next = { ...current }
      delete next[selectedHeaderId]
      return next
    })

    loadReturnItemsForViewAction(selectedHeaderId)
      .then((items) => {
        if (cancelled || requestId !== requestRef.current) return

        const nextCache = {
          ...itemsCacheRef.current,
          [selectedHeaderId]: items,
        }

        itemsCacheRef.current = nextCache
        setItemsByHeader(nextCache)
      })
      .catch((error: unknown) => {
        if (cancelled || requestId !== requestRef.current) return

        setDetailErrors((current) => ({
          ...current,
          [selectedHeaderId]:
            error instanceof Error
              ? error.message
              : 'Gagal mengambil detail Item Return.',
        }))
      })
      .finally(() => {
        if (!cancelled && requestId === requestRef.current) {
          setLoadingHeaderId((current) =>
            current === selectedHeaderId ? null : current,
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedHeaderId, retryVersion])

  const allSelectedItems = selectedHeaderId
    ? itemsByHeader[selectedHeaderId] ?? []
    : []

  const selectedItems = useMemo(() => {
    if (!selected) return []

    const search = filters.q?.trim() ?? ''

    if (!search || selected.headerMatched) {
      return allSelectedItems
    }

    const matchingIds = new Set(
      selected.matchingItemIds ?? [],
    )

    return allSelectedItems.filter((item) =>
      matchingIds.has(String(item.id)),
    )
  }, [allSelectedItems, filters.q, selected])

  const itemsLoading =
    Boolean(selectedHeaderId) &&
    loadingHeaderId === selectedHeaderId &&
    !Object.prototype.hasOwnProperty.call(
      itemsByHeader,
      selectedHeaderId,
    )

  const detailError = selectedHeaderId
    ? detailErrors[selectedHeaderId]
    : undefined

  function retrySelectedItems() {
    if (!selectedHeaderId) return

    const nextCache = { ...itemsCacheRef.current }
    delete nextCache[selectedHeaderId]
    itemsCacheRef.current = nextCache
    setItemsByHeader(nextCache)

    setDetailErrors((current) => {
      const next = { ...current }
      delete next[selectedHeaderId]
      return next
    })

    setRetryVersion((version) => version + 1)
  }

  return (
    <div className="space-y-4">
      {/* Pencarian ringkas */}
      <form
        action="/returns"
        method="get"
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="search"
            name="q"
            defaultValue={filters.q ?? ''}
            placeholder="Cari No Return, customer, diameter, batch..."
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {filters.from && (
          <input type="hidden" name="from" value={filters.from} />
        )}

        {filters.to && (
          <input type="hidden" name="to" value={filters.to} />
        )}

        {filters.customer && (
          <input type="hidden" name="customer" value={filters.customer} />
        )}

        {filters.status && (
          <input type="hidden" name="status" value={filters.status} />
        )}

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Search className="size-4" />
          Cari
        </button>

        <Link
          href="/returns"
          className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted"
        >
          Reset
        </Link>
      </form>

      {/* Master-detail */}
      <div className="grid min-h-[600px] grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Navigasi tanggal */}
        <aside className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
            <CalendarDays className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">
              Riwayat Penerimaan
            </h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatNumber(rows.length)}
            </span>
          </div>

          <div className="max-h-[700px] space-y-4 overflow-y-auto p-3">
            {groups.map((yearGroup) => (
              <div key={yearGroup.year}>
                <p className="mb-2 px-2 text-sm font-bold">
                  {yearGroup.year}
                </p>

                <div className="space-y-3">
                  {yearGroup.months.map((month) => (
                    <div key={month.key}>
                      <p className="mb-1 px-2 text-xs font-medium capitalize text-muted-foreground">
                        {month.label}
                      </p>

                      <div className="space-y-1">
                        {month.rows.map((row) => {
                          const active =
                            String(row.header.id) ===
                            String(selected?.header.id)

                          return (
                            <button
                              key={row.header.id}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                setSelectedId(String(row.header.id))
                              }
                              className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                                active
                                  ? 'border-primary/40 bg-primary/10'
                                  : 'border-transparent hover:bg-muted'
                              }`}
                            >
                              <span className="block truncate text-sm font-semibold">
                                {formatDate(row.header.tanggal_penerimaan)}
                              </span>

                              <span className="mt-1 block truncate text-xs text-muted-foreground">
                                {row.header.customer || '-'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Detail Header dan Item */}
        <main className="min-w-0 space-y-4">
          {!selected ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border bg-card p-6 text-center">
              <Package className="mb-3 size-10 text-muted-foreground" />
              <p className="font-semibold">
                Return tidak ditemukan
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Belum ada data atau tidak cocok dengan pencarian.
              </p>
            </div>
          ) : (
            <>
              {/* Header Return */}
              <section className="overflow-hidden rounded-xl border bg-card">
                <div className="flex flex-col gap-3 border-b bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      HEADER RETURN
                    </p>

                    <Link
                      href={`/returns/${selected.header.id}`}
                      className="mt-1 inline-flex items-center gap-2 text-lg font-bold text-primary hover:underline"
                    >
                      {selected.header.no_return}
                      <ExternalLink className="size-4" />
                    </Link>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Klik nomor Return untuk membuka detail lengkap.
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      selected.header.status === 'dibatalkan'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-green-500/10 text-green-700 dark:text-green-400'
                    }`}
                  >
                    {selected.header.status === 'dibatalkan'
                      ? 'Dibatalkan'
                      : 'Diterima'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 xl:grid-cols-5">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tanggal Penerimaan
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(selected.header.tanggal_penerimaan)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Customer
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {selected.header.customer || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      No Surat Jalan
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {selected.header.no_sppb || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      No Claim
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {selected.header.no_claim || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      PIC Penerima
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {selected.header.pic_penerima || '-'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Item Return */}
              <section className="overflow-hidden rounded-xl border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-primary" />
                    <h2 className="text-sm font-semibold">
                      Item Material Return
                    </h2>
                  </div>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {itemsLoading
                      ? 'Memuat...'
                      : `${formatNumber(selectedItems.length)} Item`}
                  </span>
                </div>

                {itemsLoading ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Mengambil detail material...
                    </p>
                  </div>
                ) : detailError ? (
                  <div className="space-y-3 p-6 text-center">
                    <p role="alert" className="text-sm text-destructive">
                      {detailError}
                    </p>
                    <button
                      type="button"
                      onClick={retrySelectedItems}
                      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : selectedItems.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    Belum ada item pada Return ini.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-10">No</TableHead>
                          <TableHead>Diameter</TableHead>
                          <TableHead className="text-right">Tebal</TableHead>
                          <TableHead className="text-right">Panjang</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>No Box</TableHead>
                          <TableHead className="text-right">Qty SJ</TableHead>
                          <TableHead className="text-right">Qty Aktual</TableHead>
                          <TableHead>Kondisi</TableHead>
                          <TableHead>Lokasi</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {selectedItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {item.diameter || '-'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {item.tebal === null
                                ? '-'
                                : formatNumber(item.tebal)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {item.panjang === null
                                ? '-'
                                : formatNumber(item.panjang)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {item.batch || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {item.no_box || '-'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNumber(item.qty_surat_jalan)}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {formatNumber(item.qty_aktual)}
                            </TableCell>
                            <TableCell>
                              {item.kondisi_material || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {item.location || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {!itemsLoading &&
                  !detailError &&
                  selectedItems.length > 0 && (
                    <div className="flex flex-wrap justify-between gap-3 border-t bg-muted/20 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">
                        Total {formatNumber(selectedItems.length)} item
                      </span>

                      <div className="flex flex-wrap gap-5">
                        <span>
                          Qty SJ:{' '}
                          <strong>
                            {formatNumber(
                              selectedItems.reduce(
                                (sum, item) => sum + item.qty_surat_jalan,
                                0,
                              ),
                            )}
                          </strong>
                        </span>

                        <span>
                          Qty Aktual:{' '}
                          <strong>
                            {formatNumber(
                              selectedItems.reduce(
                                (sum, item) => sum + item.qty_aktual,
                                0,
                              ),
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}