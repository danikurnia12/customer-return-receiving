'use server'

import { revalidatePath } from 'next/cache'

import { getCurrentUser } from '@/lib/auth'
import { canEditReturn } from '@/lib/permissions'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

const DISPOSISI_OPTIONS = [
  'Reject',
  'Downgrade',
  'Sortir/Repair',
  'Hold',
] as const

const CLAIM_FIELDS = [
  'no_claim',
  'no_claim_2',
  'no_claim_3',
  'no_claim_4',
] as const

type ClaimField = (typeof CLAIM_FIELDS)[number]
type InspectionAdminResult =
  | { ok: true; warning?: string }
  | { ok: false; error: string }

type ReturnAdminRecord = {
  id: number
  no_return: string
  status: string | null
  no_claim: string | null
  no_claim_2: string | null
  no_claim_3: string | null
  no_claim_4: string | null
  no_ncr: string | null
  disposisi: string | null
}

function cleanText(value: FormDataEntryValue | null): string | null {
  if (value === null) return null
  if (typeof value !== 'string') return null
  return value.trim() || null
}

function friendlyDbError(message?: string) {
  const normalized = message?.toLowerCase() ?? ''

  if (
    normalized.includes('row-level security') ||
    normalized.includes('42501') ||
    normalized.includes('permission denied')
  ) {
    return 'Anda tidak memiliki akses untuk mengubah administrasi Return.'
  }

  if (normalized.includes('check constraint')) {
    return 'Nilai Disposisi tidak sesuai dengan pilihan yang tersedia.'
  }

  if (normalized.includes('invalid input syntax')) {
    return 'Format data tidak valid.'
  }

  return 'Data administrasi Return gagal disimpan. Silakan coba kembali.'
}

function readClaimValue(
  formData: FormData,
  field: ClaimField,
  oldValue: string | null,
): { value: string | null; error?: string } {
  const raw = formData.get(field)

  // Jika field tidak dikirim, jangan menghapus data lama secara tidak sengaja.
  if (raw === null) return { value: oldValue }

  if (typeof raw !== 'string') {
    return {
      value: null,
      error: `Format ${field.replaceAll('_', ' ')} tidak valid.`,
    }
  }

  const trimmed = raw.trim()
  if (!trimmed) return { value: null }

  if (trimmed.length > 50) {
    return {
      value: null,
      error: 'Setiap nomor Claim maksimal 50 karakter.',
    }
  }

  // Nilai historis nonangka tetap boleh tersimpan selama tidak diubah.
  const previous = oldValue ?? ''
  if (trimmed === previous.trim() && !/^\d+$/.test(trimmed)) {
    return { value: previous }
  }

  if (!/^\d+$/.test(trimmed)) {
    return {
      value: null,
      error: 'No Claim baru hanya boleh berisi angka tanpa suffix atau pemisah.',
    }
  }

  return { value: trimmed }
}

