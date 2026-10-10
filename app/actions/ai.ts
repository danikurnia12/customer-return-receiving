'use server'

import { askGemini } from '@/lib/services/ai'
import { listReturnSummaries } from '@/lib/services/returns'

type TrendItem = {
  period: string
  totalReturn: number
  totalQty: number
  totalItem: number
  totalSelisih: number
}

export async function testGeminiAction() {
  try {
    const result = await askGemini(
      'Jawab singkat dalam bahasa Indonesia: apakah kamu berhasil terhubung?'
    )

    return {
      success: true,
      message: result,
    }
  } catch (error) {
    console.error('[AI] Gemini error:', error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : String(error),
    }
  }
}

export async function getReturnAIInsight() {
  try {
    /*
     * ============================================================
     * 1. AMBIL DATA RETURN
     * ============================================================
     *
     * Hanya membaca data.
     * Tidak ada INSERT / UPDATE / DELETE.
     */
    const rows = await listReturnSummaries({}, 500)

    /*
     * ============================================================
     * 2. JIKA BELUM ADA DATA
     * ============================================================
     */
    if (rows.length === 0) {
      return {
        success: true,
        message:
          'Belum ada data Return yang dapat dianalisis.',

        kpi: {
          totalReturn: 0,
          totalQty: 0,
          totalItem: 0,
          totalSelisih: 0,
        },

        trend: [],
      }
    }

    /*
     * ============================================================
     * 3. FILTER RETURN AKTIF
     * ============================================================
     *
     * Return dengan status "dibatalkan" tidak ikut dianalisis.
     */
    const activeRows = rows.filter(
      (row) => row.status !== 'dibatalkan'
    )

    /*
     * ============================================================
     * 4. KPI UTAMA
     * ============================================================
     */

    const totalReturn = activeRows.length

    const totalQty = activeRows.reduce(
      (sum, row) =>
        sum + Number(row.total_qty_aktual ?? 0),
      0
    )

    const totalItem = activeRows.reduce(
      (sum, row) =>
        sum + Number(row.item_count ?? 0),
      0
    )

    const totalSelisih = activeRows.filter(
      (row) => Number(row.selisih_count ?? 0) > 0
    ).length

    /*
     * ============================================================
     * 5. TREND RETURN PER BULAN
     * ============================================================
     *
     * Data dikelompokkan berdasarkan tanggal penerimaan.
     *
     * Contoh:
     *
     * Oktober 2026
     * - Return: 10
     * - Qty: 5.200
     * - Item: 18
     * - Selisih: 2
     *
     * September 2026
     * - Return: 7
     * - Qty: 3.800
     * - Item: 12
     * - Selisih: 1
     */

    const trendMap = new Map<
      string,
      {
        period: string
        year: number
        month: number
        totalReturn: number
        totalQty: number
        totalItem: number
        totalSelisih: number
      }
    >()

    for (const row of activeRows) {
      if (!row.tanggal_penerimaan) {
        continue
      }

      const date = new Date(row.tanggal_penerimaan)

      if (Number.isNaN(date.getTime())) {
        continue
      }

      const year = date.getFullYear()
      const month = date.getMonth()

      /*
       * Key menggunakan YYYY-MM agar setiap bulan
       * tetap unik dan mudah diurutkan.
       */
      const key = `${year}-${String(month + 1).padStart(2, '0')}`

      const period = date.toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      })

      const existing = trendMap.get(key)

      if (existing) {
        existing.totalReturn += 1

        existing.totalQty += Number(
          row.total_qty_aktual ?? 0
        )

        existing.totalItem += Number(
          row.item_count ?? 0
        )

        if (Number(row.selisih_count ?? 0) > 0) {
          existing.totalSelisih += 1
        }
      } else {
        trendMap.set(key, {
          period,
          year,
          month,
          totalReturn: 1,
          totalQty: Number(
            row.total_qty_aktual ?? 0
          ),
          totalItem: Number(
            row.item_count ?? 0
          ),
          totalSelisih:
            Number(row.selisih_count ?? 0) > 0
              ? 1
              : 0,
        })
      }
    }

    /*
     * ============================================================
     * 6. URUTKAN TREND DARI LAMA → BARU
     * ============================================================
     */

    const trend: TrendItem[] = Array.from(
      trendMap.values()
    )
      .sort((a, b) => {
        if (a.year !== b.year) {
          return a.year - b.year
        }

        return a.month - b.month
      })
      .map((item) => ({
        period: item.period,
        totalReturn: item.totalReturn,
        totalQty: item.totalQty,
        totalItem: item.totalItem,
        totalSelisih: item.totalSelisih,
      }))

    /*
     * ============================================================
     * 7. TOP CUSTOMER
     * ============================================================
     */

    const customerCount = new Map<string, number>()

    for (const row of activeRows) {
      const customer =
        row.customer?.trim() ||
        'Customer Tidak Diisi'

      customerCount.set(
        customer,
        (customerCount.get(customer) ?? 0) + 1
      )
    }

    const topCustomers = Array.from(
      customerCount.entries()
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    /*
     * ============================================================
     * 8. STATUS RETURN
     * ============================================================
     */

    const statusCount = new Map<string, number>()

    for (const row of activeRows) {
      const status =
        row.status?.trim() ||
        'Belum Ada Status'

      statusCount.set(
        status,
        (statusCount.get(status) ?? 0) + 1
      )
    }

    const statusSummary = Array.from(
      statusCount.entries()
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    /*
     * ============================================================
     * 9. DATA TREND UNTUK GEMINI
     * ============================================================
     */

    const trendSummary =
      trend.length > 0
        ? trend
            .map(
              (item) =>
                `- ${item.period}: ${item.totalReturn} Return, ${item.totalItem} Item, ${item.totalQty} Qty, ${item.totalSelisih} Return memiliki selisih`
            )
            .join('\n')
        : '- Belum ada data tren'

    /*
     * ============================================================
     * 10. PROMPT GEMINI
     * ============================================================
     */

    const prompt = `
Kamu adalah AI Analyst untuk aplikasi
"Customer Return Receiving".

Tugas kamu adalah menganalisis data Return yang diberikan
oleh sistem.

Gunakan HANYA data yang tersedia di bawah ini.

Jangan mengarang:
- angka
- customer
- status
- periode
- penyebab Return
- penyebab kenaikan atau penurunan
- informasi operasional yang tidak diberikan

Jika suatu informasi tidak tersedia, katakan bahwa
informasi tersebut tidak tersedia.

========================
DATA RETURN
========================

Total Return aktif:
${totalReturn}

Total item:
${totalItem}

Total quantity aktual:
${totalQty}

Return yang memiliki selisih quantity:
${totalSelisih}

========================
TREND RETURN PER PERIODE
========================

${trendSummary}

========================
TOP CUSTOMER
========================

${
  topCustomers.length > 0
    ? topCustomers
        .map(
          ([customer, count]) =>
            `- ${customer}: ${count} Return`
        )
        .join('\n')
    : '- Belum ada data customer'
}

========================
STATUS RETURN
========================

${
  statusSummary.length > 0
    ? statusSummary
        .map(
          ([status, count]) =>
            `- ${status}: ${count} Return`
        )
        .join('\n')
    : '- Belum ada data status'
}

========================
ATURAN ANALISIS TREND
========================

Analisis perubahan jumlah Return antar periode.

Jika terdapat kenaikan:
- sebutkan periode sebelumnya
- sebutkan periode berikutnya
- sebutkan angka Return masing-masing

Jika terdapat penurunan:
- sebutkan periode sebelumnya
- sebutkan periode berikutnya
- sebutkan angka Return masing-masing

Jangan menyimpulkan penyebab kenaikan atau penurunan
jika penyebab tersebut tidak tersedia di dalam data.

Jangan mengatakan kondisi operasional perusahaan secara
keseluruhan hanya berdasarkan data Return yang terbatas.

Gunakan kalimat seperti:
"Berdasarkan data Return yang tersedia..."

========================
FORMAT JAWABAN
========================

Berikan analisis dalam bahasa Indonesia.

Gunakan struktur:

## Kondisi Umum

Jelaskan kondisi Return berdasarkan data yang tersedia.

## Tren Return

Jelaskan perubahan jumlah Return antar periode.

Sebutkan periode dengan jumlah Return tertinggi
jika memang dapat ditentukan dari data.

Jika terdapat kenaikan atau penurunan yang terlihat,
jelaskan berdasarkan angka yang tersedia.

## Customer Dominan

Sebutkan customer dengan jumlah Return terbanyak.

## Perhatian

Jelaskan hal yang perlu diperhatikan, terutama terkait:
- selisih quantity
- perubahan jumlah Return
- kondisi data

## Kesimpulan

Berikan kesimpulan singkat dan praktis.

Gunakan bahasa profesional, singkat, dan mudah dipahami
oleh supervisor atau manager.
`

    /*
     * ============================================================
     * 11. PANGGIL GEMINI
     * ============================================================
     */

    const insight = await askGemini(prompt)

    /*
     * ============================================================
     * 12. HASIL
     * ============================================================
     *
     * KPI dan trend dihitung oleh aplikasi.
     * Gemini hanya menghasilkan insight/analisis.
     */

    return {
      success: true,

      message: insight,

      kpi: {
        totalReturn,
        totalQty,
        totalItem,
        totalSelisih,
      },

      trend,
    }
  } catch (error) {
    /*
     * ============================================================
     * 13. ERROR HANDLING
     * ============================================================
     */

    console.error(
      '[AI] Return insight error:',
      error
    )

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : 'Gagal menganalisis data Return.',

      kpi: {
        totalReturn: 0,
        totalQty: 0,
        totalItem: 0,
        totalSelisih: 0,
      },

      trend: [],
    }
  }
}