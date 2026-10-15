import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList, Plus, RotateCcw } from 'lucide-react'

import { FilterBar } from '@/components/app/filter-bar'
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SetupNotice,
} from '@/components/app/states'
import { ReturnsTable } from '@/components/returns/returns-table'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'
import { formatNumber } from '@/lib/format'
import { canCreateReturn } from '@/lib/permissions'
import {
  listCustomers,
  listReturnSummaries,
} from '@/lib/services/returns'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const metadata: Metadata = {
  title: 'Return Items | SPINDO 5',
}

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams

  const user = await getCurrentUser()
  const canCreate = canCreateReturn(user?.role)

  const createButton = canCreate && (
    <Link
      href="/returns/new"
      className={buttonVariants({
        size: 'default',
      })}
    >
      <Plus className="size-4" />
      Penerimaan Baru
    </Link>
  )

  const header = (
    <PageHeader
      title="Material Return Items"
      description="Daftar penerimaan return customer beserta item materialnya."
      actions={createButton}
    />
  )

  if (!isSupabaseConfigured) {
    return (
      <>
        {header}
        <SetupNotice />
      </>
    )
  }

  try {
    const [rows, customers] = await Promise.all([
      listReturnSummaries({
        q: sp.q,
        from: sp.from,
        to: sp.to,
        customer: sp.customer,
        status: sp.status,
      }),
      listCustomers(),
    ])

    return (
      <div className="space-y-6">
        {header}

        {/* Intro */}
        <section className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="absolute inset-y-0 left-0 w-1 bg-primary" />

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <RotateCcw className="size-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Monitoring Return Receiving
                </p>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Pantau seluruh penerimaan material return customer,
                  mulai dari penerimaan hingga proses berikutnya.
                </p>
              </div>
            </div>

            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Return
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
                {formatNumber(rows.length)}
              </p>
            </div>
          </div>
        </section>

        {/* Filter */}
        <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" />

            <div>
              <h2 className="text-sm font-semibold">
                Filter & Pencarian
              </h2>

              <p className="text-xs text-muted-foreground">
                Gunakan filter untuk menemukan data return dengan cepat.
              </p>
            </div>
          </div>

          <FilterBar
            customers={customers}
            showSearch
          />
        </section>

        {/* Result summary */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Data Penerimaan Return
            </p>

            <p className="text-sm text-muted-foreground">
              Menampilkan{' '}
              <span className="font-semibold text-foreground">
                {formatNumber(rows.length)}
              </span>{' '}
              return
            </p>
          </div>

          <div className="h-1 w-16 rounded-full bg-primary sm:w-20" />
        </div>

        {/* Table / Empty */}
        {rows.length === 0 ? (
          <div className="rounded-xl border bg-card shadow-sm">
            <EmptyState
              title="Return tidak ditemukan"
              description="Belum ada data atau tidak ada data yang cocok dengan filter."
              action={createButton || undefined}
            />
          </div>
        ) : (
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b bg-muted/30 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-primary" />

                <span className="text-sm font-semibold">
                  Daftar Return
                </span>

                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {formatNumber(rows.length)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <ReturnsTable rows={rows} pagination />
            </div>
          </section>
        )}
      </div>
    )
  } catch (e) {
    return (
      <>
        {header}
        <ErrorState message={(e as Error).message} />
      </>
    )
  }
}