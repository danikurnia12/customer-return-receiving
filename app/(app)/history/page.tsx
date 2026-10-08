import type { Metadata } from 'next'
import { ClipboardCheck, History, ShieldCheck } from 'lucide-react'

import { FilterBar } from '@/components/app/filter-bar'
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SetupNotice,
} from '@/components/app/states'
import { HistoryList } from '@/components/history/history-list'
import { formatNumber } from '@/lib/format'
import { listHistory } from '@/lib/services/history'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const metadata: Metadata = {
  title: 'Return History | SPINDO 5',
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams

  const header = (
    <PageHeader
      title="Return History"
      description="Jejak audit seluruh aktivitas return. History tidak dapat diubah atau dihapus."
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
    const entries = await listHistory({
      q: sp.q,
      from: sp.from,
      to: sp.to,
    })

    return (
      <div className="space-y-6">
        {header}

        {/* Audit information */}
        <section className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="absolute inset-y-0 left-0 w-1 bg-primary" />

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Audit Trail Return
                </p>

                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Seluruh aktivitas pada proses return dicatat sebagai
                  riwayat sistem untuk membantu monitoring, verifikasi,
                  dan penelusuran aktivitas.
                </p>
              </div>
            </div>

            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Aktivitas
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
                {formatNumber(entries.length)}
              </p>
            </div>
          </div>
        </section>

        {/* Filter */}
        <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <History className="size-4 text-primary" />

            <div>
              <h2 className="text-sm font-semibold">
                Filter History
              </h2>

              <p className="text-xs text-muted-foreground">
                Cari aktivitas berdasarkan No Return atau periode
                penerimaan.
              </p>
            </div>
          </div>

          <FilterBar
            showSearch
            showCustomer={false}
            showStatus={false}
            searchPlaceholder="Cari No Return"
          />
        </section>

        {/* Activity summary */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-primary" />

            <div>
              <p className="text-sm font-semibold text-foreground">
                Riwayat Aktivitas
              </p>

              <p className="text-sm text-muted-foreground">
                Menampilkan{' '}
                <span className="font-semibold text-foreground">
                  {formatNumber(entries.length)}
                </span>{' '}
                aktivitas
              </p>
            </div>
          </div>

          <div className="h-1 w-16 rounded-full bg-primary sm:w-20" />
        </div>

        {/* History */}
        {entries.length === 0 ? (
          <div className="rounded-xl border bg-card shadow-sm">
            <EmptyState
              title="Belum ada aktivitas"
              description="Aktivitas return akan tercatat otomatis di sini."
            />
          </div>
        ) : (
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b bg-muted/30 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <History className="size-4 text-primary" />

                <span className="text-sm font-semibold">
                  Activity Log
                </span>

                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {formatNumber(entries.length)}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <HistoryList entries={entries} />
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