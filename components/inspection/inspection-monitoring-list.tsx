
'use client'

import { useMemo, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileSearch,
  Loader2,
  MessageCircle,
  Package,
  Pencil,
  PlusCircle,
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
  'Cutting ulang',
  'Champer ulang',
  'Dialihkan ke customer lain',
] as const

const CLAIM_FIELDS = [
  { name: 'no_claim', label: 'No Claim 1' },
  { name: 'no_claim_2', label: 'No Claim 2' },
  { name: 'no_claim_3', label: 'No Claim 3' },
  { name: 'no_claim_4', label: 'No Claim 4' },
] as const

const NCR_FIELDS = [
  { name: 'no_ncr', label: 'No NCR 1' },
  { name: 'no_ncr_2', label: 'No NCR 2' },
] as const

type Message = {
  type: 'success' | 'warning' | 'error'
  text: string
}

const inputClassName =
  'flex h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60'

function getVisibleFieldCount(
  values: (string | null)[],
): number {
  let lastFilledIndex = -1

  values.forEach((value, index) => {
    if (value?.trim()) {
      lastFilledIndex = index
    }
  })

  return Math.max(1, lastFilledIndex + 1)
}

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

/**
 * Diameter harus diperlakukan sebagai teks.
 * Format seperti 20/20 tidak boleh diformat sebagai angka.
 */
function formatItemSize(item: InspectionMonitoringLine) {
  const diameter = item.diameter?.trim() || '—'

  const hasSize =
    Boolean(item.diameter?.trim()) ||
    item.tebal !== null ||
    item.panjang !== null

  if (!hasSize) return 'Ukuran belum diisi'

  return `Ø ${diameter} × ${formatNumber(item.tebal)} × ${formatNumber(item.panjang)} mm`
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
    case 'Reject'.toUpperCase():
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'

    case 'Downgrade':
    case 'DOWNGRADE':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'

    case 'Sortir/Repair':
      return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300'

    case 'Hold':
      return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300'

    case 'Prime':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'

    case 'Cutting ulang':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300'

    case 'Champer ulang':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300'

    case 'Dialihkan ke customer lain':
      return 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300'

    default:
      return 'border-border bg-muted text-muted-foreground'
  }
}

/* -------------------------------------------------------------------------- */
/* INFORMASI MATERIAL DAN DISPOSISI PER ITEM                                  */
/* -------------------------------------------------------------------------- */

