
'use server'

import { revalidatePath } from 'next/cache'

import { getCurrentUser } from '@/lib/auth'
import { canEditReturn } from '@/lib/permissions'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

type ActionResult = {
  ok: boolean
  error?: string
}

const ALLOWED_STATUSES = [
  'Open',
  'Proses',
  'Hold',
  'Selesai',
] as const

function clean(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

function friendlyDbError(message?: string) {
  const normalized = message?.toLowerCase() ?? ''

  if (
    normalized.includes('row-level security') ||
    normalized.includes('42501') ||
    normalized.includes('permission denied')
  ) {
    return 'Anda tidak memiliki akses untuk mengubah data inspeksi.'
  }

  if (normalized.includes('invalid input syntax')) {
    return 'Format data tidak valid.'
  }

  if (normalized.includes('foreign key')) {
    return 'Data Return induk tidak ditemukan.'
  }

  if (
    normalized.includes('not-null') ||
    normalized.includes('null value')
  ) {
    return 'Ada data wajib yang belum lengkap.'
  }

  return 'Data inspeksi gagal disimpan. Silakan coba kembali.'
}

function normalizeForCompare(value: unknown) {
  if (value === '' || value === undefined) {
    return null
  }

  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value)
  }

  return value
}

function getChangedFields(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
) {
  const fields = [
    'status',
    'progres',
    'no_ncr',
    'disposisi',
    'pic',
    'tindakan',
    'target',
  ]

  return fields.reduce<
    Record<
      string,
      {
        old: unknown
        new: unknown
      }
    >
  >((result, field) => {
    const oldValue = normalizeForCompare(oldData[field])
    const newValue = normalizeForCompare(newData[field])

    if (oldValue !== newValue) {
      result[field] = {
        old: oldValue,
        new: newValue,
      }
    }

    return result
  }, {})
}

