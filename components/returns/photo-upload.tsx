'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import {
  compressReturnPhoto,
  uploadReturnPhoto,
  deleteReturnPhoto,
  validatePhoto,
  type PhotoKind,
} from '@/lib/storage'

export function PhotoUpload({
  label,
  kind,
  path,
  preview,
  onChange,
}: {
  label: string
  kind: PhotoKind
  path: string | null
  preview: string | null
  onChange: (path: string | null, preview: string | null) => void
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Bersihkan object URL ketika preview diganti atau komponen dilepas.
  useEffect(() => {
    if (!preview?.startsWith('blob:')) return

    const currentPreview = preview

    return () => {
      URL.revokeObjectURL(currentPreview)
    }
  }, [preview])

  const handleFile = async (file: File | undefined) => {
    if (!file) return

    const invalid = validatePhoto(file)

    if (invalid) {
      toast.error(invalid)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setUploading(true)

    try {
      // Kompres satu kali, lalu gunakan hasil yang sama untuk upload dan preview.
      const compressedFile = await compressReturnPhoto(file)
      const uploadedPath = await uploadReturnPhoto(
        compressedFile,
        kind,
        true,
      )
      const compressedPreview = URL.createObjectURL(compressedFile)

      onChange(uploadedPath, compressedPreview)
      toast.success(`${label} berhasil dikompres dan diupload`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Gagal mengupload ${label.toLowerCase()}`,
      )
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (!path || uploading || deleting) return

    setDeleting(true)

    try {
      await deleteReturnPhoto(path)
      onChange(null, null)
      toast.success(`${label} berhasil dihapus`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Gagal menghapus ${label.toLowerCase()}`,
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
        disabled={uploading}
      />

      {path && preview ? (
        <div className="relative overflow-hidden rounded-md border bg-muted">
          <img
            src={preview}
            alt={`Preview ${label}`}
            className="aspect-video w-full object-cover"
          />

          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            className="absolute right-2 top-2"
            aria-label={`Hapus ${label}`}
            onClick={handleRemove}
            disabled={uploading || deleting}
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <X />
            )}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}

          <span>
            {uploading ? 'Mengompres dan mengupload...' : 'Pilih / ambil foto'}
          </span>

          <span className="text-xs">
            JPG, PNG, WEBP maks 5 MB • kompres otomatis
          </span>
        </button>
      )}
    </div>
  )
}