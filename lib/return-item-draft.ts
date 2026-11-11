export interface ItemDraft {
  diameter: string
  tebal: string
  panjang: string
  batch: string
  no_box: string
  qty_surat_jalan: string
  qty_aktual_diterima: string
  kondisi_material: string
  sloc: string
}

export const EMPTY_ITEM: ItemDraft = {
  diameter: '',
  tebal: '',
  panjang: '',
  batch: '',
  no_box: '',
  qty_surat_jalan: '',
  qty_aktual_diterima: '',
  kondisi_material: '',
  sloc: '',
}

export function draftToInput(draft: ItemDraft) {
  return {
    diameter: draft.diameter,
    tebal: draft.tebal,
    panjang: draft.panjang,
    batch: draft.batch,
    no_box: draft.no_box,
    qty_surat_jalan: draft.qty_surat_jalan,
    qty_aktual_diterima: draft.qty_aktual_diterima,
    kondisi_material: draft.kondisi_material,
    sloc: draft.sloc,
  }
}