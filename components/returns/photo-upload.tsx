'use client'

import { useId, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { uploadReturnPhoto, validatePhoto, type PhotoKind } from '@/lib/storage'

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

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const invalid = validatePhoto(file)
    if (invalid) {
      toast.error(invalid)
      return
    }
    setUploading(true)
    try {
      const uploadedPath = await uploadReturnPhoto(file, kind)
      onChange(uploadedPath, URL.createObjectURL(file))
      toast.success(`${label} berhasil diupload`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
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
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={uploading}
      />
      {path && preview ? (
        <div className="relative overflow-hidden rounded-md border bg-muted">
          <img src={preview} alt={`Preview ${label}`} className="aspect-video w-full object-cover" />
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            className="absolute top-2 right-2"
            aria-label={`Hapus ${label}`}
            onClick={() => onChange(null, null)}
          >
            <X />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          <span>{uploading ? 'Mengupload...' : 'Pilih / ambil foto'}</span>
          <span className="text-xs">JPG, PNG, WEBP maks 5 MB</span>
        </button>
      )}
    </div>
  )
}
