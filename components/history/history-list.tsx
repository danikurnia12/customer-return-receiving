
'use client'

import Link from 'next/link'
import { useState } from 'react'

import {
  Activity,
  ArrowRight,
  Ban,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardEdit,
  Clock3,
  FileText,
  Package,
  PackagePlus,
  Pencil,
  PlusCircle,
  Trash2,
  UserRound,
} from 'lucide-react'

import { formatDateTime, formatNumber } from '@/lib/format'
import type { ReturnHistoryEntry } from '@/lib/types'

const HISTORY_PAGE_SIZE = 10

const FIELD_LABELS: Record<string, string> = {
  no_return: 'No Return',
  tanggal_penerimaan: 'Tanggal Penerimaan',
  no_sppb: 'No Surat Jalan',
  no_claim: 'No Claim',
  customer: 'Customer',
  pic_penerima: 'PIC Penerima',
  catatan: 'Catatan',
  status: 'Status',
  diameter: 'Diameter',
  tebal: 'Tebal',
  panjang: 'Panjang',
  batch: 'Batch',
  no_box: 'No Box',
  qty_aktual: 'Qty Aktual',
  qty_aktual_diterima: 'Qty Aktual',
  qty_surat_jalan: 'Qty Surat Jalan',
  kondisi_material: 'Kondisi Material',
  location: 'Lokasi',
  no_ncr: 'No NCR',
  disposisi: 'Disposisi',
  pic: 'PIC',
  tindakan: 'Tindakan',
  target: 'Target',
  progres: 'Progres',
}

function formatFieldLabel(key: string) {
  return (
    FIELD_LABELS[key] ??
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  )
}

function renderValue(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.length > 0
        ? JSON.stringify(value)
        : '—'
    }

    const obj = value as Record<string, unknown>

    if (
      'diameter' in obj ||
      'tebal' in obj ||
      'panjang' in obj
    ) {
      const size = [
        obj.diameter ?? '—',
        obj.tebal ?? '—',
        obj.panjang ?? '—',
      ].join(' × ')

      const qty =
        obj.qty_aktual ??
        obj.qty_aktual_diterima

      return qty === undefined
        ? size
        : `${size} mm · Qty ${formatNumber(Number(qty))}`
    }

    return JSON.stringify(value) ?? '—'
  }

  if (typeof value === 'number') {
    return formatNumber(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'Ya' : 'Tidak'
  }

  return String(value)
}

/* ============================================================
   ACTION PRESENTATION
   ============================================================ */

function getActionMeta(action: string) {
  switch (action) {
    case 'CREATE':
      return {
        label: 'Penerimaan Return Baru',
        description: 'Transaksi Return dibuat',
        badge:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        icon:
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        Icon: PlusCircle,
      }

    case 'ADD_ITEM':
      return {
        label: 'Menambahkan Material',
        description: 'Item material ditambahkan',
        badge:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        icon:
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        Icon: PackagePlus,
      }

    case 'UPDATE_HEADER':
      return {
        label: 'Mengubah Data Return',
        description: 'Informasi Header Return diperbarui',
        badge:
          'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400',
        icon:
          'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        Icon: Pencil,
      }

    case 'UPDATE_ITEM':
      return {
        label: 'Mengubah Data Material',
        description: 'Detail item material diperbarui',
        badge:
          'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400',
        icon:
          'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        Icon: Package,
      }

    case 'DELETE_ITEM':
      return {
        label: 'Menghapus Material',
        description: 'Item material dihapus dari transaksi',
        badge:
          'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400',
        icon:
          'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        Icon: Trash2,
      }

    case 'UPDATE_STATUS':
      return {
        label: 'Mengubah Status',
        description: 'Status transaksi diperbarui',
        badge:
          'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        icon:
          'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        Icon: Activity,
      }

    case 'CANCEL':
      return {
        label: 'Membatalkan Return',
        description: 'Transaksi Return dibatalkan',
        badge:
          'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400',
        icon:
          'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        Icon: Ban,
      }

    default:
      return {
        label: action.replace(/_/g, ' '),
        description: 'Aktivitas sistem',
        badge:
          'border-border bg-muted text-muted-foreground',
        icon: 'bg-muted text-muted-foreground',
        Icon: Activity,
      }
  }
}

function getModuleLabel(module: string | null) {
  switch (module) {
    case 'RETURN':
      return 'Header Return'
    case 'ITEM':
      return 'Item Material'
    case 'STATUS':
      return 'Status Return'
    default:
      return module ?? 'Aktivitas'
  }
}

/* ============================================================
   CHANGE DETAILS
   ============================================================ */

function getChangeRows(entry: ReturnHistoryEntry) {
  if (
    entry.changed_fields &&
    Object.keys(entry.changed_fields).length > 0
  ) {
    return Object.entries(entry.changed_fields).map(
      ([key, change]) => ({
        key,
        oldValue: change.old,
        newValue: change.new,
      }),
    )
  }

  const keys = Array.from(
    new Set([
      ...Object.keys(entry.old_data ?? {}),
      ...Object.keys(entry.new_data ?? {}),
    ]),
  )

  return keys.map((key) => ({
    key,
    oldValue: entry.old_data?.[key],
    newValue: entry.new_data?.[key],
  }))
}

