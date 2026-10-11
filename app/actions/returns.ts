'use server'

import { revalidatePath } from 'next/cache'

import { getCurrentUser } from '@/lib/auth'
import {
  canCreateReturn,
  canDeleteReturn,
  canEditReturn,
} from '@/lib/permissions'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

import type { ActionResult } from '@/lib/types'

import {
  createReturnSchema,
  flattenErrors,
  returnHeaderSchema,
  returnItemSchema,
  type CreateReturnInput,
  type ReturnHeaderInput,
  type ReturnItemInput,
} from '@/lib/validation'

/* ============================================================
   CONSTANTS
   ============================================================ */

const NOT_CONFIGURED: ActionResult<never> = {
  ok: false,
  error:
    'Supabase belum terhubung. Hubungkan integrasi Supabase terlebih dahulu.',
}

const GENERIC_DB_ERROR =
  'Operasi tidak dapat diproses. Silakan coba kembali.'

const ITEM_FIELD_LABELS: Record<string, string> = {
  diameter: 'Diameter',
  tebal: 'Tebal',
  panjang: 'Panjang',
  batch: 'Batch',
  no_box: 'No Box',
  qty_surat_jalan: 'Qty Surat Jalan',
  qty_aktual: 'Qty Aktual',
  kondisi_material: 'Kondisi Material',
  location: 'Lokasi',
  no_ncr: 'No NCR',
  disposisi: 'Disposisi',
  pic: 'PIC',
  status: 'Status',
  tindakan: 'Tindakan',
  target: 'Target',
  progres: 'Progres',
}

const HEADER_FIELD_LABELS: Record<string, string> = {
  tanggal_penerimaan: 'Tanggal Penerimaan',
  no_sppb: 'No SPPB / Surat Jalan',
  no_claim: 'No Claim',
  customer: 'Customer',
  pic_penerima: 'PIC Penerima',
  catatan: 'Catatan',
}

const MAX_HISTORY_NOTE_LENGTH = 500

/* ============================================================
   HELPERS
   ============================================================ */

function normalize(value: unknown) {
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

function diff(
  oldRow: Record<string, unknown>,
  newRow: Record<string, unknown>,
  fields: string[],
) {
  return fields.filter(
    (field) =>
      normalize(oldRow[field]) !==
      normalize(newRow[field]),
  )
}

/**
 * Jangan mengirim pesan error database mentah
 * ke browser.
 */
function friendlyDbError(message?: string) {
  const normalized = message?.toLowerCase() ?? ''

  if (
    normalized.includes('duplicate key') &&
    normalized.includes('no_return')
  ) {
    return 'No Return sudah digunakan. Silakan coba simpan kembali.'
  }

  if (normalized.includes('duplicate key')) {
    return 'Data yang sama sudah ada.'
  }

  if (
    normalized.includes('row-level security') ||
    normalized.includes('42501') ||
    normalized.includes('permission denied')
  ) {
    return 'Anda tidak memiliki akses untuk melakukan aksi ini.'
  }

  if (
    normalized.includes('foreign key') ||
    normalized.includes('violates foreign key')
  ) {
    return 'Data terkait tidak ditemukan atau sudah berubah.'
  }

  if (
    normalized.includes('not-null') ||
    normalized.includes('null value')
  ) {
    return 'Ada data wajib yang belum lengkap.'
  }

  if (normalized.includes('invalid input syntax')) {
    return 'Format data tidak valid.'
  }

  return GENERIC_DB_ERROR
}

/**
 * Otorisasi dilakukan di server.
 * Role tidak boleh dipercaya dari client.
 */
async function authorize(
  check: (
    role: Parameters<typeof canEditReturn>[0],
  ) => boolean,
): Promise<
  | {
      user: NonNullable<
        Awaited<ReturnType<typeof getCurrentUser>>
      >
    }
  | {
      error: string
    }
> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      error: 'Sesi berakhir. Silakan login kembali.',
    }
  }

  if (!check(user.role)) {
    return {
      error: 'Anda tidak memiliki akses untuk aksi ini.',
    }
  }

  return {
    user,
  }
}

