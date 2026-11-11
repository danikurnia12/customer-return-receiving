
import Link from 'next/link'
import { AlertCircle, ClipboardList, RefreshCw } from 'lucide-react'

import { InspectionMonitoringList } from '@/components/inspection/inspection-monitoring-list'
import { listInspectionMonitoring } from '@/lib/services/inspection'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Monitoring Progres Administrasi Return',
  description:
    'Monitoring penerimaan, ukuran item, nomor Claim, nomor NCR, dan Disposisi Return.',
}

export default async function InspectionPage() {
  let items: Awaited<
    ReturnType<typeof listInspectionMonitoring>
  > = []

  let loadError: string | null = null

  try {
    items = await listInspectionMonitoring()
  } catch (error) {
    console.error('[InspectionPage]', error)

    loadError =
      error instanceof Error
        ? error.message
        : 'Gagal memuat data monitoring Return.'
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Monitoring Progres Administrasi Return
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Pantau penerimaan, ukuran material, nomor Claim,
              nomor NCR, dan Disposisi setiap transaksi Return.
            </p>
          </div>
        </div>

        {!loadError && (
          <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            {items.length} Return
          </span>
        )}
      </header>

      {loadError ? (
        <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

            <div className="min-w-0">
              <h2 className="font-semibold text-foreground">
                Data monitoring gagal dimuat
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {loadError}
              </p>

              <Link
                href="/inspection"
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <RefreshCw className="size-4" />
                Muat ulang halaman
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <InspectionMonitoringList items={items} />
      )}
    </main>
  )
}