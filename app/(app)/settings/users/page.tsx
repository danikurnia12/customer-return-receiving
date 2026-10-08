import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SetupNotice,
} from '@/components/app/states'
import { UsersTable } from '@/components/settings/users-table'
import { Card, CardContent } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth'
import {
  canManageUsers,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLES,
} from '@/lib/permissions'
import { listUsers } from '@/lib/services/users'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const metadata: Metadata = {
  title: 'Manajemen User',
}

function RoleGuide() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ROLES.map((role) => (
        <Card key={role} size="sm">
          <CardContent className="flex flex-col gap-1">
            <span className="text-sm font-semibold">
              {ROLE_LABELS[role]}
            </span>

            <span className="text-xs text-muted-foreground text-pretty">
              {ROLE_DESCRIPTIONS[role]}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function UsersPage() {
  /*
   * Jangan tampilkan halaman manajemen user jika Supabase
   * belum dikonfigurasi.
   */
  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader
          title="Manajemen User"
          description="Kelola role dan status user aplikasi."
        />

        <RoleGuide />

        <SetupNotice />
      </>
    )
  }

  /*
   * SECURITY:
   * Validasi dilakukan di server.
   *
   * Bukan hanya menyembunyikan tombol di UI.
   * Admin dan Read Only tidak boleh dapat membuka
   * /settings/users secara langsung.
   */
  const me = await getCurrentUser()

  if (!me) {
    redirect('/auth/login')
  }

  if (!canManageUsers(me.role)) {
    redirect('/dashboard')
  }

  const header = (
    <PageHeader
      title="Manajemen User"
      description="Kelola nama, role, dan status user aplikasi."
    />
  )

  try {
    const users = await listUsers()

    return (
      <>
        {header}

        <RoleGuide />

        {users.length === 0 ? (
          <EmptyState title="Belum ada user" />
        ) : (
          <UsersTable
            users={users}
            canManage={true}
            currentUserId={me.id}
          />
        )}
      </>
    )
  } catch (error) {
    console.error('[UsersPage]', error)

    return (
      <>
        {header}

        <ErrorState message="Data user tidak dapat dimuat. Silakan coba lagi." />
      </>
    )
  }
}