function safeNotes(
  notes?: string,
  fallback = '',
) {
  const value = notes?.trim() || fallback

  return value.slice(
    0,
    MAX_HISTORY_NOTE_LENGTH,
  )
}

function revalidateReturns() {
  revalidatePath('/returns')
  revalidatePath('/returns/new')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')
}

function validId(value: string) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  )
}

/**
 * Konversi input item dari form ke struktur
 * database yang sebenarnya.
 *
 * Input aplikasi:
 *   qty_aktual_diterima
 *   sloc
 *
 * Database:
 *   qty_aktual
 *   location
 */
function toItemRow(
  value: ReturnType<
    typeof returnItemSchema.parse
  >,
) {
  return {
    diameter: value.diameter,
    tebal: value.tebal,
    panjang: value.panjang,
    batch: value.batch || null,
    no_box: value.no_box || null,
    qty_surat_jalan:
      value.qty_surat_jalan,
    qty_aktual:
      value.qty_aktual_diterima,
    kondisi_material:
      value.kondisi_material,
    location:
      value.sloc || null,
  }
}

/* ============================================================
   CREATE RETURN
   ============================================================ */

export async function createReturnAction(
  input: CreateReturnInput,
): Promise<
  ActionResult<{
    id: string
    no_return: string
  }>
> {
  if (!isSupabaseConfigured) {
    return NOT_CONFIGURED
  }

  const auth = await authorize(
    canCreateReturn,
  )

  if ('error' in auth) {
    return {
      ok: false,
      error: auth.error,
    }
  }

  const parsed =
    createReturnSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error:
        'Periksa kembali data yang diisi.',
      fieldErrors:
        flattenErrors(parsed.error),
    }
  }

  const {
    items,
    ...header
  } = parsed.data

  if (!items.length) {
    return {
      ok: false,
      error:
        'Minimal satu item return harus tersedia.',
      fieldErrors: {
        items:
          'Minimal satu item return harus tersedia.',
      },
    }
  }

  try {
    const supabase =
      await createClient()

    /*
     * RPC melakukan:
     * 1. Generate No Return otomatis
     * 2. INSERT header
     * 3. INSERT semua item
     * 4. INSERT history CREATE
     *
     * Semua berada dalam satu transaksi database.
     */
    const {
      data,
      error,
    } = await supabase.rpc(
      'create_return',
      {
        p_header: header,
        p_items: items.map(toItemRow),
      },
    )

    if (error) {
      console.error(
        '[createReturnAction]',
        error.message,
      )

      return {
        ok: false,
        error: friendlyDbError(
          error.message,
        ),
      }
    }

    if (
      data === null ||
      data === undefined
    ) {
      console.error(
        '[createReturnAction] RPC tidak mengembalikan ID.',
      )

      return {
        ok: false,
        error:
          'Return gagal dibuat karena ID Return tidak diterima.',
      }
    }

    /*
     * RPC mengembalikan ID Return.
     * Ambil No Return yang baru dibuat dari database.
     */
    const {
      data: createdReturn,
      error: createdReturnError,
    } = await supabase
      .from('return_headers')
      .select('id, no_return')
      .eq('id', data)
      .maybeSingle()

    if (createdReturnError) {
      console.error(
        '[createReturnAction] Gagal mengambil No Return:',
        createdReturnError.message,
      )

      return {
        ok: false,
        error: GENERIC_DB_ERROR,
      }
    }

    if (
      !createdReturn ||
      !createdReturn.no_return
    ) {
      console.error(
        '[createReturnAction] No Return tidak ditemukan setelah insert.',
      )

      return {
        ok: false,
        error:
          'Return berhasil dibuat tetapi No Return tidak ditemukan.',
      }
    }

    revalidateReturns()

    return {
      ok: true,
      data: {
        id: String(createdReturn.id),
        no_return:
          createdReturn.no_return,
      },
    }
  } catch (error) {
    console.error(
      '[createReturnAction]',
      error,
    )

    return {
      ok: false,
      error: GENERIC_DB_ERROR,
    }
  }
}

/* ============================================================
   UPDATE RETURN HEADER
   ============================================================ */

