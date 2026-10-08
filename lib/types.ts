export type Role =
  | 'master_data'
  | 'admin'
  | 'read_only'

export type UserStatus =
  | 'active'
  | 'inactive'

export type ReturnStatus =
  | 'diterima'
  | 'dibatalkan'

export interface AppUser {
  id: string
  name: string
  email: string
  role: Role
  status: UserStatus
  created_at: string
}

/* ============================================================
   RETURN HEADER
   ============================================================ */

export interface ReturnHeader {
  id: string
  no_return: string
  tanggal_penerimaan: string | null
  no_sppb: string | null
  no_claim: string | null
  customer: string | null
  pic_penerima: string | null
  catatan: string | null
  status: ReturnStatus
  created_by: string | null
  foto_surat_jalan_url: string | null
  foto_material_url: string | null
  created_at: string
  updated_at: string
}

/* ============================================================
   RETURN SUMMARY
   ============================================================ */

export interface ReturnSummary
  extends ReturnHeader {
  item_count: number
  total_qty_sj: number
  total_qty_aktual: number
  selisih_count: number
}

/* ============================================================
   RETURN ITEM
   ============================================================ */

export interface ReturnItem {
  id: string
  return_header_id: string

  diameter: string | null
  tebal: number | null
  panjang: number | null

  batch: string | null
  no_box: string | null

  qty_aktual: number
  qty_surat_jalan: number

  kondisi_material: string | null
  location: string | null

  no_ncr: string | null
  disposisi: string | null
  pic: string | null

  status: string | null
  tindakan: string | null
  target: string | null
  progres: number

  created_at: string
  updated_at: string
}

/* ============================================================
   RETURN HISTORY
   ============================================================ */

export type ReturnHistoryAction =
  | 'CREATE'
  | 'UPDATE_HEADER'
  | 'ADD_ITEM'
  | 'UPDATE_ITEM'
  | 'DELETE_ITEM'
  | 'UPDATE_STATUS'
  | 'CANCEL'

export type ReturnHistoryModule =
  | 'RETURN'
  | 'ITEM'
  | 'STATUS'

export interface ReturnHistoryChangedField {
  old: unknown
  new: unknown
}

export interface ReturnHistoryEntry {
  id: string
  return_header_id: string
  user_id: string | null

  action: ReturnHistoryAction
  module: ReturnHistoryModule

  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null

  changed_fields:
    | Record<
        string,
        ReturnHistoryChangedField
      >
    | null

  notes: string | null

  ip_address: string | null
  user_agent: string | null

  created_at: string

  user_name?: string | null
  no_return?: string | null
}

/* ============================================================
   RETURN FILTERS
   ============================================================ */

export interface ReturnFilters {
  from?: string
  to?: string
  customer?: string
  status?: ReturnStatus | string
  q?: string
}

/* ============================================================
   ACTION RESULT
   ============================================================ */

export type ActionResult<
  T = undefined,
> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: string
      fieldErrors?: Record<
        string,
        string
      >
    }