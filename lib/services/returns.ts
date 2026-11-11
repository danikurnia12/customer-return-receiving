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

const SUMMARY_PAGE_SIZE = 500
const ITEM_PAGE_SIZE = 500
const HEADER_ID_GROUP_SIZE = 100

const DISPOSISI_OPTIONS = [
  'Reject',
  'Downgrade',
  'Sortir/Repair',
  'Hold',
  'Prime',
] as const

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

function sanitizeSearch(q: string) {
  return q.replace(/[%,()*]/g, ' ').trim()
}

/* ============================================================
   NORMALIZE SUMMARY
   ============================================================ */

function normalizeSummary(
  row: Record<string, unknown>,
): ReturnSummary {
  return {
    ...(row as unknown as ReturnSummary),
    total_qty_sj: Number(row.total_qty_sj ?? 0),
    total_qty_aktual: Number(row.total_qty_aktual ?? 0),
    item_count: Number(row.item_count ?? 0),
    selisih_count: Number(row.selisih_count ?? 0),
  }
}

/* ============================================================
   RETURN SUMMARY
   ============================================================ */

async function queryReturnSummaries(
  supabase: ServerSupabaseClient,
  filters: ReturnFilters,
  limit = 200,
  offset = 0,
): Promise<ReturnSummary[]> {
  let query = supabase
    .from('return_summary')
    .select(SUMMARY_COLUMNS)
    .order('tanggal_penerimaan', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (filters.from) {
    query = query.gte('tanggal_penerimaan', filters.from)
  }

  if (filters.to) {
    query = query.lte('tanggal_penerimaan', filters.to)
  }

  if (filters.customer) {
    query = query.eq('customer', filters.customer)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.q) {
    const q = sanitizeSearch(filters.q)

    if (q) {
      query = query.or(
        `no_return.ilike.%${q}%,no_sppb.ilike.%${q}%,no_claim.ilike.%${q}%,customer.ilike.%${q}%`,
      )
    }
  }

  const { data, error } = await query.range(
    offset,
    offset + limit - 1,
  )

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(normalizeSummary)
}

export async function listReturnSummaries(
  filters: ReturnFilters,
  limit = 200,
  offset = 0,
) {
  const supabase = await createClient()

  return queryReturnSummaries(
    supabase,
    filters,
    limit,
    offset,
  )
}

/* ============================================================
   GET ALL SUMMARIES WITH PAGINATION
   ============================================================ */

async function listAllReturnSummaries(
  supabase: ServerSupabaseClient,
  filters: ReturnFilters,
): Promise<ReturnSummary[]> {
  const allRows: ReturnSummary[] = []
  let offset = 0

  while (true) {
    const batch = await queryReturnSummaries(
      supabase,
      filters,
      SUMMARY_PAGE_SIZE,
      offset,
    )

    allRows.push(...batch)

    if (batch.length < SUMMARY_PAGE_SIZE) {
      break
    }

    offset += batch.length
  }

  return allRows
}

/* ============================================================
   RETURN ITEMS MASTER-DETAIL
   ============================================================ */

export interface ReturnItemsViewRow {
  header: ReturnSummary
  /**
   * Detail tidak dimuat saat daftar Header pertama kali dibuka.
   * Properti ini tetap disediakan agar kontrak master-detail lama
   * tetap jelas; isinya dimuat melalui getReturnItemsByHeader().
   */
  items: ReturnItem[]
  /** Header cocok dengan kata pencarian. Jika true, semua item ditampilkan. */
  headerMatched: boolean
  /** ID item yang cocok jika pencarian hanya cocok pada atribut material. */
  matchingItemIds: string[]
}

const ITEM_SEARCH_COLUMNS =
  'id, return_header_id, diameter, tebal, panjang, batch, no_box, location, kondisi_material'

function normalizeReturnItem(
  item: Record<string, unknown>,
): ReturnItem {
  return {
    ...(item as unknown as ReturnItem),

    // Pastikan ID selalu string untuk kebutuhan UI dan Server Action.
    id: String(item.id ?? ''),

    return_header_id: String(item.return_header_id),

    tebal:
      item.tebal === null || item.tebal === undefined
        ? null
        : Number(item.tebal),

    panjang:
      item.panjang === null || item.panjang === undefined
        ? null
        : Number(item.panjang),

    qty_surat_jalan: Number(item.qty_surat_jalan ?? 0),
    qty_aktual: Number(item.qty_aktual ?? 0),
    progres: Number(item.progres ?? 0),
  }
}

export async function listReturnItemsView(
  filters: ReturnFilters,
): Promise<ReturnItemsViewRow[]> {
  const supabase = await createClient()

  const headers: ReturnSummary[] = []
  let headerOffset = 0

  /* Ambil seluruh Header secara bertahap, seperti alur lama. */

  while (true) {
    let query = supabase
      .from('return_summary')
      .select(SUMMARY_COLUMNS)
      .order('tanggal_penerimaan', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })

    if (filters.from) {
      query = query.gte('tanggal_penerimaan', filters.from)
    }

    if (filters.to) {
      query = query.lte('tanggal_penerimaan', filters.to)
    }

    if (filters.customer) {
      query = query.eq('customer', filters.customer)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query.range(
      headerOffset,
      headerOffset + SUMMARY_PAGE_SIZE - 1,
    )

    if (error) {
      throw new Error(
        `Gagal mengambil Header Return: ${error.message}`,
      )
    }

    const batch = (data ?? []).map(normalizeSummary)
    headers.push(...batch)

    if (batch.length < SUMMARY_PAGE_SIZE) {
      break
    }

    headerOffset += batch.length
  }

  if (headers.length === 0) {
    return []
  }

  /*
   * Tidak ada pencarian:
   * kembalikan seluruh Header tanpa mengambil detail Item.
   * Detail akan dimuat saat pengguna memilih Header.
   */

  const search = filters.q?.trim().toLowerCase() ?? ''

  if (!search) {
    return headers.map((header) => ({
      header,
      items: [],
      headerMatched: true,
      matchingItemIds: [],
    }))
  }

  /* Cari kecocokan pada Header terlebih dahulu di memori. */

  const headerMatchIds = new Set<string>()

  for (const header of headers) {
    const headerText = [
      header.no_return,
      header.no_sppb,
      header.no_claim,
      header.customer,
      header.pic_penerima,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (headerText.includes(search)) {
      headerMatchIds.add(String(header.id))
    }
  }

  /*
   * Pencarian atribut Item hanya mengambil kolom yang diperlukan,
   * bukan seluruh kolom Item. Ini hanya dijalankan saat q terisi.
   */

  const matchingItemIdsByHeader = new Map<string, string[]>()
  const headerIdGroups: number[][] = []

  for (
    let index = 0;
    index < headers.length;
    index += HEADER_ID_GROUP_SIZE
  ) {
    headerIdGroups.push(
      headers
        .slice(index, index + HEADER_ID_GROUP_SIZE)
        .map((header) => Number(header.id)),
    )
  }

  for (const headerIds of headerIdGroups) {
    let itemOffset = 0

    while (true) {
      const { data, error } = await supabase
        .from('return_items')
        .select(ITEM_SEARCH_COLUMNS)
        .in('return_header_id', headerIds)
        .order('id', { ascending: true })
        .range(
          itemOffset,
          itemOffset + ITEM_PAGE_SIZE - 1,
        )

      if (error) {
        throw new Error(
          `Gagal mencari atribut Item Return: ${error.message}`,
        )
      }

      const batch = data ?? []

      for (const item of batch) {
        const searchableText = [
          item.diameter,
          item.tebal,
          item.panjang,
          item.batch,
          item.no_box,
          item.location,
          item.kondisi_material,
        ]
          .filter(
            (value) =>
              value !== null && value !== undefined,
          )
          .join(' ')
          .toLowerCase()

        if (searchableText.includes(search)) {
          const headerId = String(item.return_header_id)
          const existing =
            matchingItemIdsByHeader.get(headerId) ?? []

          existing.push(String(item.id))
          matchingItemIdsByHeader.set(headerId, existing)
        }
      }

      if (batch.length < ITEM_PAGE_SIZE) {
        break
      }

      itemOffset += batch.length
    }
  }

  /* Pertahankan hanya Header yang cocok pada Header atau Item. */

  return headers.flatMap((header) => {
    const headerId = String(header.id)
    const headerMatched = headerMatchIds.has(headerId)
    const matchingItemIds =
      matchingItemIdsByHeader.get(headerId) ?? []

    if (!headerMatched && matchingItemIds.length === 0) {
      return []
    }

    return [{
      header,
      items: [],
      headerMatched,
      matchingItemIds,
    }]
  })
}

/**
 * Mengambil detail untuk satu Header terpilih saja.
 * Pagination di sini adalah ukuran batch API, bukan batas jumlah Item.
 */
export async function getReturnItemsByHeader(
  headerId: string,
): Promise<ReturnItem[]> {
  const id = Number(headerId)

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('ID Return tidak valid.')
  }

  const supabase = await createClient()
  const items: ReturnItem[] = []
  let itemOffset = 0

  while (true) {
    const { data, error } = await supabase
      .from('return_items')
      .select('*')
      .eq('return_header_id', id)
      .order('id', { ascending: true })
      .range(
        itemOffset,
        itemOffset + ITEM_PAGE_SIZE - 1,
      )

    if (error) {
      throw new Error(
        `Gagal mengambil Item Return: ${error.message}`,
      )
    }

    const batch: ReturnItem[] = (data ?? []).map(
      (item) =>
        normalizeReturnItem(
          item as unknown as Record<string, unknown>,
        ),
    )

    items.push(...batch)

    if (batch.length < ITEM_PAGE_SIZE) {
      break
    }

    itemOffset += batch.length
  }

  return items
}

/* ============================================================
   CUSTOMER LIST
   ============================================================ */

export async function listCustomers() {
  const supabase = await createClient()

  const pageSize = 500
  const customers = new Set<string>()
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('return_headers')
      .select('customer')
      .not('customer', 'is', null)
      .order('customer')
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw new Error(error.message)
    }

    const rows = data ?? []

    for (const row of rows) {
      const customer = row.customer?.trim()

      if (customer) {
        customers.add(customer)
      }
    }

    if (rows.length < pageSize) {
      break
    }

    offset += rows.length
  }

  return Array.from(customers).sort(
    (a, b) => a.localeCompare(b),
  )
}