export async function updateReturnHeaderAction(
  returnId: string,
  input: ReturnHeaderInput,
  notes?: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return NOT_CONFIGURED
  }

  if (!validId(returnId)) {
    return {
      ok: false,
      error: 'ID return tidak valid.',
    }
  }

  const auth = await authorize(
    canEditReturn,
  )

  if ('error' in auth) {
    return {
      ok: false,
      error: auth.error,
    }
  }

  const parsed =
    returnHeaderSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error:
        'Periksa kembali data yang diisi.',
      fieldErrors:
        flattenErrors(parsed.error),
    }
  }

  try {
    const supabase =
      await createClient()

    const {
      data: old,
      error: oldError,
    } = await supabase
      .from('return_headers')
      .select('*')
      .eq('id', returnId)
      .maybeSingle()

    if (oldError) {
      console.error(
        '[updateReturnHeaderAction]',
        oldError.message,
      )

      return {
        ok: false,
        error: GENERIC_DB_ERROR,
      }
    }

    if (!old) {
      return {
        ok: false,
        error: 'Data return tidak ditemukan.',
      }
    }

    if (old.status === 'dibatalkan') {
      return {
        ok: false,
        error:
          'Return yang sudah dibatalkan tidak dapat diedit.',
      }
    }

    const next = {
      ...parsed.data,
      no_claim:
        parsed.data.no_claim || null,
      pic_penerima:
        parsed.data.pic_penerima || null,
      catatan:
        parsed.data.catatan || null,
    }

    const changed = diff(
      old,
      next,
      Object.keys(HEADER_FIELD_LABELS),
    )

    if (!changed.length) {
      return {
        ok: true,
        data: undefined,
      }
    }

    const {
      error: updateError,
    } = await supabase
      .from('return_headers')
      .update(next)
      .eq('id', returnId)

    if (updateError) {
      console.error(
        '[updateReturnHeaderAction]',
        updateError.message,
      )

      return {
        ok: false,
        error: friendlyDbError(
          updateError.message,
        ),
      }
    }

    const historyError =
      await insertHistory(supabase, {
        return_header_id: Number(returnId),
        user_id: auth.user.id,
        action: 'UPDATE_HEADER',
        module: 'RETURN',
        old_data: pickFields(
          old,
          changed,
        ),
        new_data: pickFields(
          next,
          changed,
        ),
        changed_fields: buildChangedFields(
          old,
          next,
          changed,
        ),
        notes: safeNotes(
          notes,
          'Header return diubah',
        ),
      })

    if (historyError) {
      console.error(
        '[updateReturnHeaderAction] History insert failed:',
        historyError,
      )
    }

    revalidateReturns()

    return {
      ok: true,
      data: undefined,
    }
  } catch (error) {
    console.error(
      '[updateReturnHeaderAction]',
      error,
    )

    return {
      ok: false,
      error: GENERIC_DB_ERROR,
    }
  }
}

/* ============================================================
   ADD RETURN ITEM
   ============================================================ */

export async function addReturnItemAction(
  returnId: string,
  input: ReturnItemInput,
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return NOT_CONFIGURED
  }

  if (!validId(returnId)) {
    return {
      ok: false,
      error: 'ID return tidak valid.',
    }
  }

  const auth = await authorize(
    canEditReturn,
  )

  if ('error' in auth) {
    return {
      ok: false,
      error: auth.error,
    }
  }

  const parsed =
    returnItemSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Periksa kembali data item.',
      fieldErrors:
        flattenErrors(parsed.error),
    }
  }

  try {
    const supabase =
      await createClient()

    const {
      data: parent,
      error: parentError,
    } = await supabase
      .from('return_headers')
      .select('id,status')
      .eq('id', returnId)
      .maybeSingle()

    if (parentError) {
      console.error(
        '[addReturnItemAction]',
        parentError.message,
      )

      return {
        ok: false,
        error: GENERIC_DB_ERROR,
      }
    }

    if (!parent) {
      return {
        ok: false,
        error: 'Data return tidak ditemukan.',
      }
    }

    if (parent.status === 'dibatalkan') {
      return {
        ok: false,
        error:
          'Return yang sudah dibatalkan tidak dapat ditambahkan item.',
      }
    }

    const row = toItemRow(parsed.data)

    const {
      data: inserted,
      error: insertError,
    } = await supabase
      .from('return_items')
      .insert({
        ...row,
        return_header_id: Number(returnId),
      })
      .select('*')
      .single()

    if (insertError) {
      console.error(
        '[addReturnItemAction]',
        insertError.message,
      )

      return {
        ok: false,
        error: friendlyDbError(
          insertError.message,
        ),
      }
    }

    const historyError =
      await insertHistory(supabase, {
        return_header_id: Number(returnId),
        user_id: auth.user.id,
        action: 'ADD_ITEM',
        module: 'ITEM',
        old_data: null,
        new_data: inserted,
        changed_fields: null,
        notes: 'Item baru ditambahkan',
      })

    if (historyError) {
      console.error(
        '[addReturnItemAction] History insert failed:',
        historyError,
      )
    }

    revalidateReturns()

    return {
      ok: true,
      data: undefined,
    }
  } catch (error) {
    console.error(
      '[addReturnItemAction]',
      error,
    )

    return {
      ok: false,
      error: GENERIC_DB_ERROR,
    }
  }
}

