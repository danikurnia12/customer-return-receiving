'use server'

import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { askGemini } from '@/lib/services/ai'

type Metrics = {
  totalReturn: number
  totalQty: number
  totalItem: number
  totalSelisih: number
}

type TrendItem = Metrics & {
  period: string
}

type PeriodComparison = {
  title: string
  currentLabel: string
  previousLabel: string
  current: Metrics
  previous: Metrics
  change: Record<
    keyof Metrics,
    { value: number; percent: number | null }
  >
}

const ZERO_METRICS: Metrics = {
  totalReturn: 0,
  totalQty: 0,
  totalItem: 0,
  totalSelisih: 0,
}

const SUMMARY_COLUMNS =
  'id, no_return, tanggal_penerimaan, customer, status, item_count, total_qty_aktual, selisih_count'

function getJakartaToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

function parseDate(value: string | null): string | null {
  if (!value) return null

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return `${match[1]}-${match[2]}-${match[3]}`
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function monthStart(value: string): string {
  return `${value.slice(0, 7)}-01`
}

function previousMonthStart(value: string): string {
  const date = new Date(`${monthStart(value)}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() - 1)
  return date.toISOString().slice(0, 10)
}

function daysInMonth(value: string): number {
  const [year, month] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function mondayStart(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  const day = date.getUTCDay()
  const daysSinceMonday = (day + 6) % 7
  date.setUTCDate(date.getUTCDate() - daysSinceMonday)
  return date.toISOString().slice(0, 10)
}

function labelDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(
    'id-ID',
    {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  )
}

function labelMonth(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(
    'id-ID',
    {
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric',
    },
  )
}

function calculateMetrics(
  rows: Array<{
    total_qty_aktual?: number | string | null
    item_count?: number | string | null
    selisih_count?: number | string | null
  }>,
): Metrics {
  return {
    totalReturn: rows.length,
    totalQty: rows.reduce(
      (sum, row) => sum + Number(row.total_qty_aktual ?? 0),
      0,
    ),
    totalItem: rows.reduce(
      (sum, row) => sum + Number(row.item_count ?? 0),
      0,
    ),
    totalSelisih: rows.filter(
      (row) => Number(row.selisih_count ?? 0) > 0,
    ).length,
  }
}

function makeComparison(
  title: string,
  currentLabel: string,
  previousLabel: string,
  currentRows: typeof activeRowsType,
  previousRows: typeof activeRowsType,
): PeriodComparison {
  const current = calculateMetrics(currentRows)
  const previous = calculateMetrics(previousRows)

  const keys: (keyof Metrics)[] = [
    'totalReturn',
    'totalQty',
    'totalItem',
    'totalSelisih',
  ]

  const change = Object.fromEntries(
    keys.map((key) => {
      const difference = current[key] - previous[key]

      return [
        key,
        {
          value: difference,
          percent:
            previous[key] === 0
              ? null
              : (difference / previous[key]) * 100,
        },
      ]
    }),
  ) as PeriodComparison['change']

  return {
    title,
    currentLabel,
    previousLabel,
    current,
    previous,
    change,
  }
}

type ActiveRow = {
  tanggal_penerimaan: string | null
  customer: string | null
  status: string
  item_count: number | string | null
  total_qty_aktual: number | string | null
  selisih_count: number | string | null
}

// Digunakan agar tipe baris tetap sama pada kedua periode.
type typeofActiveRowsType = ActiveRow[]
const activeRowsType: typeofActiveRowsType = []

export async function testGeminiAction() {
  try {
    // Pastikan pengguna sudah login sebelum memanggil Gemini.
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        message: 'Sesi berakhir. Silakan login kembali.',
      }
    }

    const result = await askGemini(
      'Jawab singkat dalam bahasa Indonesia: apakah kamu berhasil terhubung?',
    )

    return { success: true, message: result }
  } catch (error) {
    console.error('[AI] Gemini error:', error)

    return {
      success: false,
      message:
        error instanceof Error ? error.message : String(error),
    }
  }
}

export async function getReturnAIInsight() {
  try {
    // Pastikan pengguna sudah login sebelum membaca data Return.
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        message: 'Sesi berakhir. Silakan login kembali.',
      }
    }

    const supabase = await createClient()

    /*
     * Ambil seluruh histori secara bertahap.
     * Batas 500 berlaku per batch, bukan total histori.
     */
    const pageSize = 500
    const rawRows: ActiveRow[] = []

    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from('return_summary')
        .select(SUMMARY_COLUMNS)
        .order('tanggal_penerimaan', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (error) throw new Error(error.message)

      const batch = data ?? []
      rawRows.push(...(batch as unknown as ActiveRow[]))

      if (batch.length < pageSize) break
    }

    const rows = rawRows
      .filter((row) => row.status !== 'dibatalkan')
      .map((row) => ({
        ...row,
        tanggal_penerimaan: parseDate(row.tanggal_penerimaan),
      }))

    const today = getJakartaToday()
    const currentMonthStart = monthStart(today)
    const previousMonthFirst = previousMonthStart(today)
    const currentMonthDay = Number(today.slice(8, 10))
    const previousMonthDay = Math.min(
      currentMonthDay,
      daysInMonth(previousMonthFirst),
    )

    const currentMonthEnd = today
    const previousMonthEnd = `${previousMonthFirst.slice(0, 7)}-${String(
      previousMonthDay,
    ).padStart(2, '0')}`

    const currentWeekStart = mondayStart(today)
    const elapsedWeekDays =
      Math.floor(
        (Date.parse(`${today}T00:00:00Z`) -
          Date.parse(`${currentWeekStart}T00:00:00Z`)) /
          86400000,
      ) + 1

    const previousWeekStart = shiftDate(currentWeekStart, -7)
    const previousWeekEnd = shiftDate(
      previousWeekStart,
      elapsedWeekDays - 1,
    )

    const inRange = (
      start: string,
      end: string,
    ) =>
      rows.filter(
        (row) =>
          row.tanggal_penerimaan !== null &&
          row.tanggal_penerimaan >= start &&
          row.tanggal_penerimaan <= end,
      )

    const comparisons: PeriodComparison[] = [
      makeComparison(
        'Perbandingan Bulanan',
        `${labelDate(currentMonthStart)} – ${labelDate(currentMonthEnd)}`,
        `${labelDate(previousMonthFirst)} – ${labelDate(previousMonthEnd)}`,
        inRange(currentMonthStart, currentMonthEnd),
        inRange(previousMonthFirst, previousMonthEnd),
      ),
      makeComparison(
        'Perbandingan Mingguan',
        `${labelDate(currentWeekStart)} – ${labelDate(today)}`,
        `${labelDate(previousWeekStart)} – ${labelDate(previousWeekEnd)}`,
        inRange(currentWeekStart, today),
        inRange(previousWeekStart, previousWeekEnd),
      ),
    ]

    const datedRows = rows.filter(
      (row) => row.tanggal_penerimaan !== null,
    )

    const kpi = calculateMetrics(rows)

    const trendMap = new Map<string, TrendItem>()

    for (const row of datedRows) {
      const date = row.tanggal_penerimaan!
      const key = date.slice(0, 7)
      const period = labelMonth(`${key}-01`)
      const existing = trendMap.get(key)

      const rowMetrics = calculateMetrics([row])

      if (existing) {
        existing.totalReturn += rowMetrics.totalReturn
        existing.totalQty += rowMetrics.totalQty
        existing.totalItem += rowMetrics.totalItem
        existing.totalSelisih += rowMetrics.totalSelisih
      } else {
        trendMap.set(key, { period, ...rowMetrics })
      }
    }

    const trend = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, item]) => item)

    const customerCounts = new Map<string, number>()

    for (const row of datedRows) {
      const customer = row.customer?.trim() || 'Customer Tidak Diisi'
      customerCounts.set(
        customer,
        (customerCounts.get(customer) ?? 0) + 1,
      )
    }

    const topCustomers = Array.from(customerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const comparisonSummary = comparisons
      .map((comparison) => {
        const lines = [
          `${comparison.title}:`,
          `Periode berjalan (${comparison.currentLabel}): ${comparison.current.totalReturn} Return, ${comparison.current.totalItem} Item, ${comparison.current.totalQty} Qty Aktual, ${comparison.current.totalSelisih} Return berselisih.`,
          `Periode pembanding (${comparison.previousLabel}): ${comparison.previous.totalReturn} Return, ${comparison.previous.totalItem} Item, ${comparison.previous.totalQty} Qty Aktual, ${comparison.previous.totalSelisih} Return berselisih.`,
        ]

        for (const key of [
          'totalReturn',
          'totalQty',
          'totalItem',
          'totalSelisih',
        ] as const) {
          const delta = comparison.change[key]
          const metricNames = {
            totalReturn: 'Return',
            totalQty: 'Qty Aktual',
            totalItem: 'Item',
            totalSelisih: 'Return berselisih',
          }

          lines.push(
            `${metricNames[key]}: perubahan ${delta.value >= 0 ? '+' : ''}${delta.value}; ${
              delta.percent === null
                ? 'persentase tidak dapat dihitung karena periode pembanding bernilai nol'
                : `${delta.percent.toFixed(1)}%`
            }.`,
          )
        }

        return lines.join('\n')
      })
      .join('\n\n')

    const trendSummary =
      trend.length > 0
        ? trend
            .map(
              (item) =>
                `- ${item.period}: ${item.totalReturn} Return, ${item.totalItem} Item, ${item.totalQty} Qty Aktual, ${item.totalSelisih} Return berselisih`,
            )
            .join('\n')
        : '- Belum ada data bertanggal'

    const customerSummary =
      topCustomers.length > 0
        ? topCustomers
            .map(([customer, count]) => `- ${customer}: ${count} Return`)
            .join('\n')
        : '- Belum ada data customer'

    const prompt = `
Kamu adalah analis data untuk aplikasi Customer Return Receiving.

Analisis ringkasan agregat yang disiapkan aplikasi berikut.
Jangan meminta atau mengasumsikan akses database.
Gunakan hanya angka dan fakta yang tersedia.
Jangan mengarang penyebab kenaikan, penurunan, atau selisih.
Jika penyebab tidak tersedia, katakan demikian.
Return berstatus dibatalkan sudah dikecualikan oleh aplikasi.

KPI keseluruhan:
- Total Return aktif: ${kpi.totalReturn}
- Total item: ${kpi.totalItem}
- Total Qty Aktual: ${kpi.totalQty}
- Return dengan selisih: ${kpi.totalSelisih}

PERBANDINGAN PERIODE YANG DIHITUNG APLIKASI:
${comparisonSummary}

CATATAN PERIODE:
- Bulanan membandingkan bulan berjalan sampai hari ini dengan jumlah hari yang sama pada bulan sebelumnya.
- Mingguan menggunakan Senin sebagai awal minggu dan membandingkan jumlah hari yang sama pada minggu sebelumnya.
- Nilai persentase tidak tersedia bila pembanding bernilai nol.
- Periode berjalan mungkin belum lengkap.

TREND BULANAN:
${trendSummary}

CUSTOMER DENGAN RETURN TERBANYAK:
${customerSummary}

Susun jawaban profesional dan ringkas dalam bahasa Indonesia dengan bagian:
## Ringkasan untuk Supervisor
## Perbandingan Bulanan dan Mingguan
## Tren dan Customer Dominan
## Hal yang Perlu Diperhatikan
## Kesimpulan dan Tindak Lanjut

Utamakan angka hasil perhitungan aplikasi. Jangan menghitung ulang atau mengubah angka.
Jangan menyimpulkan penyebab tanpa bukti. Tindak lanjut harus praktis dan tidak mengasumsikan penyebab yang belum diketahui.
`

    const insight = await askGemini(prompt)

    return {
      success: true,
      message: insight,
      kpi,
      trend,
      comparisons,
    }
  } catch (error) {
    console.error('[AI] Return insight error:', error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Gagal menganalisis data Return.',
      kpi: { ...ZERO_METRICS },
      trend: [],
      comparisons: [],
    }
  }
}