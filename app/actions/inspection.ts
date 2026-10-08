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

  const user = await getCurrentUser()

  if (!user) {
    return {
      ok: false,
      error: 'Sesi berakhir. Silakan login kembali.',
    }
  }

  if (!canEditReturn(user.role)) {
    return {
      ok: false,
      error: 'Anda tidak memiliki akses untuk mengubah data inspeksi.',
    }
  }

  const numericId = Number(itemId)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return {
      ok: false,
      error: 'ID item inspeksi tidak valid.',
    }
  }

  const status = clean(formData.get('status')) ?? 'Open'

  const progresRaw = clean(formData.get('progres'))
  const progres = progresRaw === null ? 0 : Number(progresRaw)

  if (!Number.isFinite(progres)) {
    return {
      ok: false,
      error: 'Progres harus berupa angka.',
    }
  }

  if (progres < 0 || progres > 100) {
    return {
      ok: false,
      error: 'Progres harus berada di antara 0 sampai 100%.',
    }
  }

  const nextData = {
    status,
    progres,
    no_ncr: clean(formData.get('no_ncr')),
    disposisi: clean(formData.get('disposisi')),
    pic: clean(formData.get('pic')),
    tindakan: clean(formData.get('tindakan')),
    target: clean(formData.get('target')),
  }

  try {
    const supabase = await createClient()

    const oldResult = await supabase
      .from('return_items')
      .select(
        'id, return_header_id, status, progres, no_ncr, disposisi, pic, tindakan, target',
      )
      .eq('id', numericId)
      .maybeSingle()

    const oldData = oldResult.data
    const oldError = oldResult.error

    if (oldError) {
      console.error(
        '[updateInspectionItemAction] old data:',
        oldError.message,
      )

      return {
        ok: false,
        error: friendlyDbError(oldError.message),
      }
    }

    if (!oldData) {
      return {
        ok: false,
        error: 'Data material inspeksi tidak ditemukan.',
      }
    }

    const parentResult = await supabase
      .from('return_headers')
      .select('id, status')
      .eq('id', oldData.return_header_id)
      .maybeSingle()

    const parent = parentResult.data
    const parentError = parentResult.error

    if (parentError) {
      console.error(
        '[updateInspectionItemAction] parent:',
        parentError.message,
      )

      return {
        ok: false,
        error: friendlyDbError(parentError.message),
      }
    }

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

    const changedFields = getChangedFields(
      oldData,
      nextData,
    )

    if (Object.keys(changedFields).length === 0) {
      return {
        ok: true,
      }
    }

    const updateResult = await supabase
      .from('return_items')
      .update(nextData)
      .eq('id', numericId)

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
      console.error(
        '[updateInspectionItemAction] history:',
        historyResult.error.message,
      )
    }

    revalidatePath('/inspection')
    revalidatePath('/inspection/' + numericId)
    revalidatePath('/returns/' + oldData.return_header_id)
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