/* ============================================================
   UPDATE RETURN ITEM
   ============================================================ */

export async function updateReturnItemAction(
  itemId: string,
  input: ReturnItemInput,
  notes?: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return NOT_CONFIGURED
  }

  if (!validId(itemId)) {
    return {
      ok: false,
      error: 'ID item tidak valid.',
    }
  }

  const auth = await authorize(
    canEditReturn,
  )

  if ('error' in auth) {
    return {
      ok: false,
      error: auth.error,
    }
  }

  const parsed =
    returnItemSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Periksa kembali data item.',
      fieldErrors:
        flattenErrors(parsed.error),
    }
  }

  try {
    const supabase =
      await createClient()

    const {
      data: old,
      error: oldError,
    } = await supabase
      .from('return_items')
      .select('*')
      .eq('id', itemId)
      .maybeSingle()

    if (oldError) {
      console.error(
        '[updateReturnItemAction]',
        oldError.message,
      )

      return {
        ok: false,
        error: GENERIC_DB_ERROR,
      }
    }

    if (!old) {
      return {
        ok: false,
        error: 'Item tidak ditemukan.',
      }
    }

    const {
      data: parent,
      error: parentError,
    } = await supabase
      .from('return_headers')
      .select('id,status')
      .eq('id', old.return_header_id)
      .maybeSingle()

    if (parentError) {
      console.error(
        '[updateReturnItemAction]',
        parentError.message,
      )

      return {
        ok: false,
        error: GENERIC_DB_ERROR,
      }
    }

    if (!parent) {
      return {
        ok: false,
        error:
          'Data return induk tidak ditemukan.',
      }
    }

    if (parent.status === 'dibatalkan') {
      return {
        ok: false,
        error:
          'Item dari return yang sudah dibatalkan tidak dapat diedit.',
      }
    }

    const next = toItemRow(parsed.data)

    const changed = diff(
      old,
      next,
      Object.keys(ITEM_FIELD_LABELS),
    )

    if (!changed.length) {
      return {
        ok: true,
        data: undefined,
      }
    }

    const {
      error: updateError,
    } = await supabase
      .from('return_items')
      .update(next)
      .eq('id', itemId)

    if (updateError) {
      console.error(
        '[updateReturnItemAction]',
        updateError.message,
      )

      return {
        ok: false,
        error: friendlyDbError(
          updateError.message,
        ),
      }
    }

    const historyError =
      await insertHistory(supabase, {
        return_header_id: old.return_header_id,
        user_id: auth.user.id,
        action: 'UPDATE_ITEM',
        module: 'ITEM',
        old_data: pickFields(
          old,
          changed,
        ),
        new_data: pickFields(
          next,
          changed,
        ),
        changed_fields: buildChangedFields(
          old,
          next,
          changed,
        ),
        notes: safeNotes(
          notes,
          'Item return diubah',
        ),
      })

    if (historyError) {
      console.error(
        '[updateReturnItemAction] History insert failed:',
        historyError,
      )
    }

    revalidateReturns()

    return {
      ok: true,
      data: undefined,
    }
  } catch (error) {
    console.error(
      '[updateReturnItemAction]',
      error,
    )

    return {
      ok: false,
      error: GENERIC_DB_ERROR,
    }
  }
}

