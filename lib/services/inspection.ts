import { createClient } from '@/lib/supabase/server'

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

export async function listInspectionQueue() {
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

  return (data ?? []) as InspectionQueueItem[]
}

export async function getInspectionItem(itemId: string) {
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

  return data as InspectionQueueItem
}