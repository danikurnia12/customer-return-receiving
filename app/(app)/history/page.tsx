
import type { Metadata } from 'next'

import {
  Activity,
  CalendarDays,
  History,
  Search,
  ShieldCheck,
} from 'lucide-react'

import { FilterBar } from '@/components/app/filter-bar'

import {
  EmptyState,
  ErrorState,
  SetupNotice,
} from '@/components/app/states'

import { HistoryList } from '@/components/history/history-list'

import { formatNumber } from '@/lib/format'
import { listHistory } from '@/lib/services/history'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const metadata: Metadata = {
  title: 'Riwayat Aktivitas Return | SPINDO 5',
  description:
    'Audit trail aktivitas penerimaan, perubahan, dan administrasi Return SPINDO 5.',
}

type HistoryPageProps = {
  searchParams: Promise<
    Record<string, string | undefined>
  >
}

export default async function HistoryPage({
  searchParams,
}: HistoryPageProps) {
  const sp = await searchParams

  const hasFilters = Boolean(
    sp.q?.trim() ||
    sp.from ||
    sp.to,
  )

  const pageHeader = (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <History className="size-5" />
        </div>

        <div className="min-w-0">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            SPINDO 5 · Warehouse
          </p>

          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Riwayat Aktivitas Return
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Pantau dan telusuri seluruh aktivitas serta
            perubahan data transaksi Return.
          </p>
        </div>
      </div>

      <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
        <ShieldCheck className="size-3.5 text-primary" />

        <span className="text-xs font-semibold text-primary">
          Audit Trail
        </span>

        <span className="size-1 rounded-full bg-primary/50" />

        <span className="text-xs text-muted-foreground">
          Read Only
        </span>
      </div>
    </header>
  )

  if (!isSupabaseConfigured) {
    return (
      <main className="space-y-6 pb-8">
        {pageHeader}
        <SetupNotice />
      </main>
    )
  }

  try {
    const entries = await listHistory({
      q: sp.q,
      from: sp.from,
      to: sp.to,
    })

    return (
      <main className="space-y-6 pb-8">
        {pageHeader}

        {/* =====================================================
            AUDIT TRAIL SUMMARY
            ===================================================== */}

        <section
          aria-label="Ringkasan audit"
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">
                  Sistem Pencatatan Audit
                </h2>

                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Setiap aktivitas Return dicatat untuk membantu
                  monitoring, verifikasi, dan penelusuran
                  perubahan data. Riwayat tersedia untuk
                  pemeriksaan dan tidak diedit melalui halaman ini.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 rounded-xl bg-muted/40 px-4 py-3 sm:min-w-40 sm:justify-center">
              <div className="sm:text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Aktivitas Ditemukan
                </p>

                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">
                  {formatNumber(entries.length)}
                </p>
              </div>

              <Activity className="size-5 text-primary sm:hidden" />
            </div>
          </div>
        </section>

        {/* =====================================================
            FILTER HISTORY
            ===================================================== */}

        <section
          aria-label="Pencarian dan filter riwayat"
          className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
        >
          <div className="mb-4 flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="size-4" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">
                Pencarian & Filter
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Cari riwayat berdasarkan nomor Return atau
                tentukan periode waktu aktivitas.
              </p>
            </div>
          </div>

          <FilterBar
            showSearch
            showCustomer={false}
            showStatus={false}
            searchPlaceholder="Cari No Return..."
          />
        </section>

        {/* =====================================================
            ACTIVITY LIST
            ===================================================== */}

        <section
          aria-label="Daftar aktivitas Return"
          className="space-y-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <History className="size-4" />
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Daftar Aktivitas
                </h2>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Catatan aktivitas dan perubahan transaksi Return.
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Activity className="size-3.5 text-primary" />
              {formatNumber(entries.length)} aktivitas
            </span>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 sm:py-12">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {hasFilters ? (
                  <Search className="size-5" />
                ) : (
                  <CalendarDays className="size-5" />
                )}
              </div>

              <div className="mt-3">
                <EmptyState
                  title={
                    hasFilters
                      ? 'Aktivitas tidak ditemukan'
                      : 'Belum ada aktivitas'
                  }
                  description={
                    hasFilters
                      ? 'Tidak ada aktivitas yang sesuai dengan pencarian atau periode yang dipilih. Coba gunakan kata kunci atau periode lain.'
                      : 'Aktivitas transaksi Return yang tercatat akan muncul di halaman ini.'
                  }
                />
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-1 border-b bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-primary" />

                  <span className="text-sm font-semibold text-foreground">
                    Audit Activity Log
                  </span>
                </div>

                <span className="text-xs text-muted-foreground">
                  Aktivitas terbaru ditampilkan terlebih dahulu
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <HistoryList entries={entries} />
              </div>
            </div>
          )}
        </section>

        {/* =====================================================
            FOOTER
            ===================================================== */}

        <footer className="flex flex-col gap-1 border-t border-border pt-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            SPINDO 5 · Warehouse Return Monitoring
          </p>

          <p>
            Internal System · Audit Trail & Activity Monitoring
          </p>
        </footer>
      </main>
    )
  } catch (error) {
    console.error('[HistoryPage]', error)

    return (
      <main className="space-y-6 pb-8">
        {pageHeader}

        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : 'Gagal memuat riwayat aktivitas Return.'
          }
        />
      </main>
    )
  }
}