import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'

import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Plus,
  RotateCcw,
} from 'lucide-react'

import { FilterBar } from '@/components/app/filter-bar'

import {
  EmptyState,
  ErrorState,
  SetupNotice,
} from '@/components/app/states'

import { StatCards } from '@/components/dashboard/stat-cards'
import { ReturnsTable } from '@/components/returns/returns-table'
import { buttonVariants } from '@/components/ui/button'

import { getCurrentUser } from '@/lib/auth'
import { canCreateReturn } from '@/lib/permissions'

import {
  getDashboardData,
  listCustomers,
} from '@/lib/services/returns'

import { isSupabaseConfigured } from '@/lib/supabase/config'

import type { ReturnFilters } from '@/lib/types'

/* Recharts tetap dipisahkan dari bundle awal Dashboard. */
const ReturnChart = dynamic(
  () =>
    import('@/components/dashboard/return-chart').then(
      (module) => module.ReturnChart,
    ),
  {
    loading: () => (
      <div className="space-y-4" aria-label="Memuat grafik Dashboard">
        <div className="h-[340px] animate-pulse rounded-xl border bg-muted/40" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-[390px] animate-pulse rounded-xl border bg-muted/40" />
          <div className="h-[390px] animate-pulse rounded-xl border bg-muted/40" />
        </div>
      </div>
    ),
  },
)

export const metadata: Metadata = {
  title: 'Dashboard Return | SPINDO 5',
  description:
    'Dashboard monitoring penerimaan material return customer SPINDO 5.',
}

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | undefined>>
}

function cleanParam(value?: string) {
  if (!value) return undefined

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : undefined
}

function buildFilters(
  searchParams: Record<string, string | undefined>,
): ReturnFilters {
  return {
    from: cleanParam(searchParams.from),
    to: cleanParam(searchParams.to),
    customer: cleanParam(searchParams.customer),
    status: cleanParam(searchParams.status),
  }
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return 'Data dashboard belum dapat dimuat. Silakan coba lagi.'
  }

  return 'Terjadi kesalahan saat memuat dashboard.'
}

function DashboardHeader({ canCreate }: { canCreate: boolean }) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <RotateCcw className="size-5" />
        </div>

        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              SPINDO 5
            </span>
            <span className="size-1 rounded-full bg-muted-foreground/50" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Warehouse
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard Return
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Monitoring penerimaan dan progres material return customer.
          </p>
        </div>
      </div>

      {canCreate ? (
        <Link
          href="/returns/new"
          className={buttonVariants({
            className:
              'group h-10 shrink-0 gap-2 rounded-lg px-4 font-semibold shadow-sm',
          })}
        >
          <Plus className="size-4" />
          Penerimaan Baru
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </header>
  )
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const sp = await searchParams
  const filters = buildFilters(sp)

  /* Pertahankan pemeriksaan user sebelum query data. */
  const user = await getCurrentUser()
  const canCreate = canCreateReturn(user?.role)

  if (!isSupabaseConfigured) {
    return (
      <main
        id="dashboard-screenshot"
        className="min-h-full space-y-6 bg-background pb-8"
      >
        <DashboardHeader canCreate={canCreate} />
        <SetupNotice />
      </main>
    )
  }

  try {
    /* Kedua query tetap berjalan paralel. */
    const [dashboardData, customers] = await Promise.all([
      getDashboardData(filters),
      listCustomers(),
    ])

    const todayRows = dashboardData.recent.map(
      ({ header }) => header,
    )

    return (
      <main
        id="dashboard-screenshot"
        className="mx-auto min-h-full w-full max-w-[1600px] space-y-6 bg-background pb-8"
      >
        <DashboardHeader canCreate={canCreate} />

        {/* FILTER */}
        <section
          aria-label="Filter dashboard"
          className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">
              Filter Monitoring
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Atur periode, customer, dan status untuk statistik serta grafik.
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <FilterBar customers={customers} popup />
          </div>
        </section>

        {/* RINGKASAN */}
        <section aria-labelledby="summary-heading" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="summary-heading"
                className="text-lg font-bold tracking-tight text-foreground"
              >
                Ringkasan Return
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Indikator penerimaan berdasarkan filter aktif.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Data Supabase
            </span>
          </div>

          <StatCards data={dashboardData} />
        </section>

        {/* ANALYTICS */}
        <section aria-labelledby="analytics-heading" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="analytics-heading"
                className="text-lg font-bold tracking-tight text-foreground"
              >
                Analisis Return
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tren penerimaan, Qty Aktual, dan distribusi Return per customer.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Data langsung
            </span>
          </div>

          <ReturnChart
            data={dashboardData.chart}
            mode={dashboardData.chartMode}
            customerQtyData={dashboardData.customerQtyChart}
            customerData={dashboardData.customerChart}
              adminProgressData={dashboardData.adminProgressChart}
              disposisiData={dashboardData.disposisiChart}
          />
        </section>

        {/* RETURN HARI INI - tidak mengikuti filter grafik/dashboard. */}
        <section
          aria-labelledby="today-returns-heading"
          className="space-y-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="size-4" />
              </span>
              <div>
                <h2
                  id="today-returns-heading"
                  className="text-lg font-bold tracking-tight text-foreground"
                >
                  Retur Hari Ini
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Transaksi penerimaan hari ini beserta rincian material.
                </p>
              </div>
            </div>

            <Link
              href="/returns"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Lihat semua Return
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {todayRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card px-4 py-8 sm:py-10">
              <EmptyState
                title="Belum ada retur hari ini."
                description="Transaksi penerimaan yang tercatat hari ini akan ditampilkan di bagian ini."
              />
            </div>
          ) : (
            <ReturnsTable
              rows={todayRows}
              details={dashboardData.recent}
              variant="dashboard"
            />
          )}
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col gap-1.5 border-t border-border/80 pt-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>SPINDO 5 · Warehouse Return Monitoring</p>
          <p>Internal System · Return Receiving &amp; Monitoring</p>
        </footer>
      </main>
    )
  } catch (error) {
    console.error('[Dashboard Return]', error)

    return (
      <main
        id="dashboard-screenshot"
        className="min-h-full space-y-6 bg-background pb-8"
      >
        <DashboardHeader canCreate={canCreate} />
        <ErrorState message={getSafeErrorMessage(error)} />
      </main>
    )
  }
}