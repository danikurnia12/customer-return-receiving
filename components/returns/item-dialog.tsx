'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { QtyDiff } from '@/components/app/badges'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  flattenErrors,
  KONDISI_OPTIONS,
  returnItemSchema,
} from '@/lib/validation'

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

export function draftToInput(d: ItemDraft) {
  return {
    diameter: d.diameter,
    tebal: d.tebal,
    panjang: d.panjang,
    batch: d.batch,
    no_box: d.no_box,
    qty_surat_jalan: d.qty_surat_jalan,
    qty_aktual_diterima: d.qty_aktual_diterima,
    kondisi_material: d.kondisi_material,
    sloc: d.sloc,
  }
}

interface ItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: ItemDraft
  title: string
  onSave: (draft: ItemDraft) => void
}

export function ItemDialog({
  open,
  onOpenChange,
  initial,
  title,
  onSave,
}: ItemDialogProps) {
  const [draft, setDraft] =
    useState<ItemDraft>(initial)

  const [errors, setErrors] =
    useState<Record<string, string>>({})

  const [saving, setSaving] =
    useState(false)

  const resetFromInitial = () => {
    setDraft(initial)
    setErrors({})
  }

  const handleOpenChange = (
    nextOpen: boolean,
  ) => {
    if (!nextOpen) {
      resetFromInitial()
    }

    onOpenChange(nextOpen)
  }

  const setField = (
    key: keyof ItemDraft,
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))

    if (errors[key]) {
      setErrors((current) => ({
        ...current,
        [key]: '',
      }))
    }
  }

  const handleSave = async () => {
    if (saving) return

    const parsed =
      returnItemSchema.safeParse(draft)

    if (!parsed.success) {
      setErrors(
        flattenErrors(parsed.error),
      )

      return
    }

    setSaving(true)

    try {
      onSave(draft)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {title}
          </DialogTitle>

          <DialogDescription>
            Masukkan detail material yang diterima.
            Foto dokumentasi penerimaan diisi pada
            bagian Header Return.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">

          {/* ==================================================
              IDENTITAS MATERIAL
              ================================================== */}

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold">
              Identitas Material
            </legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* DIAMETER */}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-diameter">
                  Diameter
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  id="item-diameter"
                  value={draft.diameter}
                  onChange={(event) =>
                    setField(
                      'diameter',
                      event.target.value,
                    )
                  }
                  placeholder={'Contoh: 2"'}
                  aria-invalid={Boolean(
                    errors.diameter,
                  )}
                />

                {errors.diameter && (
                  <p className="text-xs text-destructive">
                    {errors.diameter}
                  </p>
                )}
              </div>

              {/* TEBAL */}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-tebal">
                  Tebal
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  id="item-tebal"
                  type="number"
                  step="any"
                  min="0"
                  value={draft.tebal}
                  onChange={(event) =>
                    setField(
                      'tebal',
                      event.target.value,
                    )
                  }
                  placeholder="Contoh: 1.2"
                  aria-invalid={Boolean(
                    errors.tebal,
                  )}
                />

                {errors.tebal && (
                  <p className="text-xs text-destructive">
                    {errors.tebal}
                  </p>
                )}
              </div>

              {/* PANJANG */}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-panjang">
                  Panjang
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  id="item-panjang"
                  type="number"
                  step="any"
                  min="0"
                  value={draft.panjang}
                  onChange={(event) =>
                    setField(
                      'panjang',
                      event.target.value,
                    )
                  }
                  placeholder="Contoh: 6000"
                  aria-invalid={Boolean(
                    errors.panjang,
                  )}
                />

                {errors.panjang && (
                  <p className="text-xs text-destructive">
                    {errors.panjang}
                  </p>
                )}
              </div>

              {/* BATCH */}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-batch">
                  Batch
                </Label>

                <Input
                  id="item-batch"
                  value={draft.batch}
                  onChange={(event) =>
                    setField(
                      'batch',
                      event.target.value,
                    )
                  }
                  placeholder="Opsional"
                  maxLength={50}
                />

                {errors.batch && (
                  <p className="text-xs text-destructive">
                    {errors.batch}
                  </p>
                )}
              </div>

              {/* NO BOX */}

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="item-no-box">
                  No Box
                </Label>

                <Input
                  id="item-no-box"
                  value={draft.no_box}
                  onChange={(event) =>
                    setField(
                      'no_box',
                      event.target.value,
                    )
                  }
                  placeholder="Opsional"
                  maxLength={50}
                />

                {errors.no_box && (
                  <p className="text-xs text-destructive">
                    {errors.no_box}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          {/* ==================================================
              QUANTITY
              ================================================== */}

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold">
              Quantity
            </legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* QTY SURAT JALAN */}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-qty-sj">
                  Qty Surat Jalan
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  id="item-qty-sj"
                  type="number"
                  step="1"
                  min="0"
                  value={
                    draft.qty_surat_jalan
                  }
                  onChange={(event) =>
                    setField(
                      'qty_surat_jalan',
                      event.target.value,
                    )
                  }
                  aria-invalid={Boolean(
                    errors.qty_surat_jalan,
                  )}
                />

                {errors.qty_surat_jalan && (
                  <p className="text-xs text-destructive">
                    {
                      errors.qty_surat_jalan
                    }
                  </p>
                )}
              </div>

              {/* QTY AKTUAL */}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-qty-aktual">
                  Qty Aktual Diterima
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </Label>

                <Input
                  id="item-qty-aktual"
                  type="number"
                  step="1"
                  min="0"
                  value={
                    draft.qty_aktual_diterima
                  }
                  onChange={(event) =>
                    setField(
                      'qty_aktual_diterima',
                      event.target.value,
                    )
                  }
                  aria-invalid={Boolean(
                    errors.qty_aktual_diterima,
                  )}
                />

                {errors.qty_aktual_diterima && (
                  <p className="text-xs text-destructive">
                    {
                      errors.qty_aktual_diterima
                    }
                  </p>
                )}

                <QtyDiff
                  qtySj={Number(
                    draft.qty_surat_jalan || 0,
                  )}
                  qtyAktual={Number(
                    draft.qty_aktual_diterima || 0,
                  )}
                />
              </div>
            </div>
          </fieldset>

          {/* ==================================================
              KONDISI & LOKASI
              ================================================== */}

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-semibold">
              Kondisi & Lokasi
            </legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* KONDISI MATERIAL */}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-kondisi">
                  Kondisi Material
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </Label>

                <Select
                  value={
                    draft.kondisi_material
                  }
                  onValueChange={(value) =>
                    setField(
                      'kondisi_material',
                      value ?? '',
                    )
                  }
                >
                  <SelectTrigger
                    id="item-kondisi"
                    aria-invalid={Boolean(
                      errors.kondisi_material,
                    )}
                  >
                    <SelectValue placeholder="Pilih kondisi material" />
                  </SelectTrigger>

                  <SelectContent>
                    {KONDISI_OPTIONS.map(
                      (option) => (
                        <SelectItem
                          key={option}
                          value={option ?? ''}
                        >
                          {option}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                {errors.kondisi_material && (
                  <p className="text-xs text-destructive">
                    {
                      errors.kondisi_material
                    }
                  </p>
                )}
              </div>

              {/* SLOC */}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-sloc">
                  Lokasi / SLOC
                </Label>

                <Input
                  id="item-sloc"
                  value={draft.sloc}
                  onChange={(event) =>
                    setField(
                      'sloc',
                      event.target.value,
                    )
                  }
                  placeholder="Contoh: 1310"
                  maxLength={30}
                />

                {errors.sloc && (
                  <p className="text-xs text-destructive">
                    {errors.sloc}
                  </p>
                )}
              </div>
            </div>
          </fieldset>
        </div>

        {/* ==================================================
            FOOTER
            ================================================== */}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              handleOpenChange(false)
            }
            disabled={saving}
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Item'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}