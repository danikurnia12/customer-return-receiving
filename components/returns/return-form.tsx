'use client'

import type { ComponentProps } from 'react'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  PackageCheck,
  Plus,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

import { createReturnAction } from '@/app/actions/returns'
import { EmptyState } from '@/components/app/states'
import {
  EMPTY_ITEM,
  ItemDialog,
  draftToInput,
  type ItemDraft,
} from '@/components/returns/item-dialog'
import { ItemsTable } from '@/components/returns/items-table'
import { PhotoUpload } from '@/components/returns/photo-upload'

import {
  AlertDialog,
  AlertDialogAction,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import {
  formatDate,
  formatNumber,
  todayISO,
} from '@/lib/format'
import {
  flattenErrors,
  returnHeaderSchema,
} from '@/lib/validation'

interface HeaderState {
  tanggal_penerimaan: string
  no_sppb: string
  no_claim: string
  customer: string
  pic_penerima: string
  catatan: string

  foto_surat_jalan_url: string | null
  foto_surat_jalan_preview: string | null

  foto_material_url: string | null
  foto_material_preview: string | null
}

type KeyedDraft = ItemDraft & {
  key: string
}

interface ReturnFormProps {
  defaultPic: string
  customers: string[]
}

export function ReturnForm({
  defaultPic,
  customers,
}: ReturnFormProps) {
  const router = useRouter()

  const [header, setHeader] =
    useState<HeaderState>({
      tanggal_penerimaan: todayISO(),
      no_sppb: '',
      no_claim: '',
      customer: '',
      pic_penerima: defaultPic,
      catatan: '',

      foto_surat_jalan_url: null,
      foto_surat_jalan_preview: null,

      foto_material_url: null,
      foto_material_preview: null,
    })

  const [errors, setErrors] =
    useState<Record<string, string>>({})

  const [items, setItems] =
    useState<KeyedDraft[]>([])

  const [dialog, setDialog] =
    useState<{
      open: boolean
      key: string | null
    }>({
      open: false,
      key: null,
    })

  const [deleteKey, setDeleteKey] =
    useState<string | null>(null)

  const [confirmOpen, setConfirmOpen] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  /*
   * ============================================================
   * HEADER FIELD
   * ============================================================
   */

  const setField = (
    key: keyof HeaderState,
    value: string,
  ) => {
    setHeader((current) => ({
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

  /*
   * ============================================================
   * ITEM EDITING
   * ============================================================
   */

  const editing = dialog.key
    ? items.find(
        (item) => item.key === dialog.key,
      )
    : undefined

  const saveItem = (
    draft: ItemDraft,
  ) => {
    if (dialog.key) {
      setItems((current) =>
        current.map((item) =>
          item.key === dialog.key
            ? {
                ...draft,
                key: item.key,
              }
            : item,
        ),
      )

      toast.success(
        'Item berhasil diperbarui',
      )
    } else {
      setItems((current) => [
        ...current,
        {
          ...draft,
          key: crypto.randomUUID(),
        },
      ])

      toast.success(
        'Item berhasil ditambahkan',
      )
    }

    if (errors.items) {
      setErrors((current) => ({
        ...current,
        items: '',
      }))
    }

    setDialog({
      open: false,
      key: null,
    })
  }

  /*
   * ============================================================
   * SUMMARY
   * ============================================================
   */

  const summary = useMemo(() => {
    let totalSj = 0
    let totalAktual = 0
    let selisihCount = 0

    for (const item of items) {
      const qtySj = Number(
        item.qty_surat_jalan || 0,
      )

      const qtyAktual = Number(
        item.qty_aktual_diterima || 0,
      )

      totalSj += Number.isFinite(qtySj)
        ? qtySj
        : 0

      totalAktual += Number.isFinite(
        qtyAktual,
      )
        ? qtyAktual
        : 0

      if (qtySj !== qtyAktual) {
        selisihCount += 1
      }
    }

    return {
      totalSj,
      totalAktual,
      selisihCount,
    }
  }, [items])

  /*
   * ============================================================
   * VALIDATE BEFORE CONFIRMATION
   * ============================================================
   */

  const openConfirm = () => {
    if (saving) return

    const parsed =
      returnHeaderSchema.safeParse(
        header,
      )

    const nextErrors =
      parsed.success
        ? {}
        : flattenErrors(parsed.error)

    if (items.length === 0) {
      nextErrors.items =
        'Minimal 1 item material harus ditambahkan.'
    }

    setErrors(nextErrors)

    if (
      Object.keys(nextErrors).length > 0
    ) {
      toast.error(
        'Periksa kembali data yang wajib diisi.',
      )

      return
    }

    setConfirmOpen(true)
  }

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  const submit = async () => {
    if (saving) return

    setSaving(true)

    try {
      const payload = {
        ...header,
        items: items.map(draftToInput),
      }

      const response =
        await createReturnAction(
          payload,
        )

      if (!response.ok) {
        if (response.fieldErrors) {
          setErrors(
            response.fieldErrors,
          )
        }

        toast.error(
          response.error ||
            'Penerimaan return gagal disimpan.',
        )

        return
      }

      toast.success(
        `Penerimaan ${response.data.no_return} berhasil disimpan`,
      )

      setConfirmOpen(false)

      router.replace(
        `/returns/${response.data.id}`,
      )

      router.refresh()
    } catch (error) {
      console.error(
        '[ReturnForm] Submit error:',
        error,
      )

      toast.error(
        'Terjadi kesalahan saat menyimpan penerimaan return.',
      )
    } finally {
      setSaving(false)
    }
  }

  /*
   * ============================================================
   * HEADER INPUT HELPER
   * ============================================================
   */

  const headerField = (
    key: keyof HeaderState,
    label: string,
    props: ComponentProps<
      typeof Input
    > & {
      required?: boolean
    } = {},
  ) => {
    const {
      required,
      ...inputProps
    } = props

    const error = errors[key]

    return (
      <div className="flex flex-col gap-2">
        <Label
          htmlFor={`h-${key}`}
          className="text-sm font-medium"
        >
          {label}

          {required && (
            <span
              className="ml-1 text-destructive"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </Label>

        <Input
          id={`h-${key}`}
          value={
            header[
              key
            ] as string
          }
          onChange={(event) =>
            setField(
              key,
              event.target.value,
            )
          }
          aria-invalid={Boolean(
            error,
          )}
          aria-describedby={
            error
              ? `error-${key}`
              : undefined
          }
          className={
            error
              ? 'border-destructive focus-visible:ring-destructive'
              : ''
          }
          {...inputProps}
        />

        {error && (
          <p
            id={`error-${key}`}
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    )
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="flex flex-col gap-6 pb-28 md:pb-0">

      {/* PAGE INTRO */}

      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" />

        <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <PackageCheck className="size-6" />
            </div>

            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  SPINDO 5
                </span>

                <span className="text-xs text-muted-foreground">
                  /
                </span>

                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Warehouse
                </span>
              </div>

              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Penerimaan Material Return
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Catat dokumen penerimaan,
                kondisi aktual material, dan
                dokumentasi sebagai evidence
                proses return customer.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3">
            <ShieldCheck className="size-5 text-primary" />

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Status Dokumen
              </p>

              <p className="text-sm font-semibold">
                Draft Penerimaan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* A. INFORMASI RETURN */}

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-4" />
            </div>

            <div>
              <CardTitle className="text-base sm:text-lg">
                A. Informasi Return
              </CardTitle>

              <CardDescription className="mt-1 leading-5">
                Informasi utama penerimaan
                material dari customer.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-7 p-5 sm:p-6">

          {/* DATA UTAMA */}

          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-primary" />

              <h3 className="text-sm font-semibold">
                Data Penerimaan
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">

              {headerField(
                'tanggal_penerimaan',
                'Tanggal Penerimaan',
                {
                  required: true,
                  type: 'date',
                  max: todayISO(),
                },
              )}

              {headerField(
                'no_sppb',
                'No SPPB / Surat Jalan',
                {
                  required: true,
                  placeholder:
                    'Contoh: SJ-001234',
                  maxLength: 100,
                },
              )}

              {headerField(
                'no_claim',
                'No Claim',
                {
                  placeholder:
                    'Opsional',
                  maxLength: 100,
                },
              )}

              {headerField(
                'customer',
                'Customer',
                {
                  required: true,
                  placeholder:
                    'Nama customer',
                  list:
                    'customer-options',
                  autoComplete:
                    'off',
                  maxLength: 150,
                },
              )}

              <datalist id="customer-options">
                {customers.map(
                  (customer) => (
                    <option
                      key={customer}
                      value={
                        customer
                      }
                    />
                  ),
                )}
              </datalist>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="h-pic_penerima"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <UserRound className="size-3.5 text-muted-foreground" />
                  PIC Penerima
                </Label>

                <Input
                  id="h-pic_penerima"
                  value={
                    header.pic_penerima
                  }
                  onChange={(
                    event,
                  ) =>
                    setField(
                      'pic_penerima',
                      event.target
                        .value,
                    )
                  }
                  placeholder="Nama penerima"
                  maxLength={100}
                />

                <p className="text-xs text-muted-foreground">
                  PIC yang melakukan proses
                  penerimaan material.
                </p>
              </div>
            </div>
          </div>

          {/* CATATAN */}

          <div className="rounded-xl border bg-muted/10 p-4 sm:p-5">
            <div className="mb-3">
              <Label
                htmlFor="h-catatan"
                className="text-sm font-semibold"
              >
                Catatan Penerimaan
              </Label>

              <p className="mt-1 text-xs text-muted-foreground">
                Gunakan untuk mencatat
                informasi khusus yang perlu
                diketahui pada proses return.
              </p>
            </div>

            <Textarea
              id="h-catatan"
              value={
                header.catatan
              }
              onChange={(event) =>
                setField(
                  'catatan',
                  event.target.value,
                )
              }
              placeholder="Contoh: material diterima dengan kondisi kemasan rusak..."
              rows={3}
              maxLength={1000}
            />

            <p className="mt-1.5 text-right text-xs tabular-nums text-muted-foreground">
              {header.catatan.length}
              /1000
            </p>
          </div>

          {/* FOTO HEADER */}

          <div>
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="size-4" />
              </div>

              <div>
                <h3 className="text-sm font-semibold">
                  Dokumentasi Penerimaan
                </h3>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Dokumentasikan satu Surat
                  Jalan dan satu kondisi
                  aktual material untuk setiap
                  penerimaan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border bg-background p-3 sm:p-4">
                <PhotoUpload
                  label="Foto Surat Jalan"
                  kind="surat-jalan"
                  path={
                    header.foto_surat_jalan_url
                  }
                  preview={
                    header.foto_surat_jalan_preview
                  }
                  onChange={(
                    path,
                    preview,
                  ) =>
                    setHeader(
                      (current) => ({
                        ...current,
                        foto_surat_jalan_url:
                          path,
                        foto_surat_jalan_preview:
                          preview,
                      }),
                    )
                  }
                />
              </div>

              <div className="rounded-xl border bg-background p-3 sm:p-4">
                <PhotoUpload
                  label="Foto Aktual Material"
                  kind="material"
                  path={
                    header.foto_material_url
                  }
                  preview={
                    header.foto_material_preview
                  }
                  onChange={(
                    path,
                    preview,
                  ) =>
                    setHeader(
                      (current) => ({
                        ...current,
                        foto_material_url:
                          path,
                        foto_material_preview:
                          preview,
                      }),
                    )
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B. MATERIAL ITEMS */}

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PackageCheck className="size-4" />
              </div>

              <div>
                <CardTitle className="text-base sm:text-lg">
                  B. Material Items
                </CardTitle>

                <CardDescription className="mt-1 leading-5">
                  Tambahkan seluruh material
                  yang terdapat pada satu Surat
                  Jalan.
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              onClick={() =>
                setDialog({
                  open: true,
                  key: null,
                })
              }
              disabled={saving}
              className="w-full gap-2 sm:w-auto"
            >
              <Plus className="size-4" />
              Tambah Item
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/10 p-2">
              <EmptyState
                title="Belum ada item material"
                description="Klik Tambah Item untuk memasukkan material yang diterima dari customer."
                className={
                  errors.items
                    ? 'border-destructive/50'
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <ItemsTable
                rows={items.map(
                  (item) => ({
                    key: item.key,
                    diameter:
                      item.diameter,
                    tebal:
                      item.tebal,
                    panjang:
                      item.panjang,
                    batch:
                      item.batch,
                    no_box:
                      item.no_box,
                    qty_surat_jalan:
                      item.qty_surat_jalan,
                    qty_aktual_diterima:
                      item.qty_aktual_diterima,
                    kondisi_material:
                      item.kondisi_material,
                    sloc:
                      item.sloc,
                  }),
                )}
                onEdit={(key) =>
                  setDialog({
                    open: true,
                    key,
                  })
                }
                onDelete={
                  setDeleteKey
                }
              />
            </div>
          )}

          {errors.items && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />

              <p
                role="alert"
                className="font-medium text-destructive"
              >
                {errors.items}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SUMMARY / ACTION BAR */}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">

        <div className="mx-auto flex max-w-screen-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* SUMMARY */}

          <div className="flex min-w-0 items-center gap-4 rounded-xl border bg-card px-4 py-3 shadow-sm">
            <div className="hidden size-9 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
              <PackageCheck className="size-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold tabular-nums">
                  {formatNumber(
                    items.length,
                  )}
                </span>

                <span className="text-sm text-muted-foreground">
                  item
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Qty aktual:{' '}
                  <strong className="font-semibold text-foreground">
                    {formatNumber(
                      summary.totalAktual,
                    )}
                  </strong>
                </span>

                {summary.selisihCount >
                  0 && (
                  <span className="font-medium text-warning">
                    {formatNumber(
                      summary.selisihCount,
                    )}{' '}
                    item selisih
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTION */}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="hidden md:inline-flex"
              onClick={() =>
                router.push(
                  '/returns',
                )
              }
              disabled={saving}
            >
              Batal
            </Button>

            <Button
              type="button"
              onClick={
                openConfirm
              }
              disabled={
                saving ||
                items.length === 0
              }
              className="h-10 flex-1 gap-2 px-5 shadow-sm sm:flex-none"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Simpan Penerimaan
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ITEM DIALOG */}

      <ItemDialog
        open={dialog.open}
        onOpenChange={(
          open,
        ) =>
          setDialog(
            (current) => ({
              open,
              key: open
                ? current.key
                : null,
            }),
          )
        }
        initial={
          editing ??
          EMPTY_ITEM
        }
        title={
          editing
            ? 'Edit Item'
            : 'Tambah Item'
        }
        onSave={
          saveItem
        }
      />

      {/* DELETE CONFIRMATION */}

      <AlertDialog
        open={
          deleteKey !== null
        }
        onOpenChange={(
          open,
        ) => {
          if (
            !open &&
            !saving
          ) {
            setDeleteKey(
              null,
            )
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus item ini?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Item akan dihapus dari
              daftar penerimaan yang
              sedang dibuat. Data yang
              sudah tersimpan di database
              tidak akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!deleteKey)
                  return

                setItems(
                  (current) =>
                    current.filter(
                      (item) =>
                        item.key !==
                        deleteKey,
                    ),
                )

                setDeleteKey(
                  null,
                )

                toast.success(
                  'Item dihapus dari daftar',
                )
              }}
            >
              Hapus Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SAVE CONFIRMATION */}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(
          open,
        ) => {
          if (!saving) {
            setConfirmOpen(
              open,
            )
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              Simpan penerimaan
              return?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Pastikan informasi header dan
              seluruh item material sudah
              sesuai dengan Surat Jalan dan
              kondisi fisik.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl border bg-muted/40 p-4 text-sm">

            <dt className="text-muted-foreground">
              Tanggal
            </dt>

            <dd className="font-medium">
              {formatDate(
                header.tanggal_penerimaan,
              )}
            </dd>

            <dt className="text-muted-foreground">
              Customer
            </dt>

            <dd className="break-words font-medium">
              {header.customer}
            </dd>

            <dt className="text-muted-foreground">
              Surat Jalan
            </dt>

            <dd className="break-all font-mono text-xs">
              {header.no_sppb}
            </dd>

            {header.no_claim && (
              <>
                <dt className="text-muted-foreground">
                  No Claim
                </dt>

                <dd className="break-all font-mono text-xs">
                  {header.no_claim}
                </dd>
              </>
            )}

            <dt className="text-muted-foreground">
              Jumlah Item
            </dt>

            <dd className="font-medium tabular-nums">
              {formatNumber(
                items.length,
              )}
            </dd>

            <dt className="text-muted-foreground">
              Qty SJ
            </dt>

            <dd className="font-medium tabular-nums">
              {formatNumber(
                summary.totalSj,
              )}
            </dd>

            <dt className="text-muted-foreground">
              Qty Aktual
            </dt>

            <dd className="font-medium tabular-nums">
              {formatNumber(
                summary.totalAktual,
              )}
            </dd>

            <dt className="text-muted-foreground">
              Foto
            </dt>

            <dd className="font-medium">
              {header.foto_surat_jalan_url
                ? 'Surat Jalan ✓'
                : 'Surat Jalan —'}
              {' · '}
              {header.foto_material_url
                ? 'Aktual ✓'
                : 'Aktual —'}
            </dd>
          </dl>

          {summary.selisihCount >
            0 && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />

              <div>
                <p className="font-medium">
                  Terdapat selisih
                  quantity
                </p>

                <p className="text-muted-foreground">
                  {formatNumber(
                    summary.selisihCount,
                  )}{' '}
                  item memiliki Qty
                  Surat Jalan yang
                  berbeda dengan Qty
                  Aktual Diterima.
                </p>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={saving}
            >
              Periksa Lagi
            </AlertDialogCancel>

            <Button
              type="button"
              onClick={submit}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Ya, Simpan
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}