'use client'

import { Pencil, Trash2 } from 'lucide-react'

import { QtyDiff } from '@/components/app/badges'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatNumber } from '@/lib/format'

export interface ItemRow {
  key: string
  diameter: string
  tebal: number | string
  panjang: number | string
  batch: string | null
  no_box: string | null
  qty_surat_jalan: number | string
  qty_aktual_diterima: number | string
  kondisi_material: string
  sloc: string | null
}

export function ItemsTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: ItemRow[]
  onEdit?: (key: string) => void
  onDelete?: (key: string) => void
}) {
  const totalSj = rows.reduce(
    (sum, row) =>
      sum + Number(row.qty_surat_jalan || 0),
    0,
  )

  const totalAktual = rows.reduce(
    (sum, row) =>
      sum +
      Number(row.qty_aktual_diterima || 0),
    0,
  )

  const hasActions = Boolean(
    onEdit || onDelete,
  )

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                No
              </TableHead>

              <TableHead>
                Diameter
              </TableHead>

              <TableHead className="text-right">
                Tebal
              </TableHead>

              <TableHead className="text-right">
                Panjang
              </TableHead>

              <TableHead>
                Batch
              </TableHead>

              <TableHead>
                No Box
              </TableHead>

              <TableHead className="text-right">
                Qty SJ
              </TableHead>

              <TableHead className="text-right">
                Qty Aktual
              </TableHead>

              <TableHead>
                Kondisi
              </TableHead>

              <TableHead>
                SLOC
              </TableHead>

              {hasActions && (
                <TableHead className="text-right">
                  Aksi
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.key}>
                <TableCell className="tabular-nums text-muted-foreground">
                  {index + 1}
                </TableCell>

                <TableCell className="font-medium">
                  {row.diameter}
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.tebal)}
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.panjang)}
                </TableCell>

                <TableCell className="font-mono text-sm">
                  {row.batch || '-'}
                </TableCell>

                <TableCell className="font-mono text-sm">
                  {row.no_box || '-'}
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {formatNumber(
                    row.qty_surat_jalan,
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="tabular-nums">
                      {formatNumber(
                        row.qty_aktual_diterima,
                      )}
                    </span>

                    <QtyDiff
                      qtySj={Number(
                        row.qty_surat_jalan,
                      )}
                      qtyAktual={Number(
                        row.qty_aktual_diterima,
                      )}
                    />
                  </div>
                </TableCell>

                <TableCell>
                  {row.kondisi_material}
                </TableCell>

                <TableCell className="font-mono text-sm">
                  {row.sloc || '-'}
                </TableCell>

                {hasActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit item ${index + 1}`}
                          onClick={() =>
                            onEdit(row.key)
                          }
                        >
                          <Pencil />
                        </Button>
                      )}

                      {onDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Hapus item ${index + 1}`}
                          onClick={() =>
                            onDelete(row.key)
                          }
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell
                colSpan={6}
                className="font-medium"
              >
                Total (
                {formatNumber(rows.length)} item)
              </TableCell>

              <TableCell className="text-right font-semibold tabular-nums">
                {formatNumber(totalSj)}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold tabular-nums">
                    {formatNumber(totalAktual)}
                  </span>

                  <QtyDiff
                    qtySj={totalSj}
                    qtyAktual={totalAktual}
                  />
                </div>
              </TableCell>

              <TableCell
                colSpan={
                  hasActions ? 3 : 2
                }
              />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}