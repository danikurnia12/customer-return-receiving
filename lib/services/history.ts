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

export async function listHistory(
  filters: HistoryFilters,
  limit = 300,
) {
  const supabase = await createClient()

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
    .order('created_at', {
      ascending: false,
    })
    .limit(limit)

  /*
   * Filter berdasarkan Return Header.
   */
  if (filters.returnId) {
    const headerId =
      Number(filters.returnId)

    if (
      Number.isInteger(headerId) &&
      headerId > 0
    ) {
      query = query.eq(
        'return_header_id',
        headerId,
      )
    }
  }

  /*
   * Filter tanggal awal.
   */
  if (filters.from) {
    query = query.gte(
      'created_at',
      `${filters.from}T00:00:00+07:00`,
    )
  }

  /*
   * Filter tanggal akhir.
   */
  if (filters.to) {
    query = query.lte(
      'created_at',
      `${filters.to}T23:59:59+07:00`,
    )
  }

  const {
    data,
    error,
  } = await query

  if (error) {
    throw new Error(
      error.message,
    )
  }

  const rows =
    (data ?? []) as HistoryRow[]

  /*
   * Ambil seluruh ID Return Header
   * yang digunakan oleh history.
   */
  const returnHeaderIds =
    Array.from(
      new Set(
        rows
          .map(
            (row) =>
              row.return_header_id,
          )
          .filter(
            (
              id,
            ): id is number =>
              id !== null &&
              Number.isInteger(id) &&
              id > 0,
          ),
      ),
    )

  /*
   * Ambil nomor Return dari
   * return_headers.
   */
  const headerMap =
    new Map<number, string>()

  if (
    returnHeaderIds.length > 0
  ) {
    const {
      data: headers,
      error:
        headersError,
    } = await supabase
      .from('return_headers')
      .select(
        'id, no_return',
      )
      .in(
        'id',
        returnHeaderIds,
      )

    if (headersError) {
      throw new Error(
        headersError.message,
      )
    }

    for (
      const header of
        (headers ??
          []) as ReturnHeaderRow[]
    ) {
      headerMap.set(
        header.id,
        header.no_return,
      )
    }
  }

  /*
   * Gabungkan history dengan
   * nomor Return.
   */
  let history =
    rows.map(
      (row) => ({
        ...(row as unknown as ReturnHistoryEntry),

        /*
         * Field tambahan untuk
         * ditampilkan di UI.
         */
        no_return:
          row.return_header_id !== null
            ? headerMap.get(
                row.return_header_id,
              ) ?? null
            : null,
      }),
    )

  /*
   * Filter berdasarkan No Return.
   */
  if (filters.q) {
    const q =
      filters.q
        .replace(
          /[%,()*]/g,
          ' ',
        )
        .trim()
        .toLowerCase()

    if (q) {
      history =
        history.filter(
          (item) => {
            const noReturn =
              (
                item as unknown as {
                  no_return:
                    | string
                    | null
                }
              ).no_return ?? ''

            return noReturn
              .toLowerCase()
              .includes(q)
          },
        )
    }
  }

  return history
}