/* ============================================================
   DELETE RETURN ITEM
   ============================================================ */

export async function deleteReturnItemAction(
  itemId: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return NOT_CONFIGURED
  }

  if (!validId(itemId)) {
    return {
      ok: false,
      error: 'ID item tidak valid.',
    }
  }

  const auth = await authorize(
    canEditReturn,
  )

  if ('error' in auth) {
    return {
      ok: false,
      error: auth.error,
    }
  }

  try {
    const supabase =
      await createClient()

    const {
      data: old,
      error: oldError,
    } = await supabase
      .from('return_items')
      .select('*')
      .eq('id', itemId)
      .maybeSingle()

    if (oldError) {
      console.error(
        '[deleteReturnItemAction]',
        oldError.message,
      )

      return {
        ok: false,
        error: GENERIC_DB_ERROR,
      }
    }

    if (!old) {
      return {
        ok: false,
        error: 'Item tidak ditemukan.',
      }
    }

    const {
      data: parent,
      error: parentError,
    } = await supabase
      .from('return_headers')
      .select('id,status')
      .eq('id', old.return_header_id)
      .maybeSingle()

    if (parentError) {
      console.error(
        '[deleteReturnItemAction]',
        parentError.message,
      )

      return {
        ok: false,
        error: GENERIC_DB_ERROR,
      }
    }

    if (!parent) {
      return {
        ok: false,
        error:
          'Data return induk tidak ditemukan.',
      }
    }

    if (parent.status === 'dibatalkan') {
      return {
        ok: false,
        error:
          'Item dari return yang sudah dibatalkan tidak dapat dihapus.',
      }
    }

    const {
      count,
      error: countError,
    } = await supabase
      .from('return_items')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq(
        'return_header_id',
        old.return_header_id,
      )

    if (countError) {
      console.error(
        '[deleteReturnItemAction]',
        countError.message,
      )

      return {
        ok: false,
        error: GENERIC_DB_ERROR,
      }
    }

    if ((count ?? 0) <= 1) {
      return {
        ok: false,
        error:
          'Return minimal memiliki 1 item. Item terakhir tidak dapat dihapus.',
      }
    }

    const {
      error: deleteError,
    } = await supabase
      .from('return_items')
      .delete()
      .eq('id', itemId)

    if (deleteError) {
      console.error(
        '[deleteReturnItemAction]',
        deleteError.message,
      )

      return {
        ok: false,
        error: friendlyDbError(
          deleteError.message,
        ),
      }
    }

    const historyError =
      await insertHistory(supabase, {
        return_header_id:
          old.return_header_id,
        user_id: auth.user.id,
        action: 'DELETE_ITEM',
        module: 'ITEM',
        old_data: old,
        new_data: null,
        changed_fields: null,
        notes: 'Item return dihapus',
      })

    if (historyError) {
      console.error(
        '[deleteReturnItemAction] History insert failed:',
        historyError,
      )
    }

    revalidateReturns()

    return {
      ok: true,
      data: undefined,
    }
  } catch (error) {
    console.error(
      '[deleteReturnItemAction]',
      error,
    )

    return {
      ok: false,
      error: GENERIC_DB_ERROR,
    }
  }
}

/* ============================================================
   CANCEL RETURN
   ============================================================ */

export async function cancelReturnAction(
  returnId: string | number,
  reason: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return NOT_CONFIGURED
  }

  const rawReturnId = String(returnId ?? '').trim()

const normalizedReturnId = /^\d+$/.test(rawReturnId)
  ? Number(rawReturnId)
  : Number.NaN

