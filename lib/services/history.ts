import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

import type { ReturnHistoryEntry } from '@/lib/types'

export interface HistoryFilters {
  q?: string
  returnId?: string
  from?: string
  to?: string
}

type HistoryRow = {
  id: number
  return_header_id: number | null
  user_id: string | null
  action: string
  module: string | null
  old_data: unknown
  new_data: unknown
  changed_fields: unknown
  notes: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

type ReturnHeaderRow = {
  id: number
  no_return: string
}

type ProfileRow = {
  id: string
  nama: string | null
}

const HISTORY_PAGE_SIZE = 500
const ID_GROUP_SIZE = 100
const DEFAULT_HISTORY_LIMIT = 300

function sanitizeSearch(value: string) {
  return value.replace(/[%,()*]/g, ' ').trim()
}

function chunkArray<T>(
  values: T[],
  size: number,
): T[][] {
  const result: T[][] = []

  for (
    let index = 0;
    index < values.length;
    index += size
  ) {
    result.push(values.slice(index, index + size))
  }

  return result
}

function toRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null
  }

  return value as Record<string, unknown>
}

/* ============================================================
   CARI RETURN BERDASARKAN NOMOR RETURN
   ============================================================ */

async function findReturnHeaders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  keyword: string,
): Promise<ReturnHeaderRow[]> {
  const headers: ReturnHeaderRow[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('return_headers')
      .select('id, no_return')
      .ilike('no_return', `%${keyword}%`)
      .order('id', { ascending: true })
      .range(
        offset,
        offset + HISTORY_PAGE_SIZE - 1,
      )

    if (error) {
      console.error('[findReturnHeaders]', error)
      throw new Error(
        'Gagal mencari nomor Return pada History.',
      )
    }

    const batch = (data ?? []) as ReturnHeaderRow[]

    headers.push(...batch)

    if (batch.length < HISTORY_PAGE_SIZE) {
      break
    }

    offset += batch.length
  }

  return headers
}

/* ============================================================
   AMBIL DATA HISTORY
   ============================================================ */

async function fetchHistoryRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: HistoryFilters,
  returnHeaderIds: number[] | null,
  limit: number,
): Promise<HistoryRow[]> {
  const rows: HistoryRow[] = []

  /*
   * Tanpa filter:
   * tetap gunakan batas 300 aktivitas terbaru
   * agar pembukaan halaman tetap ringan.
   *
   * Dengan filter:
   * ambil seluruh hasil secara bertahap.
   */

  const hasFilter = Boolean(
    filters.q?.trim() ||
    filters.returnId ||
    filters.from ||
    filters.to,
  )

  if (
    returnHeaderIds !== null &&
    returnHeaderIds.length === 0
  ) {
    return []
  }

  const groups =
    returnHeaderIds === null
      ? [null]
      : chunkArray(returnHeaderIds, ID_GROUP_SIZE)

  for (const headerIds of groups) {
    let offset = 0

    while (true) {
      const pageSize = hasFilter
        ? HISTORY_PAGE_SIZE
        : Math.max(1, Math.floor(limit))

      let query = supabase
        .from('return_history')
        .select(`
          id,
          return_header_id,
          user_id,
          action,
          module,
          old_data,
          new_data,
          changed_fields,
          notes,
          ip_address,
          user_agent,
          created_at
        `)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })

      if (headerIds !== null) {
        query = query.in(
          'return_header_id',
          headerIds,
        )
      }

      if (filters.from) {
        query = query.gte(
          'created_at',
          `${filters.from}T00:00:00+07:00`,
        )
      }

      if (filters.to) {
        query = query.lte(
          'created_at',
          `${filters.to}T23:59:59+07:00`,
        )
      }

      const { data, error } = await query.range(
        offset,
        offset + pageSize - 1,
      )

      if (error) {
        console.error('[fetchHistoryRows]', error)
        throw new Error(
          'Gagal mengambil data riwayat aktivitas.',
        )
      }

      const batch = (data ?? []) as HistoryRow[]

      rows.push(...batch)

      if (!hasFilter || batch.length < pageSize) {
        break
      }

      offset += batch.length
    }
  }

  /*
   * Gabungkan hasil kelompok ID dan urutkan kembali
   * berdasarkan waktu aktivitas.
   */

  rows.sort((a, b) => {
    const dateCompare =
      b.created_at.localeCompare(a.created_at)

    if (dateCompare !== 0) {
      return dateCompare
    }

    return b.id - a.id
  })

  return rows
}

/* ============================================================
   AMBIL NOMOR RETURN
   ============================================================ */

