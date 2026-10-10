import { createClient } from '@/lib/supabase/server'
import { PHOTO_BUCKET } from '@/lib/supabase/config'
import { monthStartISO, todayISO } from '@/lib/format'

import type {
  ReturnFilters,
  ReturnHeader,
  ReturnItem,
  ReturnSummary,
} from '@/lib/types'

const SUMMARY_COLUMNS =
  'id, no_return, tanggal_penerimaan, no_sppb, no_claim, customer, pic_penerima, catatan, status, created_by, foto_surat_jalan_url, foto_material_url, created_at, updated_at, item_count, total_qty_sj, total_qty_aktual, selisih_count'

function sanitizeSearch(q: string) {
  return q
    .replace(/[%,()*]/g, ' ')
    .trim()
}

/* ============================================================
   RETURN SUMMARY
   ============================================================ */

export async function listReturnSummaries(
  filters: ReturnFilters,
  limit = 200,
) {
  const supabase = await createClient()

  let query = supabase
    .from('return_summary')
    .select(SUMMARY_COLUMNS)
    .order('tanggal_penerimaan', {
      ascending: false,
    })
    .order('created_at', {
      ascending: false,
    })
    .limit(limit)

  if (filters.from) {
    query = query.gte(
      'tanggal_penerimaan',
      filters.from,
    )
  }

  if (filters.to) {
    query = query.lte(
      'tanggal_penerimaan',
      filters.to,
    )
  }

  if (filters.customer) {
    query = query.eq(
      'customer',
      filters.customer,
    )
  }

  if (filters.status) {
    query = query.eq(
      'status',
      filters.status,
    )
  }

  if (filters.q) {
    const q = sanitizeSearch(filters.q)

    if (q) {
      query = query.or(
        `no_return.ilike.%${q}%,no_sppb.ilike.%${q}%,no_claim.ilike.%${q}%,customer.ilike.%${q}%`,
      )
    }
  }

  const {
    data,
    error,
  } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(normalizeSummary)
}

function normalizeSummary(
  row: Record<string, unknown>,
): ReturnSummary {
  return {
    ...(row as unknown as ReturnSummary),

    total_qty_sj: Number(
      row.total_qty_sj ?? 0,
    ),

    total_qty_aktual: Number(
      row.total_qty_aktual ?? 0,
    ),

    item_count: Number(
      row.item_count ?? 0,
    ),

    selisih_count: Number(
      row.selisih_count ?? 0,
    ),
  }
}

/* ============================================================
   CUSTOMER LIST
   ============================================================ */

export async function listCustomers() {
  const supabase = await createClient()

  const {
    data,
    error,
  } = await supabase
    .from('return_headers')
    .select('customer')
    .not('customer', 'is', null)
    .order('customer')
    .limit(1000)

  if (error) {
    throw new Error(error.message)
  }

  return Array.from(
    new Set(
      (data ?? [])
        .map(
          (row) =>
            row.customer,
        )
        .filter(
          (
            customer,
          ): customer is string =>
            Boolean(customer),
        ),
    ),
  )
}

/* ============================================================
   DASHBOARD
   ============================================================ */

export interface DashboardData {
  totalReturn: number
  returnToday: number
  returnMonth: number
  totalItem: number
  totalQtyAktual: number
  totalSelisih: number

  /*
   * Grafik trend return.
   */
  chart: {
    key: string
    count: number
    qty: number
  }[]

  chartMode: 'day' | 'month'

  /*
   * Grafik status return.
   */
  statusChart: {
    name: string
    count: number
  }[]

  /*
   * Grafik return per customer.
   */
  customerChart: {
    name: string
    count: number
  }[]

  recent: ReturnSummary[]
}

