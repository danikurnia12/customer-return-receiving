
import { createClient } from '@/lib/supabase/server'

export type InspectionMonitoringLine = {
  id: number
  return_header_id: number
  diameter: number | null
  tebal: number | null
  panjang: number | null
  qty_aktual: number
  batch: string | null
  no_box: string | null
  location: string | null
}

export type InspectionMonitoringItem = {
  id: number
  no_return: string
  tanggal_penerimaan: string | null
  customer: string | null
  no_claim: string | null
  no_claim_2: string | null
  no_claim_3: string | null
  no_claim_4: string | null
  no_ncr: string | null
  disposisi: string | null
  status: string | null
  created_at: string
  updated_at: string | null
  items: InspectionMonitoringLine[]
}

/**
 * Monitoring per transaksi Return.
 * Ukuran material diambil dari return_items dan dikelompokkan
 * berdasarkan return_header_id.
 */
export async function listInspectionMonitoring(): Promise<
  InspectionMonitoringItem[]
> {
  const supabase = await createClient()

  const { data: headerData, error: headerError } = await supabase
    .from('return_headers')
    .select(`
      id,
      no_return,
      tanggal_penerimaan,
      customer,
      no_claim,
      no_claim_2,
      no_claim_3,
      no_claim_4,
      no_ncr,
      disposisi,
      status,
      created_at,
      updated_at
    `)
    .neq('status', 'dibatalkan')
    .order('tanggal_penerimaan', { ascending: false })
    .order('created_at', { ascending: false })

  if (headerError) {
    console.error('[listInspectionMonitoring] headers:', headerError)
    throw new Error('Gagal mengambil data monitoring Return.')
  }

  const headers = (headerData ?? []) as unknown as Omit<
    InspectionMonitoringItem,
    'items'
  >[]

  if (headers.length === 0) {
    return []
  }

  const returnIds = headers.map((header) => header.id)

  const { data: itemData, error: itemError } = await supabase
    .from('return_items')
    .select(`
      id,
      return_header_id,
      diameter,
      tebal,
      panjang,
      qty_aktual,
      batch,
      no_box,
      location
    `)
    .in('return_header_id', returnIds)
    .order('id', { ascending: true })

  if (itemError) {
    console.error('[listInspectionMonitoring] items:', itemError)
    throw new Error('Gagal mengambil ukuran item Return.')
  }

  const itemRows = (itemData ?? []) as unknown as InspectionMonitoringLine[]

  const itemsByReturn = new Map<number, InspectionMonitoringLine[]>()

  for (const item of itemRows) {
    const existing = itemsByReturn.get(item.return_header_id) ?? []
    existing.push(item)
    itemsByReturn.set(item.return_header_id, existing)
  }

  return headers.map((header) => ({
    ...header,
    items: itemsByReturn.get(header.id) ?? [],
  }))
}

/* -------------------------------------------------------------------------- */
/* Kompatibilitas halaman detail inspeksi lama                                */
/* -------------------------------------------------------------------------- */

export type InspectionQueueItem = {
  id: number
  return_header_id: number
  no_return: string
  tanggal_penerimaan: string | null
  no_sppb: string | null
  no_claim: string | null
  customer: string | null
  diameter: number | null
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

/** Fungsi lama dipertahankan untuk kompatibilitas route detail. */
export async function listInspectionQueue(): Promise<
  InspectionQueueItem[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('return_items')
    .select(`
      id,
      return_header_id,
      no_return,
      tanggal_penerimaan,
      no_sppb,
      no_claim,
      customer,
      diameter,
      tebal,
      panjang,
      batch,
      no_box,
      qty_aktual,
      qty_surat_jalan,
      kondisi_material,
      location,
      no_ncr,
      disposisi,
      pic,
      status,
      tindakan,
      target,
      progres,
      created_at,
      updated_at
    `)
    .eq('status', 'Open')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[listInspectionQueue]', error)
    throw new Error('Gagal mengambil antrean inspeksi.')
  }

  return (data ?? []) as unknown as InspectionQueueItem[]
}

export async function getInspectionItem(
  itemId: string,
): Promise<InspectionQueueItem> {
  const supabase = await createClient()
  const numericId = Number(itemId)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('ID item inspeksi tidak valid.')
  }

  const { data, error } = await supabase
    .from('return_items')
    .select(`
      id,
      return_header_id,
      no_return,
      tanggal_penerimaan,
      no_sppb,
      no_claim,
      customer,
      diameter,
      tebal,
      panjang,
      batch,
      no_box,
      qty_aktual,
      qty_surat_jalan,
      kondisi_material,
      location,
      no_ncr,
      disposisi,
      pic,
      status,
      tindakan,
      target,
      progres,
      created_at,
      updated_at
    `)
    .eq('id', numericId)
    .maybeSingle()

  if (error) {
    console.error('[getInspectionItem]', error)
    throw new Error('Gagal mengambil data inspeksi.')
  }

  if (!data) {
    throw new Error('Data material inspeksi tidak ditemukan.')
  }

  return data as unknown as InspectionQueueItem
}