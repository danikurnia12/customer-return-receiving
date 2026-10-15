import { createClient } from '@/lib/supabase/client'
import { PHOTO_BUCKET } from '@/lib/supabase/config'
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE } from '@/lib/validation'

export type PhotoKind = 'material' | 'surat-jalan'

export function validatePhoto(file: File): string | null {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return 'Format foto harus JPG, PNG, atau WEBP'
  if (file.size > MAX_PHOTO_SIZE) return 'Ukuran foto maksimal 5 MB'
  return null
}

/** Upload ke Supabase Storage, mengembalikan path object (bukan binary). */
export async function uploadReturnPhoto(file: File, kind: PhotoKind) {
  const invalid = validatePhoto(file)
  if (invalid) throw new Error(invalid)

  const supabase = createClient()
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const now = new Date()
  const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${kind}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(`Gagal upload foto: ${error.message}`)
  return path
}

/**
 * Menghapus foto yang diunggah dari form Return baru.
 */
export async function deleteReturnPhoto(path: string) {
  const safePath = path.trim()

  if (
    !safePath ||
    safePath.startsWith('/') ||
    safePath.split('/').includes('..')
  ) {
    throw new Error('Path foto tidak valid.')
  }

  const supabase = createClient()

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([safePath])

  if (error) {
    throw new Error(`Gagal menghapus foto: ${error.message}`)
  }
}
