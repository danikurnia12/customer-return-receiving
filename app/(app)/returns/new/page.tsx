import type { Metadata } from 'next'
import Link from 'next/link'

import {
  EmptyState,
  PageHeader,
} from '@/components/app/states'
import { ReturnForm } from '@/components/returns/return-form'
import { buttonVariants } from '@/components/ui/button'

import { getCurrentUser } from '@/lib/auth'
import { canCreateReturn } from '@/lib/permissions'
import { listCustomers } from '@/lib/services/returns'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const metadata: Metadata = {
  title: 'Penerimaan Return Baru',
  description:
    'Mencatat penerimaan material return dari customer.',
}

export default async function NewReturnPage() {
  const user = await getCurrentUser()

  /*
   * ============================================================
   * AUTHORIZATION
   * ============================================================
   *
   * Permission harus diperiksa di server.
   * Menyembunyikan tombol saja tidak cukup karena user masih
   * dapat mencoba membuka URL /returns/new secara langsung.
   */

  if (isSupabaseConfigured && !canCreateReturn(user?.role)) {
    return (
      <main className="space-y-6">
        <PageHeader
          title="Penerimaan Return Baru"
          description="Pencatatan penerimaan material retur dari customer."
        />

        <EmptyState
          title="Akses ditolak"
          description="Role Anda tidak memiliki izin untuk membuat penerimaan return baru."
          action={
            <Link
              href="/returns"
              className={buttonVariants({
                variant: 'outline',
              })}
            >
              Kembali ke Return Items
            </Link>
          }
        />
      </main>
    )
  }

  /*
   * ============================================================
   * CUSTOMER DATA
   * ============================================================
   *
   * Saat Supabase belum aktif, halaman tetap bisa dibuka untuk
   * kebutuhan development / preview.
   *
   * Jika query customer gagal, jangan tampilkan error database
   * kepada user.
   */

  let customers: Awaited<ReturnType<typeof listCustomers>> = []

  if (isSupabaseConfigured) {
    try {
      customers = await listCustomers()
    } catch (error) {
      console.error('[New Return] Failed to load customers:', error)

      customers = []
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Penerimaan Return Baru"
        description="Catat penerimaan material retur dari customer beserta seluruh item materialnya."
      />

      {!isSupabaseConfigured && (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"
        >
          <p className="font-medium text-foreground">
            Mode pengembangan
          </p>

          <p className="mt-1">
            Supabase belum terhubung. Form dapat digunakan untuk
            pengecekan tampilan, tetapi penyimpanan data dan upload
            foto belum aktif.
          </p>
        </div>
      )}

      {isSupabaseConfigured && customers.length === 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm"
        >
          <p className="font-medium">
            Data customer belum tersedia
          </p>

          <p className="mt-1 text-muted-foreground">
            Pastikan master customer sudah tersedia sebelum membuat
            penerimaan return.
          </p>
        </div>
      )}

      <ReturnForm
        defaultPic={user?.name ?? ''}
        customers={customers}
      />
    </main>
  )
}