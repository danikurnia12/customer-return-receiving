
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import type { InspectionQueueItem } from '@/lib/services/inspection'

type InspectionFormProps = {
  item: InspectionQueueItem
}

export function InspectionForm({ item }: InspectionFormProps) {
  const router = useRouter()

  useEffect(() => {
    router.replace('/inspection')
  }, [router, item.id])

  return (
    <div
      role="status"
      className="rounded-2xl border border-border bg-card px-5 py-8 text-center"
    >
      <h2 className="text-base font-semibold text-foreground">
        Halaman inspeksi item telah dipindahkan
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Silakan gunakan halaman Monitoring Progres Administrasi Return.
      </p>

      <button
        type="button"
        onClick={() => router.replace('/inspection')}
        className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        Buka Monitoring Return
      </button>
    </div>
  )
}