if (
  !Number.isSafeInteger(normalizedReturnId) ||
  normalizedReturnId <= 0
) {
  return {
    ok: false,
    error: 'ID return tidak valid.',
  }
}

  const cleanReason =
    reason?.trim().slice(
      0,
      MAX_HISTORY_NOTE_LENGTH,
    ) ?? ''

  if (!cleanReason) {
    return {
      ok: false,
      error:
        'Alasan pembatalan wajib diisi.',
    }
  }

  const auth = await authorize(
    canEditReturn,
  )

  if ('error' in auth) {
    return {
      ok: false,
      error: auth.error,
    }
  }

  try {
    const supabase =
      await createClient()

    const {
      data: old,
      error: oldError,
    } = await supabase
      .from('return_headers')
      .select('id,status')
      .eq('id', normalizedReturnId)
      .maybeSingle()

    if (oldError) {
      console.error(
        '[cancelReturnAction]',
        oldError.message,
      )

      return {
        ok: false,
        error: GENERIC_DB_ERROR,
      }
    }

    if (!old) {
      return {
        ok: false,
        error:
          'Data return tidak ditemukan.',
      }
    }

    if (old.status === 'dibatalkan') {
      return {
        ok: false,
        error:
          'Return sudah dibatalkan sebelumnya.',
      }
    }

    if (old.status !== 'diterima') {
      return {
        ok: false,
        error:
          'Status return saat ini tidak dapat dibatalkan.',
      }
    }

    const {
      data: updated,
      error: updateError,
    } = await supabase
      .from('return_headers')
      .update({
        status: 'dibatalkan',
      })
      .eq('id', returnId)
      .eq('status', 'diterima')
      .select('id,status')
      .maybeSingle()

    if (updateError) {
      console.error(
        '[cancelReturnAction]',
        updateError.message,
      )

      return {
        ok: false,
        error: friendlyDbError(
          updateError.message,
        ),
      }
    }

    if (!updated) {
      return {
        ok: false,
        error:
          'Return tidak dapat dibatalkan. Status mungkin sudah berubah.',
      }
    }

    const historyError =
      await insertHistory(supabase, {
        return_header_id: normalizedReturnId,
        user_id: auth.user.id,
        action: 'CANCEL',
        module: 'STATUS',
        old_data: {
          status: 'diterima',
        },
        new_data: {
          status: 'dibatalkan',
        },
        changed_fields: {
          status: {
            old: 'diterima',
            new: 'dibatalkan',
          },
        },
        notes: cleanReason,
      })

    if (historyError) {
      console.error(
        '[cancelReturnAction] History insert failed:',
        historyError,
      )
    }

    revalidateReturns()

    return {
      ok: true,
      data: undefined,
    }
  } catch (error) {
    console.error(
      '[cancelReturnAction]',
      error,
    )

    return {
      ok: false,
      error: GENERIC_DB_ERROR,
    }
  }
}

/* ============================================================
   DELETE CANCELLED RETURN PERMANENTLY
   ============================================================ */

export async function deleteCancelledReturnAction(
  returnId: string | number,
): Promise<
  ActionResult<{
    no_return: string
    photosCleanupFailed: boolean
  }>
