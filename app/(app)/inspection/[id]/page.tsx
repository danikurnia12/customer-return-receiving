import { notFound } from 'next/navigation'

import { getInspectionItem } from '@/lib/services/inspection'
import { InspectionForm } from '@/components/inspection/inspection-form'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  let item

  try {
    item = await getInspectionItem(id)
  } catch (error) {
    console.error('[InspectionDetailPage]', error)
    notFound()
  }

  const ukuran = [
    item.diameter !== null ? item.diameter : '-',
    item.tebal !== null ? item.tebal : '-',
    item.panjang !== null ? item.panjang : '-',
  ].join(' × ')

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Inspeksi Material Return
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Periksa kondisi material dan tentukan hasil inspeksi.
        </p>
      </div>

      {/* Informasi Material */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Informasi Material
          </h2>

          <p className="text-sm text-muted-foreground">
            Data utama material yang sedang diperiksa.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Customer */}
          <div className="rounded-xl border bg-background p-4">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Customer
            </p>

            <p className="text-base font-semibold">
              {item.customer || '-'}
            </p>
          </div>

          {/* Ukuran */}
          <div className="rounded-xl border bg-background p-4">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Ukuran
            </p>

            <p className="text-base font-semibold">
              {ukuran}
            </p>
          </div>

          {/* Qty Aktual */}
          <div className="rounded-xl border bg-background p-4">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Qty Aktual
            </p>

            <p className="text-base font-semibold">
              {item.qty_aktual}
            </p>
          </div>
        </div>
      </section>

      {/* Form Inspeksi */}
      <InspectionForm item={item} />
    </main>
  )
}