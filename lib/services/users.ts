import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { AppUser, Role } from '@/lib/types'

export async function listUsers(): Promise<AppUser[]> {
  const supabase = await createClient()
  const admin = createAdminClient()

  /*
   * Pastikan fungsi ini hanya dapat digunakan oleh user
   * yang sudah login dan memiliki akses Master Data.
   *
   * RLS tetap menjadi lapisan keamanan database.
   */
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (!currentUser) {
    throw new Error('Sesi login tidak valid.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', currentUser.id)
    .maybeSingle()

  if (profileError) {
    console.error('[listUsers] Profile error:', profileError)
    throw new Error('Data user tidak dapat diperiksa.')
  }

  if (!profile || profile.role !== 'master_data') {
    throw new Error('Anda tidak memiliki akses untuk melihat data user.')
  }

  /*
   * profiles = sumber nama, role, status, created_at.
   */
  const { data: profiles, error: profilesError } = await admin
  .from('profiles')
  .select('id, nama, role, is_active, created_at')
  .order('created_at', { ascending: true })

  if (profilesError) {
    console.error('[listUsers] Profiles error:', profilesError)
    throw new Error('Data user tidak dapat dimuat.')
  }

  /*
   * auth.users = sumber email.
   *
   * Admin client hanya digunakan di server untuk membaca
   * daftar user Auth.
   */
  const {
    data: authUsers,
    error: authError,
  } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (authError) {
    console.error('[listUsers] Auth error:', authError)
    throw new Error('Data akun user tidak dapat dimuat.')
  }

  const emailById = new Map(
    authUsers.users.map((user) => [
      user.id,
      user.email ?? '',
    ]),
  )

  return (profiles ?? []).map((profile) => ({
    id: profile.id,
    name: profile.nama ?? 'User',
    email: emailById.get(profile.id) ?? '',
    role: profile.role as Role,
    status: profile.is_active ? 'active' : 'inactive',
    created_at: profile.created_at,
  }))
}