export async function updateInspectionAdminAction(
  returnId: string,
  formData: FormData,
): Promise<InspectionAdminResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase belum terhubung.' }
  }

  if (!/^\d+$/.test(returnId)) {
    return { ok: false, error: 'ID Return tidak valid.' }
  }

  const numericId = Number(returnId)
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    return { ok: false, error: 'ID Return tidak valid.' }
  }

  try {
    const user = await getCurrentUser()

    if (!user) {
      return { ok: false, error: 'Sesi berakhir. Silakan login kembali.' }
    }

    if (user.status !== 'active') {
      return {
        ok: false,
        error: 'Akun Anda belum aktif. Hubungi administrator.',
      }
    }

    if (!canEditReturn(user.role)) {
      return {
        ok: false,
        error: 'Anda tidak memiliki akses untuk mengubah administrasi Return.',
      }
    }

    const supabase = await createClient()

    const { data: rawOldData, error: oldError } = await supabase
      .from('return_headers')
      .select(
        'id, no_return, status, no_claim, no_claim_2, no_claim_3, no_claim_4, no_ncr, disposisi',
      )
      .eq('id', numericId)
      .maybeSingle()

    if (oldError) {
      console.error('[updateInspectionAdminAction] old data:', oldError.message)
      return { ok: false, error: friendlyDbError(oldError.message) }
    }

    const oldData = rawOldData as unknown as ReturnAdminRecord | null

    if (!oldData) {
      return { ok: false, error: 'Data Return tidak ditemukan.' }
    }

    if (oldData.status === 'dibatalkan') {
      return {
        ok: false,
        error: 'Return yang sudah dibatalkan tidak dapat diedit.',
      }
    }

    const oldClaims: Record<ClaimField, string | null> = {
      no_claim: oldData.no_claim,
      no_claim_2: oldData.no_claim_2,
      no_claim_3: oldData.no_claim_3,
      no_claim_4: oldData.no_claim_4,
    }

    const nextClaims = {} as Record<ClaimField, string | null>

    for (const field of CLAIM_FIELDS) {
      const parsed = readClaimValue(formData, field, oldClaims[field])
      if (parsed.error) return { ok: false, error: parsed.error }
      nextClaims[field] = parsed.value
    }

    // Claim harus berurutan: Claim 2 tidak boleh terisi sebelum Claim 1, dst.
    for (let index = 1; index < CLAIM_FIELDS.length; index += 1) {
      const currentField = CLAIM_FIELDS[index]
      const previousField = CLAIM_FIELDS[index - 1]

      if (nextClaims[currentField] && !nextClaims[previousField]) {
        return {
          ok: false,
          error: `Isi ${previousField.replaceAll('_', ' ')} sebelum ${currentField.replaceAll('_', ' ')}.`,
        }
      }
    }

    const rawNoNcr = formData.get('no_ncr')
    if (rawNoNcr !== null && typeof rawNoNcr !== 'string') {
      return { ok: false, error: 'Format No NCR tidak valid.' }
    }
    const noNcr = rawNoNcr === null ? oldData.no_ncr : cleanText(rawNoNcr)

    if ((noNcr ?? '').length > 100) {
      return { ok: false, error: 'No NCR maksimal 100 karakter.' }
    }

    const rawDisposisi = formData.get('disposisi')
    if (rawDisposisi !== null && typeof rawDisposisi !== 'string') {
      return { ok: false, error: 'Format Disposisi tidak valid.' }
    }
    const disposisi =
      rawDisposisi === null ? oldData.disposisi : cleanText(rawDisposisi)

    if (
      disposisi &&
      !DISPOSISI_OPTIONS.some((option) => option === disposisi)
    ) {
      return {
        ok: false,
        error: 'Disposisi tidak valid. Pilih salah satu opsi yang tersedia.',
      }
    }

    const nextData: Record<string, string | null> = {
      ...nextClaims,
      no_ncr: noNcr,
      disposisi,
    }

    const fields = [...CLAIM_FIELDS, 'no_ncr', 'disposisi'] as const
    const oldRecord: Record<string, unknown> = {
      no_claim: oldData.no_claim,
      no_claim_2: oldData.no_claim_2,
      no_claim_3: oldData.no_claim_3,
      no_claim_4: oldData.no_claim_4,
      no_ncr: oldData.no_ncr,
      disposisi: oldData.disposisi,
    }

    const changedFields: Record<string, { old: unknown; new: unknown }> = {}

    for (const field of fields) {
      const oldValue = oldRecord[field] ?? null
      const newValue = nextData[field] ?? null

      if (oldValue !== newValue) {
        changedFields[field] = { old: oldValue, new: newValue }
      }
    }

    const changedKeys = Object.keys(changedFields)
    if (changedKeys.length === 0) return { ok: true }

    const { data: rawUpdated, error: updateError } = await supabase
      .from('return_headers')
      .update(({
        ...nextData,
        updated_at: new Date().toISOString(),
      }) as never)
      .eq('id', numericId)
      .neq('status', 'dibatalkan')
      .select('id')
      .maybeSingle()

    if (updateError) {
      console.error('[updateInspectionAdminAction] update:', updateError.message)
      return { ok: false, error: friendlyDbError(updateError.message) }
    }

    const updated = rawUpdated as unknown as { id: number } | null
    if (!updated) {
      return {
        ok: false,
        error:
          'Data tidak diperbarui. Return mungkin sudah dibatalkan atau akses Anda berubah.',
      }
    }

    const oldHistory: Record<string, unknown> = {}
    const newHistory: Record<string, unknown> = {}

    for (const field of changedKeys) {
      oldHistory[field] = oldRecord[field] ?? null
      newHistory[field] = nextData[field] ?? null
    }

    const { error: historyError } = await supabase
      .from('return_history')
      .insert({
        return_header_id: numericId,
        user_id: user.id,
        action: 'UPDATE_HEADER',
        module: 'RETURN',
        old_data: oldHistory,
        new_data: newHistory,
        changed_fields: changedFields,
        notes: 'Administrasi Return diperbarui melalui Monitoring Progres Return',
      })

    revalidatePath('/inspection')
    revalidatePath(`/returns/${numericId}`)
    revalidatePath('/history')

    if (historyError) {
      console.error('[updateInspectionAdminAction] history:', historyError.message)
      return {
        ok: true,
        warning:
          'Data administrasi berhasil disimpan, tetapi riwayat perubahan gagal dicatat. Hubungi administrator.',
      }
    }

    return { ok: true }
  } catch (error) {
    console.error('[updateInspectionAdminAction]', error)
    return {
      ok: false,
      error: 'Terjadi kesalahan saat menyimpan administrasi Return.',
    }
  }
}
