import { createClient } from '@/lib/supabase/client'
import { PHOTO_BUCKET } from '@/lib/supabase/config'
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE } from '@/lib/validation'

export type PhotoKind = 'material' | 'surat-jalan'

const MAX_PHOTO_DIMENSION = 2200
const JPEG_QUALITY = 0.84

export function validatePhoto(file: File): string | null {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return 'Format foto harus JPG, PNG, atau WEBP'
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return 'Ukuran foto maksimal 5 MB'
  }

  return null
}

type LoadedPhoto = {
  source: CanvasImageSource
  width: number
  height: number
  dispose: () => void
}

async function loadPhoto(file: File): Promise<LoadedPhoto> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      }
    } catch {
      // Gunakan fallback Image jika browser gagal membuat ImageBitmap.
    }
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = new Image()

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(
        new Error('Foto tidak dapat dibaca. Silakan pilih foto lain.'),
      )
      image.src = objectUrl
    })

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('Dimensi foto tidak valid.')
    }

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(objectUrl),
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

/**
 * Kompres foto di browser sebelum upload.
 *
 * - Resolusi maksimum 2200 px pada sisi terpanjang.
 * - JPEG kualitas 84% untuk keseimbangan ukuran dan keterbacaan.
 * - Jika hasil JPEG justru lebih besar dari file sumber, file sumber
 *   dipertahankan agar ukuran tidak bertambah dan kualitas tidak turun.
 * - Foto sumber tetap dibatasi maksimal 5 MB.
 */
export async function compressReturnPhoto(file: File): Promise<File> {
  const invalid = validatePhoto(file)

  if (invalid) {
    throw new Error(invalid)
  }

  if (typeof window === 'undefined') {
    throw new Error('Kompresi foto hanya dapat dilakukan di browser.')
  }

  const loaded = await loadPhoto(file)
  const canvas = document.createElement('canvas')

  try {
    const longestSide = Math.max(loaded.width, loaded.height)
    const scale = Math.min(1, MAX_PHOTO_DIMENSION / longestSide)

    const width = Math.max(1, Math.round(loaded.width * scale))
    const height = Math.max(1, Math.round(loaded.height * scale))

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', { alpha: false })

    if (!context) {
      throw new Error('Browser tidak mendukung proses kompresi foto.')
    }

    // Latar putih mencegah area transparan PNG berubah menjadi hitam.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(loaded.source, 0, 0, width, height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error('Kompresi foto gagal. Silakan coba foto lain.'))
            return
          }

          resolve(result)
        },
        'image/jpeg',
        JPEG_QUALITY,
      )
    })

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'return-photo'
    const compressedFile = new File(
      [blob],
      `${baseName}.jpg`,
      {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      },
    )

    // Jangan mengganti file dengan hasil yang justru lebih besar.
    if (compressedFile.size >= file.size) {
      return file
    }

    if (compressedFile.size > MAX_PHOTO_SIZE) {
      throw new Error(
        'Ukuran foto setelah kompresi masih melebihi 5 MB. Silakan gunakan foto dengan resolusi lebih rendah.',
      )
    }

    return compressedFile
  } finally {
    loaded.dispose()
    canvas.width = 0
    canvas.height = 0
  }
}

/**
 * Upload ke Supabase Storage dan mengembalikan path object,
 * bukan binary atau URL bertoken.
 *
 * Secara default fungsi ini mengompres foto. Parameter
 * alreadyCompressed hanya digunakan oleh PhotoUpload agar foto
 * tidak dikompres dua kali.
 */
export async function uploadReturnPhoto(
  file: File,
  kind: PhotoKind,
  alreadyCompressed = false,
) {
  const invalid = validatePhoto(file)

  if (invalid) {
    throw new Error(invalid)
  }

  const uploadFile = alreadyCompressed
    ? file
    : await compressReturnPhoto(file)

  const uploadInvalid = validatePhoto(uploadFile)

  if (uploadInvalid) {
    throw new Error(uploadInvalid)
  }

  const supabase = createClient()
  const ext =
    uploadFile.type === 'image/png'
      ? 'png'
      : uploadFile.type === 'image/webp'
        ? 'webp'
        : 'jpg'

  const now = new Date()
  const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${kind}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, uploadFile, {
      contentType: uploadFile.type,
      upsert: false,
    })

  if (error) {
    throw new Error(`Gagal upload foto: ${error.message}`)
  }

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