export async function getDashboardData(
  filters: ReturnFilters,
): Promise<DashboardData> {
  /*
   * Semua grafik menggunakan data yang sama
   * dari return_summary dan sudah mengikuti
   * filter dashboard.
   */
  const rows =
    await listReturnSummaries(
      filters,
      5000,
    )

  const today =
    todayISO()

  const monthStart =
    monthStartISO()

  /*
   * ==========================================================
   * DATA AKTIF
   * ==========================================================
   *
   * Return dibatalkan tidak dihitung
   * dalam KPI maupun grafik.
   */
  const active =
    rows.filter(
      (row) =>
        row.status !==
        'dibatalkan',
    )

  /*
   * ==========================================================
   * MODE GRAFIK TREND
   * ==========================================================
   */

  const spanDays =
    rangeInDays(
      filters.from,
      filters.to,
      rows,
    )

  const chartMode:
    | 'day'
    | 'month' =
    spanDays <= 62
      ? 'day'
      : 'month'

  /*
   * ==========================================================
   * GRAFIK 1
   * TREND RETURN
   * ==========================================================
   */

  const buckets = new Map<
    string,
    {
      count: number
      qty: number
    }
  >()

  for (
    const row of active
  ) {
    if (
      !row.tanggal_penerimaan
    ) {
      continue
    }

    const key =
      chartMode === 'day'
        ? row.tanggal_penerimaan
        : row.tanggal_penerimaan.slice(
            0,
            7,
          )

    const bucket =
      buckets.get(key) ?? {
        count: 0,
        qty: 0,
      }

    bucket.count += 1

    bucket.qty +=
      row.total_qty_aktual

    buckets.set(
      key,
      bucket,
    )
  }

  const chart =
    Array.from(
      buckets.entries(),
    )
      .sort(
        ([a], [b]) =>
          a.localeCompare(b),
      )
      .map(
        ([key, value]) => ({
          key,
          ...value,
        }),
      )

  /*
   * ==========================================================
   * GRAFIK 2
   * STATUS RETURN
   * ==========================================================
   */

  const statusBuckets =
    new Map<string, number>()

  for (
    const row of active
  ) {
    const status =
      row.status?.trim() ||
      'Belum Ada Status'

    statusBuckets.set(
      status,
      (statusBuckets.get(
        status,
      ) ?? 0) + 1,
    )
  }

  const statusChart =
    Array.from(
      statusBuckets.entries(),
    )
      .sort(
        ([, a], [, b]) =>
          b - a,
      )
      .map(
        ([name, count]) => ({
          name,
          count,
        }),
      )

  /*
   * ==========================================================
   * GRAFIK 3
   * RETURN PER CUSTOMER
   * ==========================================================
   */

  const customerBuckets =
    new Map<string, number>()

  for (
    const row of active
  ) {
    const customer =
      row.customer?.trim() ||
      'Customer Tidak Diisi'

    customerBuckets.set(
      customer,
      (customerBuckets.get(
        customer,
      ) ?? 0) + 1,
    )
  }

  const customerChart =
    Array.from(
      customerBuckets.entries(),
    )
      .sort(
        ([, a], [, b]) =>
          b - a,
      )
      .map(
        ([name, count]) => ({
          name,
          count,
        }),
      )

  /*
   * ==========================================================
   * DASHBOARD RESULT
   * ==========================================================
   */

  return {
    totalReturn:
      active.length,

    returnToday:
      active.filter(
        (row) =>
          row.tanggal_penerimaan ===
          today,
      ).length,

    returnMonth:
      active.filter(
        (row) =>
          Boolean(
            row.tanggal_penerimaan,
          ) &&
          row.tanggal_penerimaan! >=
            monthStart &&
          row.tanggal_penerimaan! <=
            today,
      ).length,

    totalItem:
      active.reduce(
        (sum, row) =>
          sum +
          row.item_count,
        0,
      ),

    totalQtyAktual:
      active.reduce(
        (sum, row) =>
          sum +
          row.total_qty_aktual,
        0,
      ),

    totalSelisih:
      active.filter(
        (row) =>
          row.selisih_count >
          0,
      ).length,

    chart,

    chartMode,

    statusChart,

    customerChart,

    recent:
      rows.slice(0, 10),
  }
}

function rangeInDays(
  from: string | undefined,
  to: string | undefined,
  rows: ReturnSummary[],
) {
  const dates =
    rows
      .map(
        (row) =>
          row.tanggal_penerimaan,
      )
      .filter(
        (
          date,
        ): date is string =>
          Boolean(date),
      )
      .sort()

  const start =
    from ?? dates[0]

  const end =
    to ??
    dates[
      dates.length - 1
    ]

  if (
    !start ||
    !end
  ) {
    return 0
  }

  return (
    new Date(end).getTime() -
    new Date(start).getTime()
  ) / 86_400_000
}

/* ============================================================
   RETURN DETAIL
   ============================================================ */