> {
  if (!isSupabaseConfigured) {
    return NOT_CONFIGURED
  }

  const rawReturnId = String(returnId ?? '').trim()
  const normalizedReturnId = /^\d+$/.test(rawReturnId)
    ? Number(rawReturnId)
    : Number.NaN

  if (
    !Number.isSafeInteger(normalizedReturnId) ||
    normalizedReturnId <= 0
  ) {
    return {
      ok: false,
      error: 'ID return tidak valid.',
    }
  }

  const auth = await authorize(canDeleteReturn)

  if ('error' in auth) {
    return {
      ok: false,
      error: auth.error,
    }
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL

  const secretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !secretKey) {
    console.error(
      '[deleteCancelledReturnAction] URL atau secret key server Supabase belum dikonfigurasi.',
    )

    return {
      ok: false,
      error:
        'Fitur Hapus Permanen belum dikonfigurasi pada server.',
    }
  }

  try {
    const admin = createSupabaseAdminClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const { data, error } = await admin.rpc(
      'delete_cancelled_return',
      {
        p_return_id: normalizedReturnId,
      },
    )

    if (error) {
      const message = error.message.toLowerCase()

      if (message.includes('return_not_found')) {
        return {
          ok: false,
          error: 'Data return tidak ditemukan.',
        }
      }

      if (message.includes('return_not_cancelled')) {
        return {
          ok: false,
          error:
            'Hanya Return berstatus Dibatalkan yang boleh dihapus permanen.',
        }
      }

      console.error(
        '[deleteCancelledReturnAction] Database:',
        error.message,
      )

      return {
        ok: false,
        error: friendlyDbError(error.message),
      }
    }

    const deleted = data as unknown as {
      id: number | string
      no_return: string | null
      foto_surat_jalan_url: string | null
      foto_material_url: string | null
    } | null

    if (!deleted || deleted.id == null) {
      console.error(
        '[deleteCancelledReturnAction] Data penghapusan tidak dapat diverifikasi.',
      )

      return {
        ok: false,
        error:
          'Hasil penghapusan belum dapat diverifikasi. Periksa database sebelum mencoba lagi.',
      }
    }

    // Baris database sudah dihapus oleh RPC.
    // Sekarang bersihkan file foto pada bucket yang sama.
    const photoPaths: string[] = []
    let photosCleanupFailed = false

    for (const value of [
      deleted.foto_surat_jalan_url,
      deleted.foto_material_url,
    ]) {
      if (!value?.trim()) continue

      const path = value.trim().replace(/^\/+/, '')

      // Kolom berisi path objek dalam bucket, bukan URL bertoken.
      if (
        /^https?:\/\//i.test(path) ||
        path.split('/').includes('..')
      ) {
        photosCleanupFailed = true
        console.error(
          '[deleteCancelledReturnAction] Path foto tidak valid untuk Storage.',
        )
        continue
      }

      if (!photoPaths.includes(path)) {
        photoPaths.push(path)
      }
    }

    if (photoPaths.length > 0) {
      try {
        const { error: storageError } = await admin.storage
          .from('return-photos')
          .remove(photoPaths)

        if (storageError) {
          photosCleanupFailed = true
          console.error(
            '[deleteCancelledReturnAction] Pembersihan foto gagal:',
            storageError.message,
          )
        }
      } catch (storageError) {
        photosCleanupFailed = true
        console.error(
          '[deleteCancelledReturnAction] Storage exception:',
          storageError,
        )
      }
    }

    revalidateReturns()
    revalidatePath(`/returns/${normalizedReturnId}`)

    return {
      ok: true,
      data: {
        no_return: deleted.no_return ?? String(deleted.id),
        photosCleanupFailed,
      },
    }
  } catch (error) {
    console.error(
      '[deleteCancelledReturnAction]',
      error,
    )

    return {
      ok: false,
      error: GENERIC_DB_ERROR,
    }
  }
}

/* ============================================================
   HISTORY HELPERS
   ============================================================ */

type SupabaseClient = Awaited<
  ReturnType<typeof createClient>
>

async function insertHistory(
  supabase: SupabaseClient,
  input: {
    return_header_id: number
    user_id: string
    action:
      | 'CREATE'
      | 'UPDATE_HEADER'
      | 'ADD_ITEM'
      | 'UPDATE_ITEM'
      | 'DELETE_ITEM'
      | 'UPDATE_STATUS'
      | 'CANCEL'
    module:
      | 'RETURN'
      | 'ITEM'
      | 'STATUS'
    old_data: Record<string, unknown> | null
    new_data: Record<string, unknown> | null
    changed_fields:
      | Record<
          string,
          {
            old: unknown
            new: unknown
          }
        >
      | null
    notes: string
  },
) {
  const { error } = await supabase
    .from('return_history')
    .insert({
      return_header_id:
        input.return_header_id,
      user_id: input.user_id,
      action: input.action,
      module: input.module,
      old_data: input.old_data,
      new_data: input.new_data,
      changed_fields:
        input.changed_fields,
      notes: input.notes,
    })

  return error?.message ?? null
}

function pickFields(
  row: Record<string, unknown>,
  fields: string[],
) {
  return fields.reduce<
    Record<string, unknown>
  >((result, field) => {
    result[field] = row[field] ?? null
    return result
  }, {})
}

function buildChangedFields(
  oldRow: Record<string, unknown>,
  newRow: Record<string, unknown>,
  fields: string[],
) {
  return fields.reduce<
    Record<
      string,
      {
        old: unknown
        new: unknown
      }
    >
  >((result, field) => {
    result[field] = {
      old: oldRow[field] ?? null,
      new: newRow[field] ?? null,
    }

    return result
  }, {})
}