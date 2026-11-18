
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
  'Prime',
  'Cutting ulang',
  'Champer ulang',
  'Dialihkan ke customer lain',
] as const

const CLAIM_FIELDS = [
  'no_claim',
  'no_claim_2',
  'no_claim_3',
  'no_claim_4',
] as const

const NCR_FIELDS = ['no_ncr', 'no_ncr_2'] as const

type ClaimField = (typeof CLAIM_FIELDS)[number]
type NcrField = (typeof NCR_FIELDS)[number]

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
  no_ncr_2: string | null
}

type ReturnItemAdminRecord = {
  id: number
  disposisi: string | null
}

type ParsedText = {
  value: string | null
  error?: string
}

function cleanText(value: FormDataEntryValue | null): string | null {
  if (value === null || typeof value !== 'string') return null
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

/**
 * Membaca nomor Claim.
 * Mengizinkan huruf, angka, spasi, garis miring,
 * titik, tanda hubung, dan underscore.
 */
function readClaimValue(
  formData: FormData,
  field: ClaimField,
  oldValue: string | null,
): ParsedText {
  const raw = formData.get(field)

  // Field yang tidak dikirim tidak boleh menghapus data lama.
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

  const previous = oldValue ?? ''

  // Pertahankan nilai lama yang mungkin menggunakan format historis.
  if (trimmed === previous.trim()) {
    return { value: previous }
  }

  const claimPattern = /^[\p{L}\p{N}][\p{L}\p{N}\s/._-]*$/u

  if (!claimPattern.test(trimmed)) {
    return {
      value: null,
      error:
        'No Claim hanya boleh berisi huruf, angka, spasi, dan pemisah nomor yang valid.',
    }
  }

  return { value: trimmed }
}

/**
 * Membaca nomor NCR.
 * Nomor NCR menerima format teks seperti nomor NCR
 * yang sudah digunakan pada aplikasi.
 */
function readNcrValue(
  formData: FormData,
  field: NcrField,
  oldValue: string | null,
): ParsedText {
  const raw = formData.get(field)

  if (raw === null) return { value: oldValue }

  if (typeof raw !== 'string') {
    return {
      value: null,
      error: `${field.replaceAll('_', ' ').toUpperCase()} tidak valid.`,
    }
  }

  const trimmed = raw.trim()

  if (!trimmed) return { value: null }

  if (trimmed.length > 100) {
    return {
      value: null,
      error: 'Setiap nomor NCR maksimal 100 karakter.',
    }
  }

  return { value: trimmed }
}

/**
 * Membaca Disposisi berdasarkan ID item.
 * Format nama field dari form: disposisi_ID_ITEM
 */
function readDisposisiValue(
  formData: FormData,
  itemId: number,
  oldValue: string | null,
): ParsedText {
  const field = `disposisi_${itemId}`
  const raw = formData.get(field)

  // Pertahankan disposisi lama jika field tidak dikirim.
  if (raw === null) return { value: oldValue }

  if (typeof raw !== 'string') {
    return {
      value: null,
      error: `Format Disposisi item ${itemId} tidak valid.`,
    }
  }

  const value = raw.trim() || null

  if (
    value !== null &&
    !DISPOSISI_OPTIONS.some((option) => option === value)
  ) {
    return {
      value: null,
      error: `Disposisi item ${itemId} tidak sesuai dengan pilihan yang tersedia.`,
    }
  }

  return { value }
}

function getChangedFields(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  fields: readonly string[],
) {
  const changedFields: Record<
    string,
    { old: unknown; new: unknown }
  > = {}

  for (const field of fields) {
    const oldValue = oldData[field] ?? null
    const newValue = newData[field] ?? null

    if (oldValue !== newValue) {
      changedFields[field] = {
        old: oldValue,
        new: newValue,
      }
    }
  }

  return changedFields
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
      return {
        ok: false,
        error: 'Sesi berakhir. Silakan login kembali.',
      }
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
        error:
          'Anda tidak memiliki akses untuk mengubah administrasi Return.',
      }
    }

    const supabase = await createClient()

    /* ---------------------------------------------------------------------- */
    /* AMBIL HEADER RETURN                                                     */
    /* ---------------------------------------------------------------------- */

    const { data: rawOldData, error: oldError } = await supabase
      .from('return_headers')
      .select(
        `
          id,
          no_return,
          status,
          no_claim,
          no_claim_2,
          no_claim_3,
          no_claim_4,
          no_ncr,
          no_ncr_2
        `,
      )
      .eq('id', numericId)
      .maybeSingle()

    if (oldError) {
      console.error(
        '[updateInspectionAdminAction] old header:',
        oldError.message,
      )

      return {
        ok: false,
        error: friendlyDbError(oldError.message),
      }
    }

    const oldData = rawOldData as unknown as ReturnAdminRecord | null

    if (!oldData) {
      return {
        ok: false,
        error: 'Data Return tidak ditemukan.',
      }
    }

    if (oldData.status === 'dibatalkan') {
      return {
        ok: false,
        error: 'Return yang sudah dibatalkan tidak dapat diedit.',
      }
    }

    /* ---------------------------------------------------------------------- */
    /* VALIDASI NOMOR CLAIM                                                    */
    /* ---------------------------------------------------------------------- */

    const oldClaims: Record<ClaimField, string | null> = {
      no_claim: oldData.no_claim,
      no_claim_2: oldData.no_claim_2,
      no_claim_3: oldData.no_claim_3,
      no_claim_4: oldData.no_claim_4,
    }

    const nextClaims = {} as Record<ClaimField, string | null>

    for (const field of CLAIM_FIELDS) {
      const parsed = readClaimValue(
        formData,
        field,
        oldClaims[field],
      )

      if (parsed.error) {
        return { ok: false, error: parsed.error }
      }

      nextClaims[field] = parsed.value
    }

    // Claim wajib diisi secara berurutan.
    for (let index = 1; index < CLAIM_FIELDS.length; index += 1) {
      const currentField = CLAIM_FIELDS[index]
      const previousField = CLAIM_FIELDS[index - 1]

      if (nextClaims[currentField] && !nextClaims[previousField]) {
        return {
          ok: false,
          error:
            `Isi ${previousField.replaceAll('_', ' ')} sebelum ` +
            `${currentField.replaceAll('_', ' ')}.`,
        }
      }
    }

    /* ---------------------------------------------------------------------- */
    /* VALIDASI NOMOR NCR                                                      */
    /* ---------------------------------------------------------------------- */

    const oldNcrs: Record<NcrField, string | null> = {
      no_ncr: oldData.no_ncr,
      no_ncr_2: oldData.no_ncr_2,
    }

    const nextNcrs = {} as Record<NcrField, string | null>

    for (const field of NCR_FIELDS) {
      const parsed = readNcrValue(
        formData,
        field,
        oldNcrs[field],
      )

      if (parsed.error) {
        return { ok: false, error: parsed.error }
      }

      nextNcrs[field] = parsed.value
    }

    // NCR kedua hanya boleh diisi jika NCR pertama sudah tersedia.
    if (nextNcrs.no_ncr_2 && !nextNcrs.no_ncr) {
      return {
        ok: false,
        error: 'Isi No NCR 1 sebelum No NCR 2.',
      }
    }

    /* ---------------------------------------------------------------------- */
    /* AMBIL ITEM RETURN DAN VALIDASI DISPOSISI                                */
    /* ---------------------------------------------------------------------- */

    const {
      data: rawItemData,
      error: itemReadError,
    } = await supabase
      .from('return_items')
      .select('id, disposisi')
      .eq('return_header_id', numericId)
      .order('id', { ascending: true })

    if (itemReadError) {
      console.error(
        '[updateInspectionAdminAction] old items:',
        itemReadError.message,
      )

      return {
        ok: false,
        error: friendlyDbError(itemReadError.message),
      }
    }

    const oldItems = (rawItemData ?? []) as unknown as ReturnItemAdminRecord[]

    const nextItemDisposisi = new Map<number, string | null>()

    for (const material of oldItems) {
      const parsed = readDisposisiValue(
        formData,
        material.id,
        material.disposisi,
      )

      if (parsed.error) {
        return {
          ok: false,
          error: parsed.error,
        }
      }

      nextItemDisposisi.set(material.id, parsed.value)
    }

    /* ---------------------------------------------------------------------- */
    /* SIMPAN HEADER                                                           */
    /* ---------------------------------------------------------------------- */

    const nextHeaderData: Record<string, string | null> = {
      ...nextClaims,
      ...nextNcrs,
    }

    const oldHeaderRecord: Record<string, unknown> = {
      ...oldClaims,
      ...oldNcrs,
    }

    const headerFields = [
      ...CLAIM_FIELDS,
      ...NCR_FIELDS,
    ] as const

    const changedHeaderFields = getChangedFields(
      oldHeaderRecord,
      nextHeaderData,
      headerFields,
    )

    const changedHeaderKeys = Object.keys(changedHeaderFields)

    if (changedHeaderKeys.length > 0) {
      const { data: rawUpdated, error: updateError } = await supabase
        .from('return_headers')
        .update(({
          ...nextHeaderData,
          updated_at: new Date().toISOString(),
        }) as never)
        .eq('id', numericId)
        .neq('status', 'dibatalkan')
        .select('id')
        .maybeSingle()

      if (updateError) {
        console.error(
          '[updateInspectionAdminAction] update header:',
          updateError.message,
        )

        return {
          ok: false,
          error: friendlyDbError(updateError.message),
        }
      }

      const updated = rawUpdated as unknown as { id: number } | null

      if (!updated) {
        return {
          ok: false,
          error:
            'Data header tidak diperbarui. Return mungkin sudah dibatalkan atau akses Anda berubah.',
        }
      }
    }

    /* ---------------------------------------------------------------------- */
    /* SIMPAN PERUBAHAN DISPOSISI PER ITEM                                     */
    /* ---------------------------------------------------------------------- */

    const changedItemRows = oldItems.filter(
      (material) =>
        (material.disposisi ?? null) !==
        (nextItemDisposisi.get(material.id) ?? null),
    )

    for (const material of changedItemRows) {
      const nextDisposisi = nextItemDisposisi.get(material.id) ?? null

      const { data: rawUpdatedItem, error: itemUpdateError } = await supabase
        .from('return_items')
        .update(({
          disposisi: nextDisposisi,
        }) as never)
        .eq('id', material.id)
        .eq('return_header_id', numericId)
        .select('id')
        .maybeSingle()

      if (itemUpdateError) {
        console.error(
          '[updateInspectionAdminAction] update item:',
          itemUpdateError.message,
        )

        return {
          ok: false,
          error: friendlyDbError(itemUpdateError.message),
        }
      }

      const updatedItem = rawUpdatedItem as unknown as {
        id: number
      } | null

      if (!updatedItem) {
        return {
          ok: false,
          error:
            `Disposisi item ${material.id} tidak berhasil diperbarui. Periksa kembali data Return.`,
        }
      }
    }

    /* ---------------------------------------------------------------------- */
    /* CATAT RIWAYAT HEADER                                                    */
    /* ---------------------------------------------------------------------- */

    const warnings: string[] = []

    if (changedHeaderKeys.length > 0) {
      const oldHistory: Record<string, unknown> = {}
      const newHistory: Record<string, unknown> = {}

      for (const field of changedHeaderKeys) {
        oldHistory[field] = oldHeaderRecord[field] ?? null
        newHistory[field] = nextHeaderData[field] ?? null
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
          changed_fields: changedHeaderFields,
          notes:
            'Administrasi Return diperbarui melalui Monitoring Progres Return',
        })

      if (historyError) {
        console.error(
          '[updateInspectionAdminAction] header history:',
          historyError.message,
        )

        warnings.push(
          'Riwayat perubahan nomor Claim/NCR gagal dicatat.',
        )
      }
    }

    /* ---------------------------------------------------------------------- */
    /* CATAT RIWAYAT DISPOSISI ITEM                                            */
    /* ---------------------------------------------------------------------- */

    for (const material of changedItemRows) {
      const oldDisposisi = material.disposisi ?? null
      const newDisposisi = nextItemDisposisi.get(material.id) ?? null

      const changedFields = {
        disposisi: {
          old: oldDisposisi,
          new: newDisposisi,
        },
      }

      const { error: historyError } = await supabase
        .from('return_history')
        .insert({
          return_header_id: numericId,
          user_id: user.id,
          action: 'UPDATE_ITEM',
          module: 'ITEM',
          old_data: {
            item_id: material.id,
            disposisi: oldDisposisi,
          },
          new_data: {
            item_id: material.id,
            disposisi: newDisposisi,
          },
          changed_fields: changedFields,
          notes:
            `Disposisi item ${material.id} diperbarui melalui Monitoring Progres Return`,
        })

      if (historyError) {
        console.error(
          '[updateInspectionAdminAction] item history:',
          historyError.message,
        )

        warnings.push(
          `Riwayat perubahan Disposisi item ${material.id} gagal dicatat.`,
        )
      }
    }

    /* ---------------------------------------------------------------------- */
    /* REFRESH HALAMAN                                                         */
    /* ---------------------------------------------------------------------- */

    revalidatePath('/inspection')
    revalidatePath(`/returns/${numericId}`)
    revalidatePath('/history')

    if (warnings.length > 0) {
      return {
        ok: true,
        warning: warnings.join(' '),
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