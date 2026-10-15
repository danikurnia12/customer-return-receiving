'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'

import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import type { ReturnDetail } from '@/lib/services/returns'

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '-'
  }

  return new Intl.NumberFormat('id-ID').format(value)
}

function formatDecimal(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '-'
  }

  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(value)
}

function sanitizeFileName(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
}

async function imageUrlToDataUrl(url: string) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Foto evidence tidak dapat diambil.')
  }

  const blob = await response.blob()

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Gagal membaca foto evidence.'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Gagal membaca foto evidence.'))
    }

    reader.readAsDataURL(blob)
  })
}

function getImageFormat(dataUrl: string) {
  if (dataUrl.startsWith('data:image/png')) {
    return 'PNG'
  }

  if (dataUrl.startsWith('data:image/webp')) {
    return 'WEBP'
  }

  return 'JPEG'
}

function addSectionTitle(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number,
) {
  doc.setFillColor(245, 245, 245)
  doc.rect(x, y, width, 8, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(40, 40, 40)
  doc.text(title, x + 3, y + 5.5)

  return y + 12
}

export function DownloadReturnReport({
  detail,
}: {
  detail: ReturnDetail
}) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (downloading) {
      return
    }

    setDownloading(true)

    try {
      const { header, items } = detail

      // ======================================================
      // A4 LANDSCAPE
      // ======================================================

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      const margin = 10
      const contentWidth = pageWidth - margin * 2

      // ======================================================
      // HEADER
      // ======================================================

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(25, 25, 25)

      doc.text(
        'LAPORAN PENERIMAAN MATERIAL RETURN',
        margin,
        16,
      )

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)

      doc.text(
        'Customer Return Receiving',
        margin,
        22,
      )
      // ======================================================
// LOGO SPINDO 5
// ======================================================

try {
  const logoDataUrl =
    await imageUrlToDataUrl('/spindo 5.png')

  const logoWidth = 20
  const logoHeight = 20

  const logoX =
    pageWidth - margin - logoWidth

  const logoY = 5

  doc.addImage(
    logoDataUrl,
    getImageFormat(logoDataUrl),
    logoX,
    logoY,
    logoWidth,
    logoHeight,
    undefined,
    'FAST',
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(50, 50, 50)

  doc.text(
    'SPINDO 5',
    logoX + logoWidth / 2,
    logoY + logoHeight + 5,
    {
      align: 'center',
    },
  )
} catch (error) {
  console.warn(
    '[Download Return Report] Logo SPINDO 5 gagal dimuat:',
    error,
  )
}

      doc.setDrawColor(180, 180, 180)
      doc.line(
        margin,
        26,
        pageWidth - margin,
        26,
      )

      // ======================================================
      // INFORMASI RETURN
      // ======================================================

      let y = 32

      y = addSectionTitle(
        doc,
        'INFORMASI RETURN',
        margin,
        y,
        contentWidth,
      )

      const leftX = margin + 3
      const midX = 100
      const rightX = 190

      const labelOffset = 31

      const infoRows = [
        [
          'No Return',
          header.no_return || '-',
          'Tanggal',
          header.tanggal_penerimaan
            ? formatDate(header.tanggal_penerimaan)
            : '-',
          'Status',
          header.status || '-',
        ],
        [
          'Customer',
          header.customer || '-',
          'No SPPB',
          header.no_sppb || '-',
          'PIC Penerima',
          header.pic_penerima || '-',
        ],
        [
          'No Claim',
          header.no_claim || '-',
          'Catatan',
          header.catatan || '-',
          '',
          '',
        ],
      ]

      for (const row of infoRows) {
        doc.setFontSize(8.5)

        doc.setFont('helvetica', 'bold')
        doc.setTextColor(80, 80, 80)

        doc.text(row[0], leftX, y)
        doc.text(row[2], midX, y)

        if (row[4]) {
          doc.text(row[4], rightX, y)
        }

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 30, 30)

        doc.text(
          doc.splitTextToSize(row[1], 55),
          leftX + labelOffset,
          y,
        )

        doc.text(
          doc.splitTextToSize(row[3], 55),
          midX + labelOffset,
          y,
        )

        if (row[5]) {
          doc.text(
            doc.splitTextToSize(row[5], 55),
            rightX + labelOffset,
            y,
          )
        }

        y += 6
      }

      // ======================================================
      // DETAIL MATERIAL
      // ======================================================

      y += 2

      y = addSectionTitle(
        doc,
        'DETAIL MATERIAL',
        margin,
        y,
        contentWidth,
      )

      const tableX = margin
      const tableY = y

      /*
       * A4 landscape:
       * 297 mm - margin kiri 10 - margin kanan 10
       * = 277 mm
       */
      const columns = [
        { title: 'No', width: 9 },
        { title: 'Diameter', width: 24 },
        { title: 'Tebal', width: 18 },
        { title: 'Panjang', width: 22 },
        { title: 'Batch', width: 29 },
        { title: 'No Box', width: 25 },
        { title: 'Qty SJ', width: 23 },
        { title: 'Qty Aktual', width: 25 },
        { title: 'Selisih', width: 22 },
        { title: 'Kondisi', width: 35 },
        { title: 'Location', width: 45 },
      ]

      const headerHeight = 10
      const rowHeight = 10
      const tableFontSize = 7

      // ------------------------------------------------------
      // HEADER TABEL
      // ------------------------------------------------------

      function drawTableHeader(startY: number) {
        let x = tableX

        for (const column of columns) {
          // Background header
          doc.setFillColor(230, 230, 230)
          doc.rect(
            x,
            startY,
            column.width,
            headerHeight,
            'F',
          )

          // Border header
          doc.setDrawColor(150, 150, 150)
          doc.setLineWidth(0.25)
          doc.rect(
            x,
            startY,
            column.width,
            headerHeight,
          )

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(tableFontSize)
          doc.setTextColor(30, 30, 30)

          const lines = doc.splitTextToSize(
            column.title,
            column.width - 4,
          )

          if (lines.length === 1) {
            doc.text(
              lines[0],
              x + column.width / 2,
              startY + 6,
              {
                align: 'center',
              },
            )
          } else {
            doc.text(
              lines.slice(0, 2),
              x + column.width / 2,
              startY + 4,
              {
                align: 'center',
              },
            )
          }

          x += column.width
        }
      }

      drawTableHeader(tableY)

      y = tableY + headerHeight

      let totalQtySj = 0
      let totalQtyAktual = 0

      // ------------------------------------------------------
      // BARIS ITEM
      // ------------------------------------------------------

      for (
        let index = 0;
        index < items.length;
        index += 1
      ) {
        const item = items[index]

        const selisih =
          Number(item.qty_aktual || 0) -
          Number(item.qty_surat_jalan || 0)

        totalQtySj += Number(
          item.qty_surat_jalan || 0,
        )

        totalQtyAktual += Number(
          item.qty_aktual || 0,
        )

        if (
          y + rowHeight >
          pageHeight - 25
        ) {
          doc.addPage()

          y = 15

          drawTableHeader(y)

          y += headerHeight
        }

        const values = [
          String(index + 1),
          item.diameter || '-',
          formatDecimal(item.tebal),
          formatNumber(item.panjang),
          item.batch || '-',
          item.no_box || '-',
          formatNumber(item.qty_surat_jalan),
          formatNumber(item.qty_aktual),
          formatNumber(selisih),
          item.kondisi_material || '-',
          item.location || '-',
        ]

        let x = tableX

        values.forEach(
          (value, columnIndex) => {
            const column =
              columns[columnIndex]

            // ------------------------------------------------
            // CELL PUTIH
            // ------------------------------------------------

            doc.setFillColor(255, 255, 255)
            doc.rect(
              x,
              y,
              column.width,
              rowHeight,
              'F',
            )

            // ------------------------------------------------
            // BORDER TIPIS
            // ------------------------------------------------

            doc.setDrawColor(180, 180, 180)
            doc.setLineWidth(0.2)
            doc.rect(
              x,
              y,
              column.width,
              rowHeight,
            )

            // ------------------------------------------------
            // TEXT
            // ------------------------------------------------

            doc.setFont(
              'helvetica',
              'normal',
            )

            doc.setFontSize(
              tableFontSize,
            )

            doc.setTextColor(
              30,
              30,
              30,
            )

            /*
             * Sisakan ruang 3 mm kiri/kanan.
             * Jika teks terlalu panjang,
             * splitTextToSize akan memecahnya.
             */
            const lines =
              doc.splitTextToSize(
                String(value),
                column.width - 4,
              )

            const visibleLines =
              lines.slice(0, 2)

            if (
              visibleLines.length === 1
            ) {
              doc.text(
                visibleLines[0],
                x + column.width / 2,
                y + 6,
                {
                  align: 'center',
                },
              )
            } else {
              doc.text(
                visibleLines,
                x + column.width / 2,
                y + 3.5,
                {
                  align: 'center',
                },
              )
            }

            x += column.width
          },
        )

        y += rowHeight
      }

      // ======================================================
      // SUMMARY
      // ======================================================

      y += 6

      if (
        y + 15 >
        pageHeight - 25
      ) {
        doc.addPage()
        y = 15
      }

      const totalSelisih =
        totalQtyAktual - totalQtySj

      doc.setFont(
        'helvetica',
        'bold',
      )

      doc.setFontSize(9)
      doc.setTextColor(40, 40, 40)

      doc.text(
        'RINGKASAN QUANTITY',
        margin,
        y,
      )

      y += 6

      doc.setFont(
        'helvetica',
        'normal',
      )

      doc.setFontSize(8)

      doc.text(
        `Total Qty Surat Jalan : ${formatNumber(totalQtySj)}`,
        margin,
        y,
      )

      doc.text(
        `Total Qty Aktual : ${formatNumber(totalQtyAktual)}`,
        margin + 80,
        y,
      )

      doc.text(
        `Total Selisih : ${formatNumber(totalSelisih)}`,
        margin + 170,
        y,
      )

      // ======================================================
      // EVIDENCE
      // ======================================================

      y += 12

      if (
        y + 80 >
        pageHeight - 25
      ) {
        doc.addPage()
        y = 15
      }

      y = addSectionTitle(
        doc,
        'EVIDENCE',
        margin,
        y,
        contentWidth,
      )

      const photos = [
        {
          label: 'Foto Surat Jalan',
          url:
            header.foto_surat_jalan_signed_url,
        },
        {
          label: 'Foto Material',
          url:
            header.foto_material_signed_url,
        },
      ].filter(
        (
          photo,
        ): photo is {
          label: string
          url: string
        } => Boolean(photo.url),
      )

      if (photos.length === 0) {
        doc.setFont(
          'helvetica',
          'normal',
        )

        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)

        doc.text(
          'Tidak ada foto evidence.',
          margin,
          y,
        )
      } else {
        const photoWidth = 125
        const photoHeight = 75
        const gap = 10

        let photoX = margin

        for (const photo of photos) {
          if (
            photoX + photoWidth >
            pageWidth - margin
          ) {
            photoX = margin
            y += photoHeight + 15
          }

          if (
            y + photoHeight >
            pageHeight - 25
          ) {
            doc.addPage()

            y = 15
            photoX = margin
          }

          try {
            const dataUrl =
              await imageUrlToDataUrl(
                photo.url,
              )

            doc.setFont(
              'helvetica',
              'bold',
            )

            doc.setFontSize(8)
            doc.setTextColor(50, 50, 50)

            doc.text(
              photo.label,
              photoX,
              y,
            )

            doc.addImage(
              dataUrl,
              getImageFormat(dataUrl),
              photoX,
              y + 3,
              photoWidth,
              photoHeight,
              undefined,
              'FAST',
            )

            photoX +=
              photoWidth + gap
          } catch {
            doc.setFont(
              'helvetica',
              'normal',
            )

            doc.setFontSize(8)
            doc.setTextColor(
              150,
              0,
              0,
            )

            doc.text(
              `${photo.label}: gagal dimuat`,
              photoX,
              y,
            )

            photoX +=
              photoWidth + gap
          }
        }
      }

      // ======================================================
      // FOOTER
      // ======================================================

      const totalPages =
        doc.getNumberOfPages()

      for (
        let page = 1;
        page <= totalPages;
        page += 1
      ) {
        doc.setPage(page)

        doc.setDrawColor(
          200,
          200,
          200,
        )

        doc.setLineWidth(0.2)

        doc.line(
          margin,
          pageHeight - 15,
          pageWidth - margin,
          pageHeight - 15,
        )

        doc.setFont(
          'helvetica',
          'normal',
        )

        doc.setFontSize(7)
        doc.setTextColor(
          110,
          110,
          110,
        )

        doc.text(
          `No Return: ${header.no_return}`,
          margin,
          pageHeight - 10,
        )

        doc.text(
          `Halaman ${page} dari ${totalPages}`,
          pageWidth - margin,
          pageHeight - 10,
          {
            align: 'right',
          },
        )
      }

      // ======================================================
      // DOWNLOAD
      // ======================================================

      const fileName =
        `Laporan-Return-${sanitizeFileName(
          header.no_return,
        )}.pdf`

      doc.save(fileName)

      toast.success(
        'Laporan Return berhasil diunduh.',
      )
    } catch (error) {
      console.error(
        '[Download Return Report]',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : 'Gagal membuat laporan Return.',
      )
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={downloading}
      className="gap-2"
    >
      {downloading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}

      {downloading
        ? 'Membuat Laporan...'
        : 'Download Laporan'}
    </Button>
  )
}