function ReturnItemsSection({
  items,
  isEditing = false,
  isPending = false,
}: {
  items: InspectionMonitoringLine[]
  isEditing?: boolean
  isPending?: boolean
}) {
  return (
    <section className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Ukuran dan Disposisi Item
          </h3>
        </div>

        <span className="text-xs text-muted-foreground">
          {items.length} item material
        </span>
      </div>

      {items.length > 0 ? (
        <div className="mt-3 space-y-3">
          {items.map((material, index) => (
            <div
              key={material.id}
              className="rounded-xl border border-border bg-muted/25 p-3 sm:p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
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

              <div className="mt-4 border-t border-border/70 pt-3">
                <label
                  htmlFor={`disposisi-${material.id}`}
                  className="mb-2 block text-xs font-semibold text-foreground"
                >
                  Disposisi Item {index + 1}
                </label>

                {isEditing ? (
                  <div className="relative">
                    <select
                      id={`disposisi-${material.id}`}
                      name={`disposisi_${material.id}`}
                      defaultValue={material.disposisi ?? ''}
                      disabled={isPending}
                      aria-label={`Disposisi item ${index + 1}`}
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
                ) : material.disposisi ? (
                  <span
                    className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${disposisiClass(material.disposisi)}`}
                  >
                    {material.disposisi}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Belum ditentukan
                  </span>
                )}
              </div>
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

/* -------------------------------------------------------------------------- */
/* RINGKASAN ADMINISTRASI HEADER                                               */
/* -------------------------------------------------------------------------- */

function AdminReturnSummary({
  item,
}: {
  item: InspectionMonitoringItem
}) {
  const claims = [
    { label: 'No Claim 1', value: item.no_claim },
    { label: 'No Claim 2', value: item.no_claim_2 },
    { label: 'No Claim 3', value: item.no_claim_3 },
    { label: 'No Claim 4', value: item.no_claim_4 },
  ].filter((claim) => Boolean(claim.value?.trim()))

  const ncrs = [
    { label: 'No NCR 1', value: item.no_ncr },
    { label: 'No NCR 2', value: item.no_ncr_2 },
  ].filter((ncr) => Boolean(ncr.value?.trim()))

  return (
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

        <dd className="min-w-0 space-y-1 text-right">
          {ncrs.length > 0 ? (
            ncrs.map((ncr) => (
              <div
                key={ncr.label}
                className="break-words text-sm font-semibold text-foreground"
              >
                {(ncrs.length > 1 || ncr.label !== 'No NCR 1') && (
                  <span className="mr-2 text-xs font-normal text-muted-foreground">
                    {ncr.label}:
                  </span>
                )}
                {ncr.value}
              </div>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              Belum diisi
            </span>
          )}
        </dd>
      </div>
    </dl>
  )
}

/* -------------------------------------------------------------------------- */
/* FORM ADMINISTRASI HEADER                                                    */
/* -------------------------------------------------------------------------- */

function AdminHeaderForm({
  item,
  claimCount,
  ncrCount,
  setClaimCount,
  setNcrCount,
  isPending,
}: {
  item: InspectionMonitoringItem
  claimCount: number
  ncrCount: number
  setClaimCount: (count: number) => void
  setNcrCount: (count: number) => void
  isPending: boolean
}) {
  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-semibold text-foreground">
          Nomor Claim
        </h4>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {CLAIM_FIELDS.slice(0, claimCount).map((field) => (
            <div key={field.name} className="min-w-0 space-y-1.5">
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
                inputMode="text"
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

        {claimCount < CLAIM_FIELDS.length && (
          <button
            type="button"
            onClick={() => setClaimCount(claimCount + 1)}
            disabled={isPending}
            className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusCircle className="size-4" />
            Tambah No Claim
          </button>
        )}

        <p className="mt-2 text-xs text-muted-foreground">
          Maksimal 4 nomor Claim. Kolom berikutnya muncul saat tombol tambah ditekan.
        </p>
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-semibold text-foreground">
          Nomor NCR
        </h4>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {NCR_FIELDS.slice(0, ncrCount).map((field) => (
            <div key={field.name} className="min-w-0 space-y-1.5">
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
                inputMode="text"
                autoComplete="off"
                maxLength={100}
                defaultValue={item[field.name] ?? ''}
                placeholder="Masukkan nomor NCR"
                disabled={isPending}
                className={inputClassName}
              />
            </div>
          ))}
        </div>

        {ncrCount < NCR_FIELDS.length && (
          <button
            type="button"
            onClick={() => setNcrCount(ncrCount + 1)}
            disabled={isPending}
            className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusCircle className="size-4" />
            Tambah No NCR
          </button>
        )}

        <p className="mt-2 text-xs text-muted-foreground">
          Maksimal 2 nomor NCR. Kolom kedua muncul saat tombol tambah ditekan.
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* KARTU ADMINISTRASI RETURN                                                   */
/* -------------------------------------------------------------------------- */

function AdminReturnCard({
  item,
}: {
  item: InspectionMonitoringItem
}) {
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<Message | null>(null)

  const [claimCount, setClaimCount] = useState(() =>
    getVisibleFieldCount([
      item.no_claim,
      item.no_claim_2,
      item.no_claim_3,
      item.no_claim_4,
    ]),
  )

  const [ncrCount, setNcrCount] = useState(() =>
    getVisibleFieldCount([
      item.no_ncr,
      item.no_ncr_2,
    ]),
  )

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

    // Kembalikan jumlah kolom sesuai data yang tersimpan.
    setClaimCount(
      getVisibleFieldCount([
        item.no_claim,
        item.no_claim_2,
        item.no_claim_3,
        item.no_claim_4,
      ]),
    )

    setNcrCount(
      getVisibleFieldCount([
        item.no_ncr,
        item.no_ncr_2,
      ]),
    )
  }

  const hasClaim = [item.no_claim, item.no_claim_2, item.no_claim_3, item.no_claim_4]
    .some((value) => Boolean(value?.trim()))
  const hasNcr = [item.no_ncr, item.no_ncr_2]
    .some((value) => Boolean(value?.trim()))
  const missingDisposisiItems = item.items.filter((material) => !material.disposisi?.trim())
  const needsQaFollowUp = hasClaim && (!hasNcr || missingDisposisiItems.length > 0)
  const needsSalesFollowUp = !hasClaim

  const itemDetails = item.items.length
    ? item.items
        .map((material, index) =>
          [
            `${index + 1}. *Item Material*`,
            `   Diameter: ${material.diameter?.trim() || '—'}`,
            `   Tebal: ${formatNumber(material.tebal)}`,
            `   Panjang: ${formatNumber(material.panjang)} mm`,
            `   Qty Aktual: ${formatQuantity(material.qty_aktual)}`,
          ].join('\n'),
        )
        .join('\n\n')
    : 'Belum ada detail item material.'

  const qaItemDetails = item.items.length
    ? item.items
        .map((material, index) =>
          [
            `${index + 1}. *Item Material*`,
            `   Diameter: ${material.diameter?.trim() || '—'}`,
            `   Tebal: ${formatNumber(material.tebal)}`,
            `   Panjang: ${formatNumber(material.panjang)} mm`,
            `   Qty Aktual: ${formatQuantity(material.qty_aktual)}`,
            `   Disposisi: ${material.disposisi?.trim() || 'Belum diisi'}`,
          ].join('\n'),
        )
        .join('\n\n')
    : 'Belum ada detail item material.'

  const missingQaRequests = [
    !hasNcr ? 'No NCR' : null,
    missingDisposisiItems.length > 0 ? 'Disposisi pada item yang belum lengkap' : null,
  ].filter(Boolean).join(' dan/atau ')

  function openWhatsAppMessage(messageText: string) {
    const url = `https://wa.me/?text=${encodeURIComponent(messageText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }


function buildSalesMessage() {
  return [
    'Halo Bapak/Ibu Sales,',
    '',
    'Mohon bantuan untuk menginformasikan *No. Claim* yang telah diterbitkan untuk Return Customer berikut:',
    '',
    `*No Return:* ${item.no_return}`,
    `*Customer:* ${item.customer || '—'}`,
    `*Tanggal Penerimaan:* ${formatDate(item.tanggal_penerimaan)}`,
    '',
    '*Detail Item Retur:*',
    itemDetails,
    '',
    'Mohon informasikan No. Claim melalui balasan pesan ini agar dapat segera kami catat pada aplikasi dan proses administrasi Return dapat dilanjutkan secara real time.',
    '',
    'Terima kasih.',
  ].join('\n')
}


function buildQaMessage() {
  return [
    'Halo Bapak/Ibu QA,',
    '',
    `Mohon bantuan untuk menginformasikan *${missingQaRequests}* yang telah diterbitkan atau ditetapkan untuk Return Customer berikut:`,
    '',
    `*No Return:* ${item.no_return}`,
    `*Customer:* ${item.customer || '—'}`,
    `*Tanggal Penerimaan:* ${formatDate(item.tanggal_penerimaan)}`,
    '',
    '*Detail Item Retur:*',
    qaItemDetails,
    '',
    'Mohon informasikan No. NCR dan/atau hasil Disposisi melalui balasan pesan ini agar dapat segera kami catat pada aplikasi dan proses Return dapat ditindaklanjuti secara real time.',
    '',
    'Terima kasih.',
  ].join('\n')
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

      <div className="my-5 border-t border-border" />

      <section>
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />

          <h3 className="text-sm font-semibold text-foreground">
            Informasi administrasi
          </h3>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            <AdminHeaderForm
              item={item}
              claimCount={claimCount}
              ncrCount={ncrCount}
              setClaimCount={setClaimCount}
              setNcrCount={setNcrCount}
              isPending={isPending}
            />

            <div className="border-t border-border pt-1" />

            <ReturnItemsSection
              items={item.items}
              isEditing
              isPending={isPending}
            />

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
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
        ) : (
          <>
            <AdminReturnSummary item={item} />

            <ReturnItemsSection items={item.items} />

            {(needsSalesFollowUp || needsQaFollowUp) && (
              <div className="mt-5 flex w-full flex-col items-start gap-2">
                {needsSalesFollowUp && (
                  <button
                    type="button"
                    onClick={() => openWhatsAppMessage(buildSalesMessage())}
                    className="inline-flex min-h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-emerald-600/20 bg-emerald-600/10 px-3 py-2 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600/15 dark:text-emerald-300"
                  >
                    <MessageCircle className="size-4 shrink-0" />
                    Follow-up Sales (No Claim)
                  </button>
                )}

                {needsQaFollowUp && (
                  <button
                    type="button"
                    onClick={() => openWhatsAppMessage(buildQaMessage())}
                    className="inline-flex min-h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-sky-600/20 bg-sky-600/10 px-3 py-2 text-center text-sm font-semibold text-sky-700 transition hover:bg-sky-600/15 dark:text-sky-300"
                  >
                    <MessageCircle className="size-4 shrink-0" />
                    Follow-up QA (No NCR / Disposisi)
                  </button>
                )}
              </div>
            )}

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
          </>
        )}
      </section>

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

/* -------------------------------------------------------------------------- */
/* DAFTAR MONITORING RETURN                                                    */
/* -------------------------------------------------------------------------- */

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
        item.no_ncr_2 ?? '',
        ...item.items.flatMap((material) => [
          material.diameter ?? '',
          String(material.tebal ?? ''),
          String(material.panjang ?? ''),
          material.batch ?? '',
          material.no_box ?? '',
          material.location ?? '',
          material.disposisi ?? '',
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
              : 'Coba gunakan kata kunci lain seperti No Return, nama customer, ukuran, nomor Claim, NCR, atau Disposisi.'}
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