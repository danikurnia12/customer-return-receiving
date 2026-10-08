import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  ClipboardCheck,
  Package,
  RefreshCw,
} from 'lucide-react'

import { listInspectionQueue } from '@/lib/services/inspection'

function formatDate(value: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatNumber(value: number | null) {
  if (value === null || value === undefined) {
    return '-'
  }

  return new Intl.NumberFormat('id-ID').format(value)
}

function getStatusLabel(status: string | null) {
  if (!status) return 'Open'

  return status
}

function getStatusClass(status: string | null) {
  switch (status?.toLowerCase()) {
    case 'proses':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400'

    case 'hold':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400'

    case 'selesai':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'

    default:
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  }
}

export default async function InspectionPage() {
  let items

  try {
    items = await listInspectionQueue()
  } catch (error) {
    console.error('[InspectionPage]', error)

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck className="size-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Antrean Inspeksi
              </h1>

              <p className="text-sm text-muted-foreground">
                Material return yang menunggu proses inspeksi.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Gagal mengambil data antrean
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Data antrean inspeksi belum dapat dimuat.
                Silakan refresh halaman atau periksa koneksi
                ke Supabase.
              </p>

              <Link
                href="/inspection"
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <RefreshCw className="size-4" />
                Coba Lagi
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalQueue = items.length

  const totalQty = items.reduce(
    (total, item) =>
      total + Number(item.qty_aktual || 0),
    0,
  )

  const totalProgress = items.length
    ? Math.round(
        items.reduce(
          (total, item) =>
            total + Number(item.progres || 0),
          0,
        ) / items.length,
      )
    : 0

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
          ===================================================== */}
      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Decorative background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/5 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-foreground/5 blur-3xl"
        />

        <div className="relative">
          <div className="h-1 bg-primary" />

          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                <ClipboardCheck className="size-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    Antrean Inspeksi
                  </h1>

                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Live Data
                  </span>
                </div>

                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Monitoring material return yang sedang
                  menunggu dan menjalani proses inspeksi.
                </p>
              </div>
            </div>

            <Link
              href="/inspection"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
            >
              <RefreshCw className="size-4" />
              Refresh
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}
      <section
        aria-label="Ringkasan antrean inspeksi"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {/* Queue */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Antrean Material
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {totalQueue}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Material dengan status Open
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck className="size-5" />
            </div>
          </div>
        </div>

        {/* Qty */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Total Qty Material
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {formatNumber(totalQty)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Qty aktual seluruh antrean
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Package className="size-5" />
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Rata-rata Progres
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {totalProgress}%
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Progress rata-rata inspeksi
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ClipboardCheck className="size-5" />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          QUEUE TABLE / LIST
          ===================================================== */}
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Section Header */}
        <div className="border-b px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Daftar Antrean
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Material yang masih berada dalam antrean
                inspeksi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                {totalQueue} Material
              </span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
              <ClipboardCheck className="size-7 text-muted-foreground" />
            </div>

            <h3 className="mt-5 text-base font-semibold">
              Tidak ada antrean inspeksi
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Belum ada material return dengan status
              <span className="font-medium text-foreground">
                {' '}
                Open
              </span>{' '}
              yang menunggu proses inspeksi.
            </p>

            <Link
              href="/returns/new"
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium shadow-sm transition hover:bg-accent"
            >
              Buat Return Baru
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden border-b bg-muted/30 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground xl:grid xl:grid-cols-[minmax(240px,1.4fr)_150px_120px_120px_170px] xl:items-center xl:gap-4">
              <span>Material Return</span>
              <span>Ukuran</span>
              <span>Qty</span>
              <span>Progress</span>
              <span className="text-right">Action</span>
            </div>

            {/* Items */}
            <div className="divide-y">
              {items.map((item) => {
                const progress = Math.min(
                  100,
                  Math.max(0, Number(item.progres || 0)),
                )

                return (
                  <div
                    key={item.id}
                    className="p-5 transition-colors hover:bg-muted/20 sm:p-6"
                  >
                    <div className="grid gap-5 xl:grid-cols-[minmax(240px,1.4fr)_150px_120px_120px_170px] xl:items-center xl:gap-4">
                      {/* Material */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold tracking-tight">
                            {item.no_return}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              getStatusClass(item.status)
                            }`}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            Customer:{' '}
                            <span className="font-medium text-foreground">
                              {item.customer || '-'}
                            </span>
                          </span>

                          <span>
                            Penerimaan:{' '}
                            {formatDate(
                              item.tanggal_penerimaan,
                            )}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                            Kondisi:{' '}
                            <span className="font-medium text-foreground">
                              {item.kondisi_material || '-'}
                            </span>
                          </span>

                          <span className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                            Lokasi:{' '}
                            <span className="font-medium text-foreground">
                              {item.location || '-'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Ukuran */}
                      <div>
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground xl:hidden">
                          Ukuran
                        </p>

                        <p className="text-sm font-semibold">
                          {item.diameter ?? '-'} ×{' '}
                          {item.tebal ?? '-'} ×{' '}
                          {item.panjang ?? '-'}
                        </p>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Dia × Tebal × Panjang
                        </p>
                      </div>

                      {/* Qty */}
                      <div>
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground xl:hidden">
                          Qty Aktual
                        </p>

                        <p className="text-sm font-semibold">
                          {formatNumber(item.qty_aktual)}
                        </p>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Aktual
                        </p>
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Progress
                          </span>

                          <span className="text-xs font-bold text-primary">
                            {progress}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex justify-start xl:justify-end">
                        <Link
                          href={`/inspection/${item.id}`}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto"
                        >
                          Proses Inspeksi
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      {/* =====================================================
          FOOTNOTE
          ===================================================== */}
      <div className="flex items-center justify-between gap-4 px-1">
        <p className="text-[11px] text-muted-foreground">
          Data diambil langsung dari database Return Receiving.
        </p>

        <p className="hidden text-[11px] text-muted-foreground sm:block">
          SPINDO 5 • Inspection Control
        </p>
      </div>
    </div>
  )
}