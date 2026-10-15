'use client'

import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardEdit,
  Clock3,
  FileText,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'

import { formatDateTime, formatNumber } from '@/lib/format'
import type { ReturnHistoryEntry } from '@/lib/types'

const HISTORY_PAGE_SIZE = 10

function renderValue(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '-'
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>

    if ('diameter' in obj) {
      return `${obj.diameter ?? '-'} × ${
        obj.tebal ?? '-'
      } × ${
        obj.panjang ?? '-'
      } | Qty ${
        obj.qty_aktual_diterima ??
        obj.qty_aktual ??
        '-'
      }`
    }

    return JSON.stringify(value)
  }

  return String(value)
}

function getActionStyle(action: string) {
  const value = action.toLowerCase()

  if (
    value.includes('create') ||
    value.includes('buat') ||
    value.includes('terima')
  ) {
    return {
      badge:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      icon:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    }
  }

  if (
    value.includes('update') ||
    value.includes('ubah') ||
    value.includes('edit')
  ) {
    return {
      badge:
        'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-500',
      icon:
        'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    }
  }

  if (
    value.includes('delete') ||
    value.includes('hapus') ||
    value.includes('cancel') ||
    value.includes('batal')
  ) {
    return {
      badge:
        'bg-red-500/10 text-red-700 dark:text-red-400',
      dot: 'bg-red-500',
      icon:
        'bg-red-500/10 text-red-600 dark:text-red-400',
    }
  }

  if (
    value.includes('inspection') ||
    value.includes('inspeksi')
  ) {
    return {
      badge:
        'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
      icon:
        'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    }
  }

  return {
    badge: 'bg-primary/10 text-primary',
    dot: 'bg-primary',
    icon: 'bg-primary/10 text-primary',
  }
}

function ChangeCell({
  entry,
}: {
  entry: ReturnHistoryEntry
}) {
  const [expanded, setExpanded] = useState(false)

  const keys = Array.from(
    new Set([
      ...Object.keys(entry.old_data ?? {}),
      ...Object.keys(entry.new_data ?? {}),
    ]),
  )

  if (keys.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Tidak ada perubahan detail
      </span>
    )
  }

  const visibleKeys = expanded
    ? keys
    : keys.slice(0, 2)

  return (
    <div className="space-y-2">
      {visibleKeys.map((key) => {
        const oldValue = entry.old_data?.[key]
        const newValue = entry.new_data?.[key]

        return (
          <div
            key={key}
            className="rounded-lg border bg-background/70 p-2.5"
          >
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {key.replace(/_/g, ' ')}
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              {entry.old_data && (
                <span className="rounded-md bg-red-500/10 px-2 py-1 font-mono text-[11px] text-red-700 line-through dark:text-red-400">
                  {renderValue(oldValue)}
                </span>
              )}

              {entry.old_data && entry.new_data && (
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
              )}

              {entry.new_data && (
                <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  {renderValue(newValue)}
                </span>
              )}
            </div>
          </div>
        )
      })}

      {keys.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded
            ? 'Sembunyikan'
            : `Lihat ${keys.length - 2} perubahan lainnya`}

          <ChevronDown
            className={`size-3.5 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}
    </div>
  )
}

export function HistoryList({
  entries,
  showReturn = true,
}: {
  entries: ReturnHistoryEntry[]
  showReturn?: boolean
}) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(
    1,
    Math.ceil(entries.length / HISTORY_PAGE_SIZE),
  )

  const currentPage = Math.min(page, totalPages)

  const displayedEntries = entries.slice(
    (currentPage - 1) * HISTORY_PAGE_SIZE,
    currentPage * HISTORY_PAGE_SIZE,
  )

  const start =
    entries.length === 0
      ? 0
      : (currentPage - 1) * HISTORY_PAGE_SIZE + 1

  const end = Math.min(
    currentPage * HISTORY_PAGE_SIZE,
    entries.length,
  )

  return (
    <div className="space-y-4">
      <div className="space-y-0">
        {displayedEntries.map((entry, index) => {
          const style = getActionStyle(entry.action)
          const isLast = index === displayedEntries.length - 1

          return (
            <div
              key={entry.id}
              className="group relative flex gap-4"
            >
              {/* Timeline */}
              <div className="relative flex w-8 shrink-0 justify-center">
                {!isLast && (
                  <div className="absolute top-8 bottom-0 w-px bg-border" />
                )}

                <div
                  className={`relative z-10 mt-1 flex size-8 items-center justify-center rounded-full ring-4 ring-background ${style.icon}`}
                >
                  <Activity className="size-4" />
                </div>
              </div>

              {/* Content */}
              <div className="mb-5 min-w-0 flex-1">
                <div className="rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  {/* Top row */}
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.badge}`}
                        >
                          {entry.action}
                        </span>

                        {entry.module && (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            {entry.module}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="size-3.5" />
                          {formatDateTime(entry.created_at)}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="size-3.5" />
                          {entry.user_name ?? 'Sistem'}
                        </span>
                      </div>
                    </div>

                    {/* Return */}
                    {showReturn && (
                      <div className="shrink-0">
                        {entry.return_header_id ? (
                          <Link
                            href={`/returns/${entry.return_header_id}`}
                            className="group/return inline-flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
                          >
                            <FileText className="size-4 text-primary" />

                            <div className="text-left">
                              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                No Return
                              </p>

                              <p className="font-mono text-xs font-semibold text-primary">
                                {entry.no_return ?? '-'}
                              </p>
                            </div>

                            <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover/return:translate-x-0.5" />
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No Return -
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Change detail */}
                  <div className="mt-4 border-t pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <ClipboardEdit className="size-3.5 text-primary" />

                      <span className="text-xs font-semibold text-foreground">
                        Detail Perubahan
                      </span>
                    </div>

                    <ChangeCell entry={entry} />
                  </div>

                  {/* Notes */}
                  {entry.notes && (
                    <div className="mt-4 flex gap-3 rounded-lg bg-muted/40 p-3">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Catatan
                        </p>

                        <p className="mt-1 text-sm leading-relaxed text-foreground">
                          {entry.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {entries.length > HISTORY_PAGE_SIZE && (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {formatNumber(start)}–{formatNumber(end)} dari{' '}
            {formatNumber(entries.length)} riwayat
          </p>

          <nav
            aria-label="Navigasi halaman riwayat"
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
              (_, index) => index + 1,
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