/* ============================================================
   DASHBOARD DATA
   ============================================================ */

export interface DashboardData {
  totalReturn: number
  returnToday: number
  returnMonth: number
  totalItem: number
  totalQtyAktual: number
  totalSelisih: number

  chart: {
    key: string
    count: number
    qty: number
  }[]

  chartMode: 'day' | 'month'

  customerQtyChart: {
    name: string
    qty: number
  }[]

  customerChart: {
    name: string
    count: number
  }[]

  /** Kelengkapan No Claim, No NCR, dan Disposisi. */
  adminProgressChart: {
    name: string
    label: string
    filled: number
    missing: number
    filledPercent: number
  }[]

  /** Jumlah transaksi berdasarkan kategori Disposisi. */
  disposisiChart: {
    name: string
    count: number
  }[]

  /** Seluruh transaksi Return aktif dengan tanggal penerimaan hari ini. */
  recent: {
    header: ReturnSummary
    items: ReturnItem[]
  }[]
}

export async function getDashboardData(
  filters: ReturnFilters,
): Promise<DashboardData> {
  const today = todayISO()
  const monthStart = monthStartISO()

  /*
   * Default Dashboard:
   * 12 bulan kalender terakhir termasuk bulan berjalan.
   * Filter tanggal yang dipilih pengguna tetap diprioritaskan.
   */

  const [year, month] = today.split('-').map(Number)

  const defaultFrom = new Date(
    Date.UTC(year, month - 12, 1),
  )
    .toISOString()
    .slice(0, 10)

  const effectiveFilters: ReturnFilters = {
    ...filters,
    from: filters.from || defaultFrom,
    to: filters.to || today,
  }

  const supabase = await createClient()

  const rows = await listAllReturnSummaries(
    supabase,
    effectiveFilters,
  )

  const active = rows.filter(
    (row) => row.status !== 'dibatalkan',
  )

  /* ==========================================================
     DATA ADMINISTRASI UNTUK GRAFIK 4 DAN 5

     Gunakan ID dari transaksi aktif yang sudah melewati filter
     Dashboard. Dengan demikian filter tanggal, customer, status,
     dan pencarian tetap konsisten.

     Query hanya mengambil kolom administrasi yang diperlukan.
     Tidak mengambil seluruh data Header maupun detail Item.
     ========================================================== */

  type AdminHeaderRow = {
    id: number
    no_claim: string | null
    no_claim_2: string | null
    no_claim_3: string | null
    no_claim_4: string | null
    no_ncr: string | null
    disposisi: string | null
  }

  const adminRows: AdminHeaderRow[] = []

  for (
    let index = 0;
    index < active.length;
    index += HEADER_ID_GROUP_SIZE
  ) {
    const headerIds = active
      .slice(index, index + HEADER_ID_GROUP_SIZE)
      .map((header) => Number(header.id))
      .filter((id) => Number.isSafeInteger(id))

    if (headerIds.length === 0) {
      continue
    }

    const { data, error } = await supabase
      .from('return_headers')
      .select(
        'id, no_claim, no_claim_2, no_claim_3, no_claim_4, no_ncr, disposisi',
      )
      .in('id', headerIds)

    if (error) {
      throw new Error(
        `Gagal mengambil data progres administrasi Dashboard: ${error.message}`,
      )
    }

    adminRows.push(...((data ?? []) as AdminHeaderRow[]))
  }

  const hasValue = (value: string | null | undefined) =>
    Boolean(value?.trim())

  let claimFilled = 0
  let ncrFilled = 0
  let disposisiFilled = 0

  const disposisiBuckets = new Map<string, number>()

  for (const option of DISPOSISI_OPTIONS) {
    disposisiBuckets.set(option, 0)
  }

  disposisiBuckets.set('Belum ditentukan', 0)

  for (const row of adminRows) {
    const hasClaim = [
      row.no_claim,
      row.no_claim_2,
      row.no_claim_3,
      row.no_claim_4,
    ].some(hasValue)

    if (hasClaim) {
      claimFilled += 1
    }

    if (hasValue(row.no_ncr)) {
      ncrFilled += 1
    }

    const disposisi = row.disposisi?.trim() || 'Belum ditentukan'

    if (disposisi !== 'Belum ditentukan') {
      disposisiFilled += 1
    }

    disposisiBuckets.set(
      disposisi,
      (disposisiBuckets.get(disposisi) ?? 0) + 1,
    )
  }

  const adminTotal = active.length

  const getFilledPercent = (filled: number) =>
    adminTotal > 0
      ? Math.round((filled / adminTotal) * 100)
      : 0

  const adminProgressChart = [
    {
      name: 'No Claim',
      label: `No Claim (${getFilledPercent(claimFilled)}%)`,
      filled: claimFilled,
      missing: Math.max(adminTotal - claimFilled, 0),
      filledPercent: getFilledPercent(claimFilled),
    },
    {
      name: 'No NCR',
      label: `No NCR (${getFilledPercent(ncrFilled)}%)`,
      filled: ncrFilled,
      missing: Math.max(adminTotal - ncrFilled, 0),
      filledPercent: getFilledPercent(ncrFilled),
    },
    {
      name: 'Disposisi',
      label: `Disposisi (${getFilledPercent(disposisiFilled)}%)`,
      filled: disposisiFilled,
      missing: Math.max(adminTotal - disposisiFilled, 0),
      filledPercent: getFilledPercent(disposisiFilled),
    },
  ]

  /*
   * Pertahankan urutan pilihan Disposisi dari form.
   * Nilai lama/di luar daftar pilihan tetap ditampilkan agar
   * tidak ada transaksi yang hilang dari grafik.
   */

    const knownDisposisi = new Set<string>([
    ...DISPOSISI_OPTIONS,
    'Belum ditentukan',
  ])

  const orderedDisposisi = Array.from(disposisiBuckets.entries())
    .filter(([name]) => knownDisposisi.has(name))

  const additionalDisposisi = Array.from(disposisiBuckets.entries())
    .filter(([name]) => !knownDisposisi.has(name))
    .sort(([a], [b]) => a.localeCompare(b))

  const disposisiChart = [
    ...orderedDisposisi,
    ...additionalDisposisi,
  ].map(([name, count]) => ({
    name,
    count,
  }))

  /* ==========================================================
     GRAFIK 1: TREND RETURN
     ========================================================== */

  const spanDays = rangeInDays(
    effectiveFilters.from,
    effectiveFilters.to,
    rows,
  )

  const chartMode: 'day' | 'month' =
    spanDays <= 62 ? 'day' : 'month'

  const buckets = new Map<
    string,
    { count: number; qty: number }
  >()

  for (const row of active) {
    if (!row.tanggal_penerimaan) continue

    const key =
      chartMode === 'day'
        ? row.tanggal_penerimaan
        : row.tanggal_penerimaan.slice(0, 7)

    const bucket = buckets.get(key) ?? {
      count: 0,
      qty: 0,
    }

    bucket.count += 1
    bucket.qty += row.total_qty_aktual

    buckets.set(key, bucket)
  }

  const chart = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      key,
      ...value,
    }))

  /* ==========================================================
     GRAFIK 2: QTY AKTUAL PER CUSTOMER
     ========================================================== */

  const customerQtyBuckets = new Map<string, number>()

  for (const row of active) {
    const customer =
      row.customer?.trim() || 'Customer Tidak Diisi'

    customerQtyBuckets.set(
      customer,
      (customerQtyBuckets.get(customer) ?? 0) +
        row.total_qty_aktual,
    )
  }

  const customerQtyChart = Array.from(
    customerQtyBuckets.entries(),
  )
    .sort(([, a], [, b]) => b - a)
    .map(([name, qty]) => ({
      name,
      qty,
    }))

  /* ==========================================================
     GRAFIK 3: JUMLAH RETURN PER CUSTOMER
     ========================================================== */

  const customerReturnBuckets = new Map<string, number>()

  for (const row of active) {
    const customer =
      row.customer?.trim() || 'Customer Tidak Diisi'

    customerReturnBuckets.set(
      customer,
      (customerReturnBuckets.get(customer) ?? 0) + 1,
    )
  }

  const customerChart = Array.from(
    customerReturnBuckets.entries(),
  )
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({
      name,
      count,
    }))

  /* ==========================================================
     RETURN HARI INI BESERTA SELURUH RINCIAN ITEM

     Bagian ini sengaja tidak menggunakan filter periode,
     customer, atau status dari filter Dashboard. Dengan begitu,
     daftar Retur Hari Ini tetap menampilkan transaksi hari ini
     meskipun pengguna sedang melihat periode grafik yang lain.
     Return yang dibatalkan tidak ditampilkan.
     ========================================================== */

  const todayHeaders = await listAllReturnSummaries(supabase, {
    from: today,
    to: today,
  })

  const activeTodayHeaders = todayHeaders.filter(
    (header) => header.status !== 'dibatalkan',
  )

  const todayItemsByHeader = new Map<string, ReturnItem[]>()

  for (
    let headerIndex = 0;
    headerIndex < activeTodayHeaders.length;
    headerIndex += HEADER_ID_GROUP_SIZE
  ) {
    const headerGroup = activeTodayHeaders.slice(
      headerIndex,
      headerIndex + HEADER_ID_GROUP_SIZE,
    )

    const headerIds = headerGroup.map((header) =>
      Number(header.id),
    )

    let itemOffset = 0

    while (true) {
      const { data, error } = await supabase
        .from('return_items')
        .select('*')
        .in('return_header_id', headerIds)
        .order('id', { ascending: true })
        .range(
          itemOffset,
          itemOffset + ITEM_PAGE_SIZE - 1,
        )

      if (error) {
        throw new Error(
          `Gagal mengambil rincian Retur Hari Ini: ${error.message}`,
        )
      }

      const batch: ReturnItem[] = (data ?? []).map(
        (item) =>
          normalizeReturnItem(
            item as unknown as Record<string, unknown>,
          ),
      )

      for (const item of batch) {
        const existing =
          todayItemsByHeader.get(item.return_header_id) ?? []

        existing.push(item)
        todayItemsByHeader.set(item.return_header_id, existing)
      }

      if (batch.length < ITEM_PAGE_SIZE) {
        break
      }

      itemOffset += batch.length
    }
  }

  const recent = activeTodayHeaders.map((header) => ({
    header,
    items: todayItemsByHeader.get(String(header.id)) ?? [],
  }))

  /* ==========================================================
     HASIL DASHBOARD
     ========================================================== */

  return {
    totalReturn: active.length,

    returnToday: active.filter(
      (row) => row.tanggal_penerimaan === today,
    ).length,

    returnMonth: active.filter(
      (row) =>
        Boolean(row.tanggal_penerimaan) &&
        row.tanggal_penerimaan! >= monthStart &&
        row.tanggal_penerimaan! <= today,
    ).length,

    totalItem: active.reduce(
      (sum, row) => sum + row.item_count,
      0,
    ),

    totalQtyAktual: active.reduce(
      (sum, row) => sum + row.total_qty_aktual,
      0,
    ),

    totalSelisih: active.filter(
      (row) => row.selisih_count > 0,
    ).length,

    chart,
    chartMode,
    customerQtyChart,
    customerChart,
    adminProgressChart,
    disposisiChart,
    recent,
  }
}