export async function updateInspectionItemAction(
  itemId: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      error:
        'Supabase belum terhubung. Hubungkan integrasi Supabase terlebih dahulu.',
    }
  }

  try {
    // 1. Verifikasi pengguna
    const user = await getCurrentUser()

    if (!user) {
      return {
        ok: false,
        error: 'Sesi berakhir. Silakan login kembali.',
      }
    }

    // 2. Tolak akun yang belum aktif
    if (user.status !== 'active') {
      return {
        ok: false,
        error: 'Akun Anda belum aktif. Hubungi administrator.',
      }
    }

    // 3. Periksa izin role
    if (!canEditReturn(user.role)) {
      return {
        ok: false,
        error:
          'Anda tidak memiliki akses untuk mengubah data inspeksi.',
      }
    }

    // 4. Validasi ID
    const numericId = Number(itemId)

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return {
        ok: false,
        error: 'ID item inspeksi tidak valid.',
      }
    }

    // 5. Validasi status
    const rawStatus = clean(formData.get('status'))
    const status = rawStatus ?? 'Open'

    if (
      !ALLOWED_STATUSES.some(
        (allowedStatus) => allowedStatus === status,
      )
    ) {
      return {
        ok: false,
        error: 'Status inspeksi tidak valid.',
      }
    }

    // 6. Validasi progres
    const progresRaw = clean(formData.get('progres'))
    const progres = progresRaw === null ? 0 : Number(progresRaw)

    if (
      !Number.isInteger(progres) ||
      progres < 0 ||
      progres > 100 ||
      progres % 5 !== 0
    ) {
      return {
        ok: false,
        error:
          'Progres harus berupa angka kelipatan 5 antara 0 sampai 100%.',
      }
    }

    // 7. Siapkan data yang diperbolehkan untuk diperbarui
    const nextData = {
      status,
      progres,
      no_ncr: clean(formData.get('no_ncr')),
      disposisi: clean(formData.get('disposisi')),
      pic: clean(formData.get('pic')),
      tindakan: clean(formData.get('tindakan')),
      target: clean(formData.get('target')),
    }

    const supabase = await createClient()

    // 8. Ambil data lama
    const oldResult = await supabase
      .from('return_items')
      .select(
        'id, return_header_id, status, progres, no_ncr, disposisi, pic, tindakan, target',
      )
      .eq('id', numericId)
      .maybeSingle()

    if (oldResult.error) {
      console.error(
        '[updateInspectionItemAction] old data:',
        oldResult.error.message,
      )

      return {
        ok: false,
        error: friendlyDbError(oldResult.error.message),
      }
    }

    const oldData = oldResult.data

    if (!oldData) {
      return {
        ok: false,
        error: 'Data material inspeksi tidak ditemukan.',
      }
    }

    // 9. Pastikan Return induk tersedia dan tidak dibatalkan
    const parentResult = await supabase
      .from('return_headers')
      .select('id, status')
      .eq('id', oldData.return_header_id)
      .maybeSingle()

    if (parentResult.error) {
      console.error(
        '[updateInspectionItemAction] parent:',
        parentResult.error.message,
      )

      return {
        ok: false,
        error: friendlyDbError(parentResult.error.message),
      }
    }

    const parent = parentResult.data

    if (!parent) {
      return {
        ok: false,
        error: 'Data Return induk tidak ditemukan.',
      }
    }

    if (parent.status === 'dibatalkan') {
      return {
        ok: false,
        error:
          'Material dari Return yang sudah dibatalkan tidak dapat diedit.',
      }
    }

    // 10. Periksa perubahan
    const changedFields = getChangedFields(
      oldData,
      nextData,
    )

    if (Object.keys(changedFields).length === 0) {
      return {
        ok: true,
      }
    }

    // 11. Simpan pembaruan inspeksi
    const updateResult = await supabase
      .from('return_items')
      .update(nextData)
      .eq('id', numericId)
      .select('id')

    if (updateResult.error) {
      console.error(
        '[updateInspectionItemAction] update:',
        updateResult.error.message,
      )

      return {
        ok: false,
        error: friendlyDbError(updateResult.error.message),
      }
    }

    if (!updateResult.data?.length) {
      return {
        ok: false,
        error:
          'Data tidak diperbarui. Periksa kembali izin akses dan data inspeksi.',
      }
    }

    // 12. Catat riwayat perubahan
    const historyResult = await supabase
      .from('return_history')
      .insert({
        return_header_id: oldData.return_header_id,
        user_id: user.id,
        action: 'UPDATE_ITEM',
        module: 'ITEM',
        old_data: {
          status: oldData.status,
          progres: oldData.progres,
          no_ncr: oldData.no_ncr,
          disposisi: oldData.disposisi,
          pic: oldData.pic,
          tindakan: oldData.tindakan,
          target: oldData.target,
        },
        new_data: nextData,
        changed_fields: changedFields,
        notes: 'Data inspeksi material diperbarui',
      })

    if (historyResult.error) {
      // Data sudah berubah, tetapi riwayat gagal disimpan.
      // Catat kegagalan agar dapat diperiksa administrator.
      console.error(
        '[updateInspectionItemAction] history:',
        historyResult.error.message,
      )

      return {
        ok: false,
        error:
          'Data inspeksi sudah diperbarui, tetapi riwayat perubahan gagal disimpan. Hubungi administrator sebelum mengulangi proses.',
      }
    }

    // 13. Perbarui cache halaman terkait
    revalidatePath('/inspection')
    revalidatePath(`/inspection/${numericId}`)
    revalidatePath(`/returns/${oldData.return_header_id}`)
    revalidatePath('/returns')
    revalidatePath('/dashboard')
    revalidatePath('/history')
    revalidatePath('/', 'layout')

    return {
      ok: true,
    }
  } catch (error) {
    console.error(
      '[updateInspectionItemAction]',
      error,
    )

    return {
      ok: false,
      error: 'Terjadi kesalahan saat menyimpan inspeksi.',
    }
  }
}