function ChangeCell({
  entry,
}: {
  entry: ReturnHistoryEntry
}) {
  const [expanded, setExpanded] = useState(false)

  const changes = getChangeRows(entry)

  if (changes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
        Tidak ada detail perubahan yang tersimpan untuk aktivitas ini.
      </p>
    )
  }

  const visibleChanges = expanded
    ? changes
    : changes.slice(0, 3)

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        {visibleChanges.map((change) => (
          <div
            key={change.key}
            className="min-w-0 rounded-lg border border-border/80 bg-background p-3"
          >
            <p className="mb-2 text-xs font-semibold text-foreground">
              {formatFieldLabel(change.key)}
            </p>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <div className="min-w-0 rounded-md bg-rose-500/5 px-2.5 py-2">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Sebelum
                </p>

                <p className="break-words text-xs font-medium text-foreground line-through decoration-rose-500/50">
                  {renderValue(change.oldValue)}
                </p>
              </div>

              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />

              <div className="min-w-0 rounded-md bg-emerald-500/5 px-2.5 py-2">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Sesudah
                </p>

                <p className="break-words text-xs font-semibold text-foreground">
                  {renderValue(change.newValue)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {changes.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          {expanded
            ? 'Sembunyikan perubahan'
            : `Lihat ${formatNumber(changes.length - 3)} perubahan lainnya`}

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

/* ============================================================
   HISTORY ACTIVITY CARD
   ============================================================ */

function HistoryActivityCard({
  entry,
  isLast,
  showReturn,
}: {
  entry: ReturnHistoryEntry
  isLast: boolean
  showReturn: boolean
}) {
  const meta = getActionMeta(entry.action)
  const ActionIcon = meta.Icon

  const actor = !entry.user_id
    ? 'Sistem'
    : entry.user_name || 'Pengguna tidak ditemukan'

  return (
    <div
      className="relative flex gap-3 sm:gap-4"
    >
      {/* Timeline marker */}

      <div className="relative flex w-9 shrink-0 justify-center">
        {!isLast && (
          <div className="absolute bottom-0 top-10 w-px bg-border" />
        )}

        <div
          className={`relative z-10 flex size-9 items-center justify-center rounded-xl ring-4 ring-background ${meta.icon}`}
        >
          <ActionIcon className="size-4" />
        </div>
      </div>

      {/* Activity content */}

      <article className="mb-5 min-w-0 flex-1 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
        {/* Activity heading */}

        <div className="flex flex-col gap-3 border-b bg-muted/15 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}
              >
                {meta.label}
              </span>

              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {getModuleLabel(entry.module)}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              {meta.description}
            </p>
          </div>

          <div className="shrink-0 sm:text-right">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Clock3 className="size-3.5 text-muted-foreground" />
              {formatDateTime(entry.created_at)}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {/* User and Return information */}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Dilakukan oleh
                </p>

                <p className="truncate text-sm font-semibold text-foreground">
                  {actor}
                </p>
              </div>
            </div>

            {showReturn && (
              <div className="min-w-0">
                {entry.return_header_id ? (
                  <Link
                    href={`/returns/${entry.return_header_id}`}
                    className="group/return inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <FileText className="size-4 shrink-0 text-primary" />

                    <div className="min-w-0 text-left">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        No Return
                      </p>

                      <p className="break-words font-mono text-xs font-semibold text-primary">
                        {entry.no_return ?? '-'}
                      </p>
                    </div>

                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover/return:translate-x-0.5" />
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Tidak terkait transaksi Return
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Change details */}

          <section className="border-t pt-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardEdit className="size-3.5" />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-foreground">
                  Detail Perubahan
                </h3>

                <p className="text-[10px] text-muted-foreground">
                  Perbandingan data sebelum dan sesudah aktivitas
                </p>
              </div>
            </div>

            <ChangeCell entry={entry} />
          </section>

          {/* Notes */}

          {entry.notes && (
            <section className="flex min-w-0 gap-3 rounded-lg border border-border/70 bg-muted/25 p-3">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Catatan Aktivitas
                </p>

                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                  {entry.notes}
                </p>
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  )
}

/* ============================================================
   HISTORY LIST
   ============================================================ */

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
    <div className="space-y-5">
      {/* Activity list */}

      <div>
        {displayedEntries.map((entry, index) => (
          <HistoryActivityCard
            key={entry.id}
            entry={entry}
            isLast={index === displayedEntries.length - 1}
            showReturn={showReturn}
          />
        ))}
      </div>

      {/* Pagination */}

      {entries.length > HISTORY_PAGE_SIZE && (
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Menampilkan{' '}
            <span className="font-semibold text-foreground">
              {formatNumber(start)}–{formatNumber(end)}
            </span>{' '}
            dari{' '}
            <span className="font-semibold text-foreground">
              {formatNumber(entries.length)}
            </span>{' '}
            aktivitas
          </p>

          <nav
            aria-label="Navigasi halaman riwayat"
            className="flex flex-wrap items-center gap-1"
          >
            <button
              type="button"
              onClick={() =>
                setPage((value) => Math.max(1, value - 1))
              }
              disabled={currentPage === 1}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
              Sebelumnya
            </button>

            <span className="flex h-9 min-w-16 items-center justify-center px-2 text-xs font-semibold tabular-nums text-foreground">
              {formatNumber(currentPage)} / {formatNumber(totalPages)}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((value) =>
                  Math.min(totalPages, value + 1),
                )
              }
              disabled={currentPage === totalPages}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
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