/* ============================================================
   DATE RANGE
   ============================================================ */

function rangeInDays(
  from: string | undefined,
  to: string | undefined,
  rows: ReturnSummary[],
) {
  const dates = rows
    .map((row) => row.tanggal_penerimaan)
    .filter((date): date is string => Boolean(date))
    .sort()

  const start = from ?? dates[0]
  const end = to ?? dates[dates.length - 1]

  if (!start || !end) {
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
    foto_surat_jalan_signed_url: string | null
    foto_material_signed_url: string | null
  }

  items: ReturnItem[]
}

export async function getReturnDetail(
  id: string,
): Promise<ReturnDetail | null> {
  const headerId = Number(id)

  if (
    !Number.isSafeInteger(headerId) ||
    headerId <= 0
  ) {
    throw new Error(`ID Return tidak valid: ${id}`)
  }

  const supabase = await createClient()

  /* Ambil Header */

  const { data: header, error: headerError } =
    await supabase
      .from('return_headers')
      .select('*')
      .eq('id', headerId)
      .maybeSingle()

  if (headerError) {
    throw new Error(headerError.message)
  }

  if (!header) {
    return null
  }

  /* Signed URL foto */

  const createPhotoSignedUrl = async (
    path: string | null,
  ): Promise<string | null> => {
    if (!path) return null

    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(path, 60 * 60)

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
    createPhotoSignedUrl(header.foto_surat_jalan_url),
    createPhotoSignedUrl(header.foto_material_url),
  ])

  /* Ambil Item */

  const { data: items, error: itemsError } =
    await supabase
      .from('return_items')
      .select('*')
      .eq('return_header_id', header.id)
      .order('id', { ascending: true })

  if (itemsError) {
    throw new Error(itemsError.message)
  }

  /* Normalisasi Item */

  const normalizedItems: ReturnItem[] = (items ?? []).map(
    (item) =>
      normalizeReturnItem(
        item as unknown as Record<string, unknown>,
      ),
  )

  return {
    header: {
      ...(header as ReturnHeader),
      created_by_name: null,
      foto_surat_jalan_signed_url: fotoSuratJalanSignedUrl,
      foto_material_signed_url: fotoMaterialSignedUrl,
    },

    items: normalizedItems,
  }
}