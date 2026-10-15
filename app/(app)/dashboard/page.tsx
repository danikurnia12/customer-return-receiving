import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  ClipboardCheck,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'

import { FilterBar } from '@/components/app/filter-bar'
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SetupNotice,
} from '@/components/app/states'
import { ReturnChart } from '@/components/dashboard/return-chart'
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

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const sp = await searchParams
  const filters = buildFilters(sp)

  const user = await getCurrentUser()
  const canCreate = canCreateReturn(user?.role)

  const header = (
    <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/5 blur-3xl" />

        <div className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-foreground/5 blur-3xl" />

        <div className="absolute right-0 top-0 h-full w-1/3 opacity-[0.035]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                'linear-gradient(135deg, currentColor 25%, transparent 25%, transparent 50%, currentColor 50%, currentColor 75%, transparent 75%)',
              backgroundSize: '18px 18px',
            }}
          />
        </div>
      </div>

      <div className="relative">
        {/* Corporate accent */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary" />

        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:flex">
              <RotateCcw className="size-6" />
            </div>

            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  SPINDO 5
                </span>

                <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />

                <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:block">
                  Warehouse
                </span>
              </div>

              <PageHeader
                title="Dashboard Return"
                description="Control center penerimaan dan monitoring material return dari customer."
                actions={null}
              />
            </div>
          </div>

          {canCreate ? (
            <Link
              href="/returns/new"
              className={buttonVariants({
                className:
                  'group h-10 gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md',
              })}
            >
              <Plus className="size-4" />
              Penerimaan Baru
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (!isSupabaseConfigured) {
    return (
      <main
        id="dashboard-screenshot"
        className="min-h-full space-y-6 bg-background pb-8"
      >
        {header}

        <SetupNotice />
      </main>
    )
  }

  try {
    const [dashboardData, customers] = await Promise.all([
      getDashboardData(filters),
      listCustomers(),
    ])

    return (
      <main
        id="dashboard-screenshot"
        className="min-h-full space-y-6 bg-background pb-8"
      >
        {header}

        {/* =====================================================
            QUICK OVERVIEW
            ===================================================== */}
        <section
          aria-label="Ringkasan sistem return"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {/* Return Monitoring */}
          <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <RotateCcw className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">
                  Return Monitoring
                </p>

                <p className="text-sm font-bold text-foreground">
                  Real Time
                </p>
              </div>
            </div>
          </div>

          {/* Receiving */}
          <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                <PackageCheck className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">
                  Receiving
                </p>

                <p className="text-sm font-bold text-foreground">
                  Material Return
                </p>
              </div>
            </div>
          </div>

          {/* Monitoring */}
          <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <ClipboardCheck className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">
                  Monitoring
                </p>

                <p className="text-sm font-bold text-foreground">
                  Status & Aging
                </p>
              </div>
            </div>
          </div>

          {/* Control */}
          <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <ShieldCheck className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">
                  Control
                </p>

                <p className="text-sm font-bold text-foreground">
                  Data Validated
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
    FILTER
    ===================================================== */}
<section
  aria-label="Filter dashboard"
  className="rounded-xl border bg-card px-3 py-2.5 shadow-sm"
>
  <div className="mb-2 flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-2">
      <span className="size-1.5 shrink-0 rounded-full bg-primary" />

      <h2 className="text-xs font-bold tracking-tight text-foreground">
        Filter Monitoring
      </h2>

      <span className="hidden text-[10px] text-muted-foreground sm:inline">
        Periode • Customer • Status
      </span>
    </div>

    <span className="hidden shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:block">
      Return Control
    </span>
  </div>

  <FilterBar customers={customers} />
</section>

        {/* =====================================================
            KPI
            ===================================================== */}
        <section
          aria-label="Ringkasan return"
          className="space-y-3"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Performance Overview
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                Ringkasan Return
              </h2>
            </div>

            <span className="hidden text-xs text-muted-foreground sm:block">
              Berdasarkan filter aktif
            </span>
          </div>

          <StatCards data={dashboardData} />
        </section>

        {/* =====================================================
            TREND
            ===================================================== */}
<section
  aria-label="Analytics return"
  className="overflow-hidden rounded-2xl border bg-card shadow-sm"
>
  <div className="border-b px-5 py-4">
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Analytics
        </p>

        <h2 className="mt-1 text-base font-bold tracking-tight text-foreground">
          Return Analytics
        </h2>

        <p className="text-xs text-muted-foreground">
          Monitoring trend, status, dan distribusi customer berdasarkan data return aktual.
        </p>
      </div>

      <div className="mt-2 flex items-center gap-2 sm:mt-0">
        <span className="size-2 rounded-full bg-primary" />

        <span className="text-xs font-medium text-muted-foreground">
          Live Supabase Data
        </span>
      </div>
    </div>
  </div>

  <div className="p-4 sm:p-5">
    <ReturnChart
  data={dashboardData.chart}
  mode={dashboardData.chartMode}
  statusData={dashboardData.statusChart}
  customerData={dashboardData.customerChart}
  locationData={dashboardData.locationChart}
  locationSeries={dashboardData.locationSeries}
/>
  </div>
</section>

        {/* =====================================================
            RECENT RETURNS
            ===================================================== */}
        <section
          className="overflow-hidden rounded-2xl border bg-card shadow-sm"
          aria-labelledby="recent-heading"
        >
          <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary" />

                <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Latest Activity
                </span>
              </div>

              <h2
                id="recent-heading"
                className="text-base font-bold tracking-tight text-foreground"
              >
                Return Terbaru
              </h2>

              <p className="text-xs text-muted-foreground">
                Data penerimaan return terbaru yang masuk ke sistem.
              </p>
            </div>

            <Link
              href="/returns"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Lihat semua

              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {dashboardData.recent.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Belum ada return"
                description="Data penerimaan return akan muncul di sini setelah transaksi pertama dibuat."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ReturnsTable rows={dashboardData.recent} />
            </div>
          )}
        </section>

        {/* =====================================================
            FOOTER
            ===================================================== */}
        <div className="flex flex-col gap-2 border-t pt-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>SPINDO 5 • Warehouse Return Monitoring</p>

          <p>Internal System • Return Receiving & Monitoring</p>
        </div>
      </main>
    )
  } catch (error) {
    console.error('[Dashboard Return]', error)

    return (
      <main
        id="dashboard-screenshot"
        className="min-h-full space-y-6 bg-background pb-8"
      >
        {header}

        <ErrorState message={getSafeErrorMessage(error)} />
      </main>
    )
  }
}