async function getReturnNumberMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: HistoryRow[],
  searchedHeaders: ReturnHeaderRow[],
): Promise<Map<number, string>> {
  const headerMap = new Map<number, string>()

  for (const header of searchedHeaders) {
    headerMap.set(header.id, header.no_return)
  }

  const missingIds = Array.from(
    new Set(
      rows
        .map((row) => row.return_header_id)
        .filter(
          (id): id is number =>
            id !== null &&
            Number.isInteger(id) &&
            id > 0 &&
            !headerMap.has(id),
        ),
    ),
  )

  for (const group of chunkArray(
    missingIds,
    ID_GROUP_SIZE,
  )) {
    const { data, error } = await supabase
      .from('return_headers')
      .select('id, no_return')
      .in('id', group)

    if (error) {
      console.error('[getReturnNumberMap]', error)
      throw new Error(
        'Gagal mengambil nomor Return untuk History.',
      )
    }

    for (const header of (data ?? []) as ReturnHeaderRow[]) {
      headerMap.set(header.id, header.no_return)
    }
  }

  return headerMap
}

/* ============================================================
   AMBIL NAMA PENGGUNA
   ============================================================ */

async function getUserNameMap(
  rows: HistoryRow[],
): Promise<Map<string, string>> {
  const userIds = Array.from(
    new Set(
      rows
        .map((row) => row.user_id)
        .filter(
          (id): id is string =>
            typeof id === 'string' && id.length > 0,
        ),
    ),
  )

  const userMap = new Map<string, string>()

  if (userIds.length === 0) {
    return userMap
  }

  /*
   * Admin Client digunakan di server hanya untuk membaca
   * ID dan nama pengguna dari profiles.
   *
   * Tidak mengambil email, role, atau informasi sensitif lain.
   */

  const admin = createAdminClient()

  for (const group of chunkArray(
    userIds,
    ID_GROUP_SIZE,
  )) {
    const { data, error } = await admin
      .from('profiles')
      .select('id, nama')
      .in('id', group)

    if (error) {
      console.error(
        '[getUserNameMap] Profiles:',
        error.message,
      )

      continue
    }

    for (const profile of (data ?? []) as ProfileRow[]) {
      const name = profile.nama?.trim()

      if (name) {
        userMap.set(profile.id, name)
      }
    }
  }

  return userMap
}

/* ============================================================
   LIST HISTORY
   ============================================================ */

export async function listHistory(
  filters: HistoryFilters,
  limit = DEFAULT_HISTORY_LIMIT,
): Promise<ReturnHistoryEntry[]> {
  const supabase = await createClient()

  const keyword = sanitizeSearch(
    filters.q ?? '',
  )

  /*
   * Tentukan Return Header yang sesuai pencarian.
   */

  let searchedHeaders: ReturnHeaderRow[] = []

  let returnHeaderIds: number[] | null = null

  if (keyword) {
    searchedHeaders = await findReturnHeaders(
      supabase,
      keyword,
    )

    returnHeaderIds = searchedHeaders.map(
      (header) => header.id,
    )
  }

  /*
   * Filter Return ID tetap dipertahankan
   * untuk kompatibilitas penggunaan service.
   */

  if (filters.returnId) {
    const headerId = Number(filters.returnId)

    if (
      !Number.isSafeInteger(headerId) ||
      headerId <= 0
    ) {
      return []
    }

    if (returnHeaderIds === null) {
      returnHeaderIds = [headerId]
    } else {
      returnHeaderIds = returnHeaderIds.filter(
        (id) => id === headerId,
      )
    }
  }

  /*
   * Ambil History.
   */

  const rows = await fetchHistoryRows(
    supabase,
    {
      ...filters,
      q: keyword || undefined,
    },
    returnHeaderIds,
    limit,
  )

  if (rows.length === 0) {
    return []
  }

  /*
   * Ambil nomor Return dan nama pengguna secara paralel.
   */

  const [headerMap, userMap] = await Promise.all([
    getReturnNumberMap(
      supabase,
      rows,
      searchedHeaders,
    ),
    getUserNameMap(rows),
  ])

  /*
   * Gabungkan semua informasi untuk UI.
   */

  return rows.map((row): ReturnHistoryEntry => ({
    id: String(row.id),

    return_header_id:
      row.return_header_id === null
        ? ''
        : String(row.return_header_id),

    user_id: row.user_id,

    action:
      row.action as ReturnHistoryEntry['action'],

    module:
      row.module as ReturnHistoryEntry['module'],

    old_data: toRecord(row.old_data),

    new_data: toRecord(row.new_data),

    changed_fields:
      toRecord(row.changed_fields) as
        ReturnHistoryEntry['changed_fields'],

    notes: row.notes,

    ip_address: row.ip_address,

    user_agent: row.user_agent,

    created_at: row.created_at,

    user_name:
      row.user_id
        ? userMap.get(row.user_id) ?? null
        : null,

    no_return:
      row.return_header_id !== null
        ? headerMap.get(row.return_header_id) ?? null
        : null,
  }))
}