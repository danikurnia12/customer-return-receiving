
'use client'

import { useMemo, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileSearch,
  Loader2,
  Package,
  Pencil,
  Search,
  Save,
  X,
} from 'lucide-react'

import { updateInspectionAdminAction } from '@/app/actions/inspection'
import type {
  InspectionMonitoringItem,
  InspectionMonitoringLine,
} from '@/lib/services/inspection'

const DISPOSISI_OPTIONS = [
  'Reject',
  'Downgrade',
  'Sortir/Repair',
  'Hold',
  'Prime',
] as const

const CLAIM_FIELDS = [
  { name: 'no_claim', label: 'No Claim 1' },
  { name: 'no_claim_2', label: 'No Claim 2' },
  { name: 'no_claim_3', label: 'No Claim 3' },
  { name: 'no_claim_4', label: 'No Claim 4' },
] as const

type Message = {
  type: 'success' | 'warning' | 'error'
  text: string
}

const inputClassName =
  'flex h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60'

function formatDate(value: string | null) {
  if (!value) return 'Belum tersedia'

  const dateOnly = value.slice(0, 10)
  const date = new Date(`${dateOnly}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'

  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(value)
}

function formatItemSize(item: InspectionMonitoringLine) {
  const hasSize =
    item.diameter !== null ||
    item.tebal !== null ||
    item.panjang !== null

  if (!hasSize) return 'Ukuran belum diisi'

  return `Ø ${formatNumber(item.diameter)} × ${formatNumber(item.tebal)} × ${formatNumber(item.panjang)} mm`
}

function formatQuantity(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'

  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(value)
}

function statusLabel(value: string | null) {
  if (!value) return 'Tidak diketahui'
  if (value.toLowerCase() === 'diterima') return 'Diterima'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function statusClass(value: string | null) {
  if (value?.toLowerCase() === 'diterima') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
  }

  return 'border-border bg-muted text-muted-foreground'
}

function disposisiClass(value: string | null) {
  switch (value) {
    case 'Reject':
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
    case 'Downgrade':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
    case 'Sortir/Repair':
      return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300'
    case 'Hold':
      return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300'
    default:
      return 'border-border bg-muted text-muted-foreground'
  }
}

function ReturnItemsSection({
  items,
}: {
  items: InspectionMonitoringLine[]
}) {
  return (
    <section className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Ukuran Item
          </h3>
        </div>

        <span className="text-xs text-muted-foreground">
          {items.length} item material
        </span>
      </div>

      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((material, index) => (
            <div
              key={material.id}
              className="rounded-xl border border-border bg-muted/25 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Item {index + 1}
                </span>

                <span className="text-xs text-muted-foreground">
                  Qty Aktual:{' '}
                  <strong className="font-semibold text-foreground">
                    {formatQuantity(material.qty_aktual)}
                  </strong>
                </span>
              </div>

              <p className="mt-2 break-words text-sm font-semibold text-foreground">
                {formatItemSize(material)}
              </p>

              {(material.batch || material.no_box || material.location) && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {material.batch && (
                    <span>Batch: {material.batch}</span>
                  )}

                  {material.no_box && (
                    <span>No. Box: {material.no_box}</span>
                  )}

                  {material.location && (
                    <span>Lokasi: {material.location}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          Belum ada detail item material pada transaksi ini.
        </p>
      )}
    </section>
  )
}

function AdminReturnCard({
  item,
}: {
  item: InspectionMonitoringItem
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<Message | null>(null)

  const claims = [
    { label: 'No Claim 1', value: item.no_claim },
    { label: 'No Claim 2', value: item.no_claim_2 },
    { label: 'No Claim 3', value: item.no_claim_3 },
    { label: 'No Claim 4', value: item.no_claim_4 },
  ].filter((claim) => Boolean(claim.value?.trim()))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isPending) return

    setMessage(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        const result = await updateInspectionAdminAction(
          String(item.id),
          formData,
        )

        if (!result.ok) {
          setMessage({
            type: 'error',
            text: result.error,
          })
          return
        }

        setIsEditing(false)

        setMessage(
          result.warning
            ? {
                type: 'warning',
                text: result.warning,
              }
            : {
                type: 'success',
                text: 'Administrasi Return berhasil diperbarui.',
              },
        )

        router.refresh()
      } catch (error) {
        console.error('[AdminReturnCard]', error)

        setMessage({
          type: 'error',
          text: 'Terjadi kesalahan saat menyimpan administrasi Return.',
        })
      }
    })
  }

  function handleCancelEdit() {
    if (isPending) return

    setIsEditing(false)
    setMessage(null)
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="break-words text-base font-semibold tracking-tight text-foreground">
        Return #{item.no_return}
      </h2>

      <dl className="mt-5 space-y-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <dt className="text-sm text-muted-foreground">Customer</dt>
          <dd className="break-words text-sm font-semibold text-foreground sm:text-right">
            {item.customer || 'Belum diisi'}
          </dd>
        </div>

        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <dt className="text-sm text-muted-foreground">
            Tanggal diterima
          </dt>
          <dd className="text-sm font-semibold text-foreground sm:text-right">
            {formatDate(item.tanggal_penerimaan)}
          </dd>
        </div>

        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <dt className="text-sm text-muted-foreground">
            Status penerimaan
          </dt>
          <dd className="sm:text-right">
            <span
              className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}
            >
              {statusLabel(item.status)}
            </span>
          </dd>
        </div>
      </dl>

      <ReturnItemsSection items={item.items} />

      <div className="my-5 border-t border-border" />

      <div className="flex items-center gap-2">
        <ClipboardList className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Informasi administrasi
        </h3>
      </div>

      {!isEditing ? (
        <dl className="mt-4 space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-3">
            <dt className="text-sm text-muted-foreground">No Claim</dt>
            <dd className="min-w-0 space-y-1 text-right">
              {claims.length > 0 ? (
                claims.map((claim) => (
                  <div
                    key={claim.label}
                    className="break-words text-sm font-semibold text-foreground"
                  >
                    {(claims.length > 1 || claim.label !== 'No Claim 1') && (
                      <span className="mr-2 text-xs font-normal text-muted-foreground">
                        {claim.label}:
                      </span>
                    )}
                    {claim.value}
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  Belum diisi
                </span>
              )}
            </dd>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-3">
            <dt className="text-sm text-muted-foreground">No NCR</dt>
            <dd className="break-words text-right text-sm font-semibold text-foreground">
              {item.no_ncr || (
                <span className="font-normal text-muted-foreground">
                  Belum diisi
                </span>
              )}
            </dd>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-3">
            <dt className="text-sm text-muted-foreground">Disposisi</dt>
            <dd className="text-right">
              {item.disposisi ? (
                <span
                  className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${disposisiClass(item.disposisi)}`}
                >
                  {item.disposisi}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Belum ditentukan
                </span>
              )}
            </dd>
          </div>
        </dl>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {CLAIM_FIELDS.map((field) => (
              <div
                key={field.name}
                className="min-w-0 space-y-1.5"
              >
                <label
                  htmlFor={`${field.name}-${item.id}`}
                  className="text-sm font-medium text-foreground"
                >
                  {field.label}
                </label>

                <input
                  id={`${field.name}-${item.id}`}
                  name={field.name}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={50}
                  defaultValue={item[field.name] ?? ''}
                  placeholder="Masukkan nomor Claim"
                  disabled={isPending}
                  className={inputClassName}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <label
                htmlFor={`no_ncr-${item.id}`}
                className="text-sm font-medium text-foreground"
              >
                No NCR
              </label>

              <input
                id={`no_ncr-${item.id}`}
                name="no_ncr"
                type="text"
                maxLength={100}
                autoComplete="off"
                defaultValue={item.no_ncr ?? ''}
                placeholder="Contoh: 21/NCR-SPINDO 5/VII/2026"
                disabled={isPending}
                className={inputClassName}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <label
                htmlFor={`disposisi-${item.id}`}
                className="text-sm font-medium text-foreground"
              >
                Disposisi
              </label>

              <div className="relative">
                <select
                  id={`disposisi-${item.id}`}
                  name="disposisi"
                  defaultValue={item.disposisi ?? ''}
                  disabled={isPending}
                  className={`${inputClassName} appearance-none pr-9`}
                >
                  <option value="">Pilih disposisi</option>

                  {DISPOSISI_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            No Claim diisi angka saja dan berurutan. Kosongkan kolom yang tidak digunakan.
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="size-4" />
              Batal
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Simpan Administrasi
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {!isEditing && (
        <button
          type="button"
          onClick={() => {
            setMessage(null)
            setIsEditing(true)
          }}
          className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-border bg-muted/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Pencil className="size-4" />
          Edit Administrasi
        </button>
      )}

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
              : message.type === 'warning'
                ? 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300'
                : 'border-destructive/20 bg-destructive/5 text-destructive'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <FileSearch className="mt-0.5 size-4 shrink-0" />
          )}

          <span>{message.text}</span>
        </div>
      )}
    </article>
  )
}

