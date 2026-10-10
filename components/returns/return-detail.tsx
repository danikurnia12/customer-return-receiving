
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  ClipboardList,
  FileText,
  Loader2,
  Pencil,
  Plus,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  addReturnItemAction,
  cancelReturnAction,
  deleteReturnItemAction,
  updateReturnHeaderAction,
  updateReturnItemAction,
} from '@/app/actions/returns'

import { StatusBadge } from '@/components/app/badges'

import {
  EMPTY_ITEM,
  ItemDialog,
  draftToInput,
  type ItemDraft,
} from '@/components/returns/item-dialog'

import { ItemsTable } from '@/components/returns/items-table'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { Button } from '@/components/ui/button'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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
import { Textarea } from '@/components/ui/textarea'

import {
  formatDate,
  formatDateTime,
} from '@/lib/format'

import type { ReturnDetail } from '@/lib/services/returns'

import {
  flattenErrors,
  returnHeaderSchema,
} from '@/lib/validation'

export function ReturnDetailView({
  detail,
  canEdit,
}: {
  detail: ReturnDetail
  canEdit: boolean
}) {
  const router = useRouter()

  const { header, items } = detail

  const [selectedPhoto, setSelectedPhoto] =
    useState<{
      url: string
      label: string
    } | null>(null)

  const editable =
    canEdit &&
    header.status !== 'dibatalkan'

  const [itemDialog, setItemDialog] =
    useState<{
      open: boolean
      id: string | null
    }>({
      open: false,
      id: null,
    })

  const [headerOpen, setHeaderOpen] =
    useState(false)

  const [deleteId, setDeleteId] =
    useState<string | null>(null)

  const [cancelOpen, setCancelOpen] =
    useState(false)

  const [reason, setReason] =
    useState('')

  const [busy, setBusy] =
    useState(false)

  const editingItem =
    itemDialog.id
      ? items.find(
          (i) => i.id === itemDialog.id,
        )
      : null

  /*
   * ReturnItem -> ItemDraft
   *
   * Database:
   * qty_aktual
   * location
   *
   * Form:
   * qty_aktual_diterima
   * sloc
   */
  const initialDraft: ItemDraft =
    editingItem
      ? {
          diameter:
            editingItem.diameter ?? '',

          tebal:
            editingItem.tebal === null
              ? ''
              : String(editingItem.tebal),

          panjang:
            editingItem.panjang === null
              ? ''
              : String(editingItem.panjang),

          batch:
            editingItem.batch ?? '',

          no_box:
            editingItem.no_box ?? '',

          qty_surat_jalan:
            String(editingItem.qty_surat_jalan),

          qty_aktual_diterima:
            String(editingItem.qty_aktual),

          kondisi_material:
            editingItem.kondisi_material ?? '',

          sloc:
            editingItem.location ?? '',
        }
      : EMPTY_ITEM

  const saveItem = async (
    draft: ItemDraft,
  ) => {
    const res = itemDialog.id
      ? await updateReturnItemAction(
          itemDialog.id,
          draftToInput(draft),
          '',
        )
      : await addReturnItemAction(
          header.id,
          draftToInput(draft),
        )

    if (!res.ok) {
      toast.error(res.error)
      return res.fieldErrors
    }

    toast.success(
      itemDialog.id
        ? 'Item diperbarui'
        : 'Item ditambahkan',
    )

    setItemDialog({
      open: false,
      id: null,
    })

    router.refresh()
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    setBusy(true)

    const res =
      await deleteReturnItemAction(deleteId)

    setBusy(false)

    if (!res.ok) {
      return toast.error(res.error)
    }

    toast.success('Item dihapus')

    setDeleteId(null)

    router.refresh()
  }

  const confirmCancel = async () => {
    if (!reason.trim()) {
      return toast.error(
        'Alasan pembatalan wajib diisi',
      )
    }

    setBusy(true)

    const res =
      await cancelReturnAction(
        header.id,
        reason,
      )

    setBusy(false)

    if (!res.ok) {
      return toast.error(res.error)
    }

    toast.success('Return dibatalkan')

    setCancelOpen(false)
    setReason('')

    router.refresh()
  }

  const info = [
    {
      label: 'Tanggal Penerimaan',
      value: formatDate(
        header.tanggal_penerimaan,
      ),
      icon: CalendarDays,
    },
    {
      label: 'No SPPB / Surat Jalan',
      value: header.no_sppb ?? '-',
      mono: true,
      icon: FileText,
    },
    {
      label: 'No Claim',
      value: header.no_claim ?? '-',
      mono: true,
      icon: ClipboardList,
    },
    {
      label: 'Customer',
      value: header.customer ?? '-',
      icon: UserRound,
    },
    {
      label: 'PIC Penerima',
      value: header.pic_penerima ?? '-',
      icon: UserRound,
    },
    {
      label: 'Dibuat oleh',
      value: `${header.created_by_name ?? '-'} · ${formatDateTime(
        header.created_at,
      )}`,
      icon: UserRound,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-foreground" />

        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <ClipboardList className="size-3.5" />
                Return Receiving
              </div>

              <StatusBadge status={header.status} />
            </div>

            <div>
              <h1 className="break-all font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {header.no_return}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Detail penerimaan return customer dan material
              </p>
            </div>
          </div>

          {editable && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setHeaderOpen(true)}
                className="gap-2"
              >
                <Pencil className="size-4" />
                Edit Header
              </Button>

              <Button
                variant="outline"
                onClick={() => setCancelOpen(true)}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Ban className="size-4" />
                Batalkan
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          INFORMASI RETURN
          ====================================================== */}

      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FileText className="size-5" />
            </div>

            <div>
              <CardTitle>Informasi Return</CardTitle>
              <CardDescription>
                Informasi utama penerimaan return customer
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {info.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="size-4 text-primary" />

                    <dt className="text-xs font-medium text-muted-foreground">
                      {item.label}
                    </dt>
                  </div>

                  <dd
                    className={
                      item.mono
                        ? 'break-all font-mono text-sm font-semibold'
                        : 'break-words text-sm font-semibold'
                    }
                  >
                    {item.value}
                  </dd>
                </div>
              )
            })}
          </dl>

          {header.catatan && (
            <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
              <div className="mb-1 flex items-center gap-2">
                <ClipboardList className="size-4 text-primary" />

                <span className="text-xs font-semibold text-muted-foreground">
                  Catatan
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6">
                {header.catatan}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ======================================================
          DOKUMENTASI FOTO RETURN
          ====================================================== */}

      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FileText className="size-5" />
            </div>

            <div>
              <CardTitle>Dokumentasi Foto</CardTitle>
              <CardDescription>
                Bukti penerimaan surat jalan dan kondisi aktual
                material Return.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              {
                label: 'Foto Surat Jalan',
                url: header.foto_surat_jalan_signed_url,
              },
              {
                label: 'Foto Aktual Material',
                url: header.foto_material_signed_url,
              },
            ].map((photo) => (
              <div
                key={photo.label}
                className="space-y-3"
              >
                <p className="text-sm font-semibold">
                  {photo.label}
                </p>

                {photo.url ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPhoto({
                        url: photo.url!,
                        label: photo.label,
                      })
                    }
                    className="block w-full overflow-hidden rounded-xl border border-border bg-muted/20 text-left transition-colors hover:bg-muted/40"
                    aria-label={`Perbesar ${photo.label}`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="aspect-video w-full object-contain"
                    />

                    <div className="border-t border-border px-3 py-2">
                      <p className="text-xs text-muted-foreground">
                        Klik untuk memperbesar foto
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center">
                    <FileText className="size-8 text-muted-foreground" />

                    <p className="text-sm font-medium text-muted-foreground">
                      Foto belum tersedia
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Belum ada foto yang tersimpan atau foto tidak
                      dapat diakses.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ======================================================
          PREVIEW FOTO
          ====================================================== */}

      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPhoto(null)
          }
        }}
      >
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPhoto?.label ?? 'Dokumentasi Foto'}
            </DialogTitle>

            <DialogDescription>
              Dokumentasi penerimaan material Return.
            </DialogDescription>
          </DialogHeader>

          {selectedPhoto && (
            <div className="flex min-h-40 max-h-[72dvh] items-center justify-center overflow-auto rounded-xl border border-border bg-muted/20 p-2">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.label}
                className="max-h-[68dvh] w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================
          MATERIAL ITEMS
          ====================================================== */}

      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
                <ClipboardList className="size-5" />
              </div>

              <div>
                <CardTitle>Material Items</CardTitle>

                <CardDescription>
                  Seluruh item dalam return{' '}
                  <span className="font-mono font-medium">
                    {header.no_return}
                  </span>
                </CardDescription>
              </div>
            </div>

            {editable && (
              <Button
                onClick={() =>
                  setItemDialog({
                    open: true,
                    id: null,
                  })
                }
                className="gap-2"
              >
                <Plus className="size-4" />
                Tambah Item
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ItemsTable
            rows={items.map((i) => ({
              key: i.id,
              diameter: i.diameter ?? '',
              tebal: i.tebal ?? '',
              panjang: i.panjang ?? '',
              batch: i.batch,
              no_box: i.no_box,
              qty_surat_jalan: i.qty_surat_jalan,
              qty_aktual_diterima: i.qty_aktual,
              kondisi_material: i.kondisi_material ?? '',
              sloc: i.location,
            }))}
            onEdit={
              editable
                ? (id) =>
                    setItemDialog({
                      open: true,
                      id,
                    })
                : undefined
            }
            onDelete={
              editable && items.length > 1
                ? setDeleteId
                : undefined
            }
          />
        </CardContent>
      </Card>

      {/* ======================================================
          ITEM DIALOG
          ====================================================== */}

      <ItemDialog
        open={itemDialog.open}
        onOpenChange={(open) =>
          setItemDialog((d) => ({
            open,
            id: open ? d.id : null,
          }))
        }
        initial={initialDraft}
        title={editingItem ? 'Edit Item' : 'Tambah Item'}
        onSave={saveItem}
      />

      {/* ======================================================
          HEADER DIALOG
          ====================================================== */}

      <HeaderDialog
        open={headerOpen}
        onOpenChange={setHeaderOpen}
        header={header}
        onSaved={() => {
          setHeaderOpen(false)
          router.refresh()
        }}
      />

      {/* ======================================================
          DELETE DIALOG
          ====================================================== */}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setDeleteId(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </div>

              Hapus item ini?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Item akan dihapus permanen. Data sebelumnya tetap
              tercatat di History.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              Batal
            </AlertDialogCancel>

            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={busy}
            >
              {busy && (
                <Loader2 className="animate-spin" />
              )}

              Hapus
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ======================================================
          CANCEL DIALOG
          ====================================================== */}

      <AlertDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!busy) {
            setCancelOpen(open)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Ban className="size-5" />
              </div>

              Batalkan return{' '}
              <span className="font-mono">
                {header.no_return}
              </span>
              ?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Status return akan menjadi{' '}
              <strong>Dibatalkan</strong>. Data dan history tidak
              dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />

              <span className="text-sm font-semibold text-destructive">
                Perhatian
              </span>
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              Pastikan alasan pembatalan sudah sesuai dan dapat
              dipertanggungjawabkan.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cancel-reason">
              Alasan pembatalan
              <span className="text-destructive">*</span>
            </Label>

            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Tuliskan alasan pembatalan..."
            />

            <p className="text-right text-xs text-muted-foreground">
              {reason.length}/300
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              Kembali
            </AlertDialogCancel>

            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={busy}
            >
              {busy && (
                <Loader2 className="animate-spin" />
              )}

              Batalkan Return
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ============================================================
   HEADER DIALOG
   ============================================================ */

function HeaderDialog({
  open,
  onOpenChange,
  header,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  header: ReturnDetail['header']
  onSaved: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        {open && (
          <HeaderForm
            header={header}
            onSaved={onSaved}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ============================================================
   HEADER FORM
   ============================================================ */

function HeaderForm({
  header,
  onSaved,
  onCancel,
}: {
  header: ReturnDetail['header']
  onSaved: () => void
  onCancel: () => void
}) {
  const [values, setValues] = useState({
    tanggal_penerimaan:
      header.tanggal_penerimaan ?? '',

    no_sppb:
      header.no_sppb ?? '',

    no_claim:
      header.no_claim ?? '',

    customer:
      header.customer ?? '',

    pic_penerima:
      header.pic_penerima ?? '',

    catatan:
      header.catatan ?? '',
  })

  const [notes, setNotes] = useState('')

  const [errors, setErrors] =
    useState<Record<string, string>>({})

  const [saving, setSaving] = useState(false)

  const submit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault()

    const parsed =
      returnHeaderSchema.safeParse(values)

    if (!parsed.success) {
      return setErrors(
        flattenErrors(parsed.error),
      )
    }

    setSaving(true)

    const res =
      await updateReturnHeaderAction(
        header.id,
        values,
        notes,
      )

    setSaving(false)

    if (!res.ok) {
      if (res.fieldErrors) {
        setErrors(res.fieldErrors)
      }

      return toast.error(res.error)
    }

    toast.success('Header return diperbarui')

    onSaved()
  }

  const f = (
    key: keyof typeof values,
    label: string,
    type = 'text',
    required = false,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={`eh-${key}`}
        className="text-xs font-semibold"
      >
        {label}

        {required && (
          <span className="ml-1 text-destructive">
            *
          </span>
        )}
      </Label>

      <Input
        id={`eh-${key}`}
        type={type}
        value={values[key]}
        aria-invalid={Boolean(errors[key])}
        onChange={(e) =>
          setValues((v) => ({
            ...v,
            [key]: e.target.value,
          }))
        }
      />

      {errors[key] && (
        <p className="text-xs font-medium text-destructive">
          {errors[key]}
        </p>
      )}
    </div>
  )

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5"
      noValidate
    >
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Pencil className="size-5" />
          </div>

          <div>
            <DialogTitle>
              Edit Informasi Return
            </DialogTitle>

            <DialogDescription>
              Perubahan akan tercatat otomatis di Return History.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {f(
          'tanggal_penerimaan',
          'Tanggal Penerimaan',
          'date',
          true,
        )}

        {f(
          'no_sppb',
          'No SPPB / Surat Jalan',
          'text',
          true,
        )}

        {f(
          'no_claim',
          'No Claim',
        )}

        {f(
          'customer',
          'Customer',
          'text',
          true,
        )}

        {f(
          'pic_penerima',
          'PIC Penerima',
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="eh-catatan"
          className="text-xs font-semibold"
        >
          Catatan
        </Label>

        <Textarea
          id="eh-catatan"
          value={values.catatan}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              catatan: e.target.value,
            }))
          }
          rows={3}
          placeholder="Tambahkan catatan..."
        />
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />

          <Label
            htmlFor="eh-notes"
            className="text-xs font-semibold text-primary"
          >
            Catatan Perubahan
          </Label>
        </div>

        <Input
          id="eh-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Alasan perubahan (tersimpan di History)"
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Batal
        </Button>

        <Button
          type="submit"
          disabled={saving}
        >
          {saving && (
            <Loader2 className="animate-spin" />
          )}

          Simpan Perubahan
        </Button>
      </DialogFooter>
    </form>
  )
}