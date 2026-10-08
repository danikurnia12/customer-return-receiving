'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Save,
} from 'lucide-react'

import { updateInspectionItemAction } from '@/app/actions/inspection'
import type { InspectionQueueItem } from '@/lib/services/inspection'

type InspectionFormProps = {
  item: InspectionQueueItem
}

export function InspectionForm({
  item,
}: InspectionFormProps) {
  const router = useRouter()

  const [isPending, startTransition] = useTransition()

  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [progres, setProgres] = useState(
    String(item.progres ?? 0),
  )

  // Mencegah redirect dipanggil lebih dari satu kali
  const hasRedirected = useRef(false)

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    // Jangan izinkan submit ulang ketika proses masih berjalan
    if (isPending || hasRedirected.current) {
      return
    }

    setMessage(null)

    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const result =
        await updateInspectionItemAction(
          String(item.id),
          formData,
        )

      // Jika gagal
      if (!result.ok) {
        setMessage({
          type: 'error',
          text:
            result.error ??
            'Data inspeksi gagal disimpan.',
        })

        return
      }

      // Tandai bahwa proses redirect sudah dijadwalkan
      if (hasRedirected.current) {
        return
      }

      hasRedirected.current = true

      setMessage({
        type: 'success',
        text: 'Data inspeksi berhasil disimpan.',
      })

      // Beri waktu agar pesan berhasil terlihat
      setTimeout(() => {
        router.push('/inspection')
        router.refresh()
      }, 800)
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Status & Progress */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardCheck className="size-4" />
          </div>

          <div>
            <h2 className="font-semibold">
              Status Inspeksi
            </h2>

            <p className="text-xs text-muted-foreground">
              Tentukan status dan progres material.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Status */}
          <div className="space-y-2">
            <label
              htmlFor="status"
              className="text-sm font-medium"
            >
              Status
            </label>

            <select
              id="status"
              name="status"
              defaultValue={item.status ?? 'Open'}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="Open">
                Open
              </option>

              <option value="Proses">
                Proses
              </option>

              <option value="Hold">
                Hold
              </option>

              <option value="Selesai">
                Selesai
              </option>
            </select>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="progres"
                className="text-sm font-medium"
              >
                Progres
              </label>

              <span className="text-sm font-bold text-primary">
                {progres}%
              </span>
            </div>

            <input
              id="progres"
              name="progres"
              type="range"
              min="0"
              max="100"
              step="5"
              value={progres}
              disabled={isPending}
              onChange={(event) =>
                setProgres(event.target.value)
              }
              className="w-full accent-primary"
            />

            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Inspection Data */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ClipboardCheck className="size-4" />
          </div>

          <div>
            <h2 className="font-semibold">
              Hasil Inspeksi
            </h2>

            <p className="text-xs text-muted-foreground">
              Lengkapi hasil pemeriksaan material return.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* No NCR */}
          <div className="space-y-2">
            <label
              htmlFor="no_ncr"
              className="text-sm font-medium"
            >
              No NCR
            </label>

            <input
              id="no_ncr"
              name="no_ncr"
              type="text"
              defaultValue={item.no_ncr ?? ''}
              placeholder="Masukkan No NCR"
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Disposisi */}
          <div className="space-y-2">
            <label
              htmlFor="disposisi"
              className="text-sm font-medium"
            >
              Disposisi
            </label>

            <input
              id="disposisi"
              name="disposisi"
              type="text"
              defaultValue={item.disposisi ?? ''}
              placeholder="Contoh: Repair / Scrap / Rework"
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* PIC */}
          <div className="space-y-2">
            <label
              htmlFor="pic"
              className="text-sm font-medium"
            >
              PIC
            </label>

            <input
              id="pic"
              name="pic"
              type="text"
              defaultValue={item.pic ?? ''}
              placeholder="Nama PIC"
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Target */}
          <div className="space-y-2">
            <label
              htmlFor="target"
              className="text-sm font-medium"
            >
              Target
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                id="target"
                name="target"
                type="date"
                defaultValue={item.target ?? ''}
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Tindakan */}
          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="tindakan"
              className="text-sm font-medium"
            >
              Tindakan
            </label>

            <textarea
              id="tindakan"
              name="tindakan"
              rows={4}
              defaultValue={item.tindakan ?? ''}
              placeholder="Tuliskan tindakan yang dilakukan terhadap material..."
              disabled={isPending}
              className="w-full resize-none rounded-lg border bg-background px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </section>

      {/* Message */}
      {message && (
        <div
          className={
            message.type === 'success'
              ? 'flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400'
              : 'flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive'
          }
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="size-5 shrink-0" />
          ) : (
            <ClipboardCheck className="size-5 shrink-0" />
          )}

          <span>{message.text}</span>
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || hasRedirected.current}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menyimpan...
            </>
          ) : hasRedirected.current ? (
            <>
              <CheckCircle2 className="size-4" />
              Berhasil Disimpan
            </>
          ) : (
            <>
              <Save className="size-4" />
              Simpan Hasil Inspeksi
            </>
          )}
        </button>
      </div>
    </form>
  )
}