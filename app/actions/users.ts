'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { canManageUsers } from '@/lib/permissions'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Role } from '@/lib/types'

const updateSchema = z
  .object({
    role: z.enum(['master_data', 'admin', 'read_only']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    name: z.string().trim().min(1).max(80).optional(),
  })
  .refine(
    (data) =>
      data.role !== undefined ||
      data.status !== undefined ||
      data.name !== undefined,
    {
      message: 'Tidak ada perubahan data.',
    },
  )

function validUserId(userId: string) {
  return typeof userId === 'string' && userId.trim().length > 0
}

function friendlyUserError(error: unknown) {
  if (error instanceof Error) {
    console.error('[updateUserAction]', error)
  } else {
    console.error('[updateUserAction] Unknown error:', error)
  }

  return 'Perubahan data user gagal diproses. Silakan coba lagi.'
}

export async function updateUserAction(
  userId: string,
  input: z.input<typeof updateSchema>,
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      error: 'Supabase belum terhubung.',
    }
  }

  if (!validUserId(userId)) {
    return {
      ok: false,
      error: 'User tidak valid.',
    }
  }

  const parsed = updateSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Data user tidak valid.',
    }
  }

  const me = await getCurrentUser()

  if (!me) {
    return {
      ok: false,
      error: 'Sesi login tidak valid.',
    }
  }

  if (!canManageUsers(me.role)) {
    return {
      ok: false,
      error: 'Anda tidak memiliki izin mengelola user.',
    }
  }

  /*
   * Jangan izinkan Master Data menurunkan role dirinya sendiri
   * atau menonaktifkan akun yang sedang digunakan.
   */
  if (me.id === userId) {
    if (
      parsed.data.role !== undefined &&
      parsed.data.role !== 'master_data'
    ) {
      return {
        ok: false,
        error: 'Anda tidak dapat menurunkan role akun sendiri.',
      }
    }

    if (parsed.data.status === 'inactive') {
      return {
        ok: false,
        error: 'Anda tidak dapat menonaktifkan akun sendiri.',
      }
    }
  }

  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    /*
     * Pastikan user target memang ada di profiles.
     *
     * Gunakan Admin Client karena RLS profiles hanya mengizinkan
     * user membaca profilnya sendiri.
     *
     * Pemeriksaan izin sudah dilakukan sebelumnya melalui:
     * - getCurrentUser()
     * - canManageUsers()
     */
    const { data: targetUser, error: targetError } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (targetError) {
      console.error(
        '[updateUserAction] Target user error:',
        targetError,
      )

      return {
        ok: false,
        error: 'Data user tidak dapat diperiksa.',
      }
    }

    if (!targetUser) {
      return {
        ok: false,
        error: 'User tidak ditemukan.',
      }
    }

    const updateData: {
      nama?: string
      role?: Role
      is_active?: boolean
    } = {}

    if (parsed.data.name !== undefined) {
      updateData.nama = parsed.data.name
    }

    if (parsed.data.role !== undefined) {
      updateData.role = parsed.data.role
    }

    if (parsed.data.status !== undefined) {
      updateData.is_active = parsed.data.status === 'active'
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      console.error(
        '[updateUserAction] Database error:',
        updateError,
      )

      return {
        ok: false,
        error: friendlyUserError(updateError),
      }
    }

    revalidatePath('/settings/users')

    return {
      ok: true,
      data: undefined,
    }
  } catch (error) {
    return {
      ok: false,
      error: friendlyUserError(error),
    }
  }
}

export async function signOutAction() {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('[signOutAction]', error)
    }
  }

  redirect('/auth/login')
}