export interface ReturnDetail {
  header: ReturnHeader & {
    created_by_name: string | null

    /*
     * Signed URL sementara untuk menampilkan foto
     * dari Supabase Storage private bucket.
     */
    foto_surat_jalan_signed_url: string | null
    foto_material_signed_url: string | null
  }

  items: ReturnItem[]
}

/**
 * Mengambil detail Return berdasarkan
 * ID pada return_headers.
 *
 * Contoh:
 *
 * URL:
 * /returns/8
 *
 * Maka:
 *
 * return_headers.id = 8
 *
 * Kemudian semua item:
 *
 * return_items.return_header_id = 8
 */
export async function getReturnDetail(
  id: string,
): Promise<ReturnDetail | null> {
  const supabase =
    await createClient()

  /* ==========================================================
     VALIDASI ID
     ========================================================== */

  const headerId =
    Number(id)

  if (
    !Number.isInteger(
      headerId,
    ) ||
    headerId <= 0
  ) {
    throw new Error(
      `ID Return tidak valid: ${id}`,
    )
  }

  console.log(
    '[getReturnDetail] mencari header id:',
    headerId,
  )

  /* ==========================================================
     AMBIL HEADER
     ========================================================== */

  const {
    data: header,
    error: headerError,
  } = await supabase
    .from('return_headers')
    .select('*')
    .eq(
      'id',
      headerId,
    )
    .maybeSingle()

  console.log(
    '[getReturnDetail] header:',
    header,
  )

  console.log(
    '[getReturnDetail] headerError:',
    headerError,
  )

  if (
    headerError
  ) {
    throw new Error(
      headerError.message,
    )
  }

  if (
    !header
  ) {
    return null
  }

  /* ==========================================================
     BUAT SIGNED URL FOTO
     ========================================================== */

  const createPhotoSignedUrl = async (
    path: string | null,
  ): Promise<string | null> => {
    if (!path) {
      return null
    }

    const {
      data,
      error,
    } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(
        path,
        60 * 60,
      )

    if (error) {
      console.error(
        '[getReturnDetail] Gagal membuat signed URL foto:',
        error.message,
      )

      return null
    }

    return data.signedUrl
  }

  const [
    fotoSuratJalanSignedUrl,
    fotoMaterialSignedUrl,
  ] = await Promise.all([
    createPhotoSignedUrl(
      header.foto_surat_jalan_url,
    ),

    createPhotoSignedUrl(
      header.foto_material_url,
    ),
  ])

  /* ==========================================================
     AMBIL SEMUA ITEMS DALAM HEADER
     ========================================================== */

  const {
    data: items,
    error: itemsError,
  } = await supabase
    .from('return_items')
    .select('*')
    .eq(
      'return_header_id',
      header.id,
    )
    .order(
      'id',
      {
        ascending: true,
      },
    )

  console.log(
    '[getReturnDetail] header.id:',
    header.id,
  )

  console.log(
    '[getReturnDetail] no_return:',
    header.no_return,
  )

  console.log(
    '[getReturnDetail] jumlah items:',
    items?.length ?? 0,
  )

  console.log(
    '[getReturnDetail] items:',
    items,
  )

  console.log(
    '[getReturnDetail] itemsError:',
    itemsError,
  )

  if (
    itemsError
  ) {
    throw new Error(
      itemsError.message,
    )
  }

  /* ==========================================================
     NORMALIZE ITEMS
     ========================================================== */

  const normalizedItems:
    ReturnItem[] =
    (items ?? []).map(
      (item) => ({
        ...(item as ReturnItem),

        tebal:
          item.tebal === null
            ? null
            : Number(
                item.tebal,
              ),

        panjang:
          item.panjang === null
            ? null
            : Number(
                item.panjang,
              ),

        qty_surat_jalan:
          Number(
            item.qty_surat_jalan ?? 0,
          ),

        qty_aktual:
          Number(
            item.qty_aktual ?? 0,
          ),

        progres:
          Number(
            item.progres ?? 0,
          ),
      }),
    )

  /* ==========================================================
     RETURN DATA
     ========================================================== */

  return {
    header: {
      ...(header as ReturnHeader),

      created_by_name: null,

      foto_surat_jalan_signed_url:
        fotoSuratJalanSignedUrl,

      foto_material_signed_url:
        fotoMaterialSignedUrl,
    },

    items: normalizedItems,
  }
}