import { z } from 'zod'

export const KONDISI_OPTIONS = [
  'Dent',
  'Scratch',
  'karat',
  'Bending/After Proses',
  'Penyok/Bengkok',
  'Crack',
  'Oval',
  'Kotor / Noda',
  'Ukuran Tidak Sesuai',
  'Lainnya',
] as const

export const DIAMETER_PATTERN =
  /^(\d+(?:[.,]\d+)?|\d+\/\d+|\d+-\d+\/\d+)\s*(?:"|inch|in|mm)?$/i

function numeric(label: string) {
  return z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined

      if (typeof v === 'string') {
        return Number(v.replace(',', '.'))
      }

      return v
    },
    z.number({
      error: `${label} wajib diisi dan berupa angka`,
    }),
  )
}

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter`)
    .optional()
    .transform((v) => v ?? '')

/* ============================================================
   RETURN ITEM
   ============================================================ */

export const returnItemSchema = z.object({
  diameter: z
    .string()
    .trim()
    .min(1, 'Diameter wajib diisi')
    .max(20, 'Diameter maksimal 20 karakter')
    .regex(
      DIAMETER_PATTERN,
      'Format diameter tidak valid. Contoh: 2", 1-1/2", 60.5mm',
    ),

  tebal: numeric('Tebal').pipe(
    z
      .number()
      .positive('Tebal harus lebih dari 0')
      .max(100, 'Tebal maksimal 100 mm'),
  ),

  panjang: numeric('Panjang').pipe(
    z
      .number()
      .positive('Panjang harus lebih dari 0')
      .max(20000, 'Panjang maksimal 20.000 mm'),
  ),

  batch: optionalText(50, 'Batch'),

  no_box: optionalText(50, 'No Box'),

  qty_surat_jalan: numeric('Qty Surat Jalan').pipe(
    z
      .number()
      .int('Qty Surat Jalan harus bilangan bulat')
      .min(0, 'Qty Surat Jalan tidak boleh negatif')
      .max(1_000_000, 'Qty Surat Jalan terlalu besar'),
  ),

  qty_aktual_diterima: numeric('Qty Aktual').pipe(
    z
      .number()
      .int('Qty Aktual harus bilangan bulat')
      .min(0, 'Qty Aktual tidak boleh negatif')
      .max(1_000_000, 'Qty Aktual terlalu besar'),
  ),

  kondisi_material: z
    .string()
    .trim()
    .min(1, 'Kondisi material wajib dipilih')
    .max(60, 'Kondisi material maksimal 60 karakter'),

  sloc: optionalText(30, 'Lokasi / SLOC'),
})

/* ============================================================
   RETURN HEADER
   ============================================================ */

export const returnHeaderSchema = z.object({
  no_return: z
    .string()
    .trim()
    .min(1, 'No Return wajib diisi')
    .max(50, 'No Return maksimal 50 karakter')
    .optional(),

  tanggal_penerimaan: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Tanggal penerimaan wajib diisi',
    ),

  no_sppb: z
    .string()
    .trim()
    .min(1, 'No SPPB / Surat Jalan wajib diisi')
    .max(50, 'No Surat Jalan maksimal 50 karakter'),

  no_claim: optionalText(50, 'No Claim'),

  customer: z
    .string()
    .trim()
    .min(1, 'Customer wajib diisi')
    .max(120, 'Customer maksimal 120 karakter'),

  pic_penerima: optionalText(80, 'PIC Penerima'),

  catatan: optionalText(1000, 'Catatan'),

  foto_surat_jalan_url: z
    .string()
    .max(500, 'URL foto surat jalan maksimal 500 karakter')
    .nullable()
    .optional(),

  foto_material_url: z
    .string()
    .max(500, 'URL foto material maksimal 500 karakter')
    .nullable()
    .optional(),
})

/* ============================================================
   CREATE RETURN
   ============================================================ */

export const createReturnSchema = returnHeaderSchema.extend({
  items: z
    .array(returnItemSchema)
    .min(1, 'Minimal 1 Return Item')
    .max(200, 'Maksimal 200 item'),
})

/* ============================================================
   TYPES
   ============================================================ */

export type ReturnItemInput =
  z.input<typeof returnItemSchema>

export type ReturnItemValues =
  z.output<typeof returnItemSchema>

export type ReturnHeaderInput =
  z.input<typeof returnHeaderSchema>

export type ReturnHeaderValues =
  z.output<typeof returnHeaderSchema>

export type CreateReturnInput =
  z.input<typeof createReturnSchema>

/* ============================================================
   ERROR HELPER
   ============================================================ */

export function flattenErrors(error: z.ZodError) {
  const result: Record<string, string> = {}

  for (const issue of error.issues) {
    const key = issue.path.join('.')

    if (!result[key]) {
      result[key] = issue.message
    }
  }

  return result
}

/* ============================================================
   PHOTO VALIDATION
   ============================================================ */

export const MAX_PHOTO_SIZE =
  5 * 1024 * 1024

export const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]