export function InspectionMonitoringList({
  items,
}: {
  items: InspectionMonitoringItem[]
}) {
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
  const keyword = search.trim().toLocaleLowerCase('id-ID')

  if (!keyword) return items

  return items.filter((item) => {
    const searchableValues = [
      item.no_return,
      item.customer ?? '',
      item.no_claim ?? '',
      item.no_claim_2 ?? '',
      item.no_claim_3 ?? '',
      item.no_claim_4 ?? '',
      item.no_ncr ?? '',
      item.disposisi ?? '',
      ...item.items.flatMap((material) => [
        String(material.diameter ?? ''),
        String(material.tebal ?? ''),
        String(material.panjang ?? ''),
        material.batch ?? '',
        material.no_box ?? '',
        material.location ?? '',
      ]),
    ]

    return searchableValues.some((value) =>
      value.toLocaleLowerCase('id-ID').includes(keyword),
    )
  })
}, [items, search])

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Daftar Return
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Menampilkan {filteredItems.length} dari {items.length} transaksi Return
          </p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari No Return, customer, ukuran, Claim, NCR..."
            aria-label="Cari data Return"
            className={`${inputClassName} pl-9`}
          />
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <AdminReturnCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search className="size-5" />
          </div>

          <h3 className="mt-3 text-sm font-semibold text-foreground">
            {items.length === 0
              ? 'Belum ada transaksi Return'
              : 'Data tidak ditemukan'}
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {items.length === 0
              ? 'Transaksi Return yang sudah diterima akan muncul di halaman monitoring ini.'
              : 'Coba gunakan kata kunci lain seperti No Return, nama customer, ukuran, atau nomor administrasi.'}
          </p>

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-4 text-sm font-semibold text-primary hover:underline"
            >
              Hapus pencarian
            </button>
          )}
        </div>
      )}
    </section>
  )
}