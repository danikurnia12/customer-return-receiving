
'use client'

import { useState } from 'react'
import { getReturnAIInsight } from '@/app/actions/ai'
import {
  AlertCircle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileText,
  Loader2,
  Package,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Activity,
} from 'lucide-react'

type AIResult = {
  success: boolean
  message: string
  kpi?: {
    totalReturn: number
    totalQty: number
    totalItem: number
    totalSelisih: number
  }
  trend?: {
    period: string
    totalReturn: number
    totalQty: number
    totalItem: number
    totalSelisih: number
  }[]
  comparisons?: {
    title: string
    currentLabel: string
    previousLabel: string
    current: {
      totalReturn: number
      totalQty: number
      totalItem: number
      totalSelisih: number
    }
    previous: {
      totalReturn: number
      totalQty: number
      totalItem: number
      totalSelisih: number
    }
    change: Record<
      'totalReturn' | 'totalQty' | 'totalItem' | 'totalSelisih',
      { value: number; percent: number | null }
    >
  }[]
}

/* =========================================================
   MODERN TREND CHART
   ========================================================= */

function ReturnTrendChart({
  data,
}: {
  data: NonNullable<AIResult['trend']>
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed bg-muted/20">
        <div className="text-center">
          <BarChart3 className="mx-auto mb-3 size-10 text-muted-foreground/50" />

          <p className="text-sm font-medium text-muted-foreground">
            Belum ada data tren
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Data periode akan muncul setelah tersedia.
          </p>
        </div>
      </div>
    )
  }

  const width = 1000
  const height = 360

  const paddingLeft = 65
  const paddingRight = 35
  const paddingTop = 35
  const paddingBottom = 60

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const maxReturn = Math.max(
    ...data.map((item) => item.totalReturn),
    1,
  )

  const yMax = Math.max(Math.ceil(maxReturn / 5) * 5, 5)

  const getX = (index: number) => {
    if (data.length === 1) {
      return paddingLeft + chartWidth / 2
    }

    return paddingLeft + (index / (data.length - 1)) * chartWidth
  }

  const getY = (value: number) => {
    return paddingTop + chartHeight - (value / yMax) * chartHeight
  }

  const points = data.map((item, index) => ({
    ...item,
    x: getX(index),
    y: getY(item.totalReturn),
  }))

  const linePath = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`
      }

      return `L ${point.x} ${point.y}`
    })
    .join(' ')

  const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x} ${paddingTop + chartHeight}
    L ${points[0].x} ${paddingTop + chartHeight}
    Z
  `

  const gridCount = 5

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      {/* HEADER CHART */}

      <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="size-5" />
          </div>

          <div>
            <h3 className="text-base font-semibold">Tren Return</h3>

            <p className="text-xs text-muted-foreground">
              Perkembangan jumlah Return berdasarkan periode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5">
          <span className="size-2 rounded-full bg-primary" />

          <span className="text-xs font-medium text-muted-foreground">
            Total Return
          </span>
        </div>
      </div>

      {/* CHART */}

      <div className="px-3 pb-4 pt-5 sm:px-5">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto min-w-[680px] w-full"
            role="img"
            aria-label="Grafik tren Return per periode"
          >
            <defs>
              <linearGradient
                id="returnTrendGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopOpacity="0.28" />
                <stop offset="100%" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* GRID */}

            {Array.from({ length: gridCount + 1 }).map((_, index) => {
              const value = (yMax / gridCount) * (gridCount - index)
              const y = getY(value)

              return (
                <g key={`grid-${index}`}>
                  <line
                    x1={paddingLeft}
                    x2={width - paddingRight}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.08"
                    strokeDasharray="4 6"
                  />

                  <text
                    x={paddingLeft - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[12px]"
                  >
                    {Math.round(value)}
                  </text>
                </g>
              )
            })}

            {/* AREA */}

            <path
              d={areaPath}
              fill="url(#returnTrendGradient)"
              className="text-primary"
            />

            {/* LINE */}

            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            />

            {/* POINTS */}

            {points.map((point, index) => (
              <g key={`${point.period}-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="9"
                  className="fill-primary/10"
                />

                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  className="fill-card stroke-primary"
                  strokeWidth="3"
                />

                <title>
                  {`${point.period}: ${point.totalReturn} Return | ${point.totalQty.toLocaleString(
                    'id-ID',
                  )} Qty | ${point.totalItem} Item`}
                </title>

                <text
                  x={point.x}
                  y={point.y - 17}
                  textAnchor="middle"
                  className="fill-foreground text-[12px] font-semibold"
                >
                  {point.totalReturn}
                </text>

                <text
                  x={point.x}
                  y={height - 25}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {point.period}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 border-t sm:grid-cols-3">
        <div className="border-r px-5 py-4">
          <p className="text-xs text-muted-foreground">Periode</p>

          <p className="mt-1 text-sm font-semibold">
            {data.length} periode
          </p>
        </div>

        <div className="border-r px-5 py-4">
          <p className="text-xs text-muted-foreground">Return Tertinggi</p>

          <p className="mt-1 text-sm font-semibold">
            {Math.max(
              ...data.map((item) => item.totalReturn),
            ).toLocaleString('id-ID')}{' '}
            Return
          </p>
        </div>

        <div className="col-span-2 px-5 py-4 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Total Qty</p>

          <p className="mt-1 text-sm font-semibold">
            {data
              .reduce((sum, item) => sum + item.totalQty, 0)
              .toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   AI INSIGHT PAGE
   ========================================================= */

export default function AIPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIResult | null>(null)

  async function handleAnalyze() {
    try {
      setLoading(true)
      setResult(null)

      const response = await getReturnAIInsight()

      setResult(response)
    } catch (error) {
      console.error('[AI Page] Error:', error)

      setResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat menjalankan analisis AI.',
        kpi: {
          totalReturn: 0,
          totalQty: 0,
          totalItem: 0,
          totalSelisih: 0,
        },
        trend: [],
        comparisons: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const kpi = result?.kpi
  const trend = result?.trend ?? []

  return (
    <div id="ai-screenshot" className="space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BrainCircuit className="size-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              AI Insight
            </h1>

            <p className="text-sm text-muted-foreground">
              Analisis monitoring berdasarkan data Customer Return Receiving.
            </p>
            <p className="text-xs text-muted-foreground">
  Laporan monitoring •{' '}
  {new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}
</p>
          </div>
        </div>

        <button
  type="button"
  data-screenshot-ignore
  onClick={handleAnalyze}
  disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menganalisis...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Analisis Data
            </>
          )}
        </button>
      </div>

      {/* =====================================================
          STATUS
      ====================================================== */}

      {result && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            result.success
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
              : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
          }`}
        >
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="size-5 text-red-600 dark:text-red-400" />
            )}

            <div>
              <p
                className={`text-sm font-semibold ${
                  result.success
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {result.success
                  ? 'Analisis monitoring berhasil'
                  : 'Analisis monitoring gagal'}
              </p>

              <p className="text-xs text-muted-foreground">
                {result.success
                  ? 'Ringkasan monitoring, tren, dan analisis dibuat berdasarkan data Return yang tersedia.'
                  : 'Periksa koneksi atau konfigurasi AI kemudian coba lagi.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          RINGKASAN MONITORING
      ====================================================== */}

      {result?.success && kpi && (
        <div>
          <div className="mb-3">
            <h2 className="text-lg font-semibold">
              Ringkasan Monitoring Return
            </h2>

            <p className="text-sm text-muted-foreground">
              Ringkasan kondisi data Return aktif yang tercatat di sistem.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* TOTAL RETURN */}

            <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Return
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight">
                    {kpi.totalReturn.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <TrendingUp className="size-5" />
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Return aktif yang tercatat
              </p>
            </div>

            {/* TOTAL QTY */}

            <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Qty Aktual
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight">
                    {kpi.totalQty.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Package className="size-5" />
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Jumlah aktual material Return
              </p>
            </div>

            {/* TOTAL ITEM */}

            <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Item
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight">
                    {kpi.totalItem.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <FileText className="size-5" />
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Detail item yang tercatat
              </p>
            </div>

            {/* SELISIH */}

            <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Return Berselisih
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight">
                    {kpi.totalSelisih.toLocaleString('id-ID')}
                  </p>
                </div>

                <div
                  className={`flex size-11 items-center justify-center rounded-xl ${
                    kpi.totalSelisih > 0
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <BarChart3 className="size-5" />
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Return dengan selisih quantity
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PERBANDINGAN BULANAN DAN MINGGUAN
      ====================================================== */}

      {result?.success && result.comparisons && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Perbandingan Periode
            </h2>

            <p className="text-sm text-muted-foreground">
              Perbandingan data periode berjalan dengan periode sebelumnya
              menggunakan rentang hari yang sebanding.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {result.comparisons.map((comparison) => {
              const metrics = [
                {
                  key: 'totalReturn' as const,
                  label: 'Total Return',
                },
                {
                  key: 'totalQty' as const,
                  label: 'Qty Aktual',
                },
                {
                  key: 'totalItem' as const,
                  label: 'Total Item',
                },
                {
                  key: 'totalSelisih' as const,
                  label: 'Return Berselisih',
                },
              ]

              const formatNumber = (value: number) =>
                value.toLocaleString('id-ID')

              return (
                <div
                  key={comparison.title}
                  className="rounded-xl border bg-card p-5 shadow-sm"
                >
                  <h3 className="font-semibold">
                    {comparison.title}
                  </h3>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">
                        Periode berjalan
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {comparison.currentLabel}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">
                        Periode sebelumnya
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {comparison.previousLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-2 font-medium">
                            Data Monitoring
                          </th>

                          <th className="px-2 py-2 text-right font-medium">
                            Sekarang
                          </th>

                          <th className="px-2 py-2 text-right font-medium">
                            Sebelumnya
                          </th>

                          <th className="py-2 pl-2 text-right font-medium">
                            Perubahan
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {metrics.map((metric) => {
                          const current =
                            comparison.current[metric.key]

                          const previous =
                            comparison.previous[metric.key]

                          const change =
                            comparison.change[metric.key]

                          return (
                            <tr
                              key={metric.key}
                              className="border-b last:border-0"
                            >
                              <td className="py-3 pr-2">
                                {metric.label}
                              </td>

                              <td className="px-2 py-3 text-right tabular-nums">
                                {formatNumber(current)}
                              </td>

                              <td className="px-2 py-3 text-right tabular-nums">
                                {formatNumber(previous)}
                              </td>

                              <td className="py-3 pl-2 text-right">
                                <div className="font-medium tabular-nums">
                                  {change.value > 0 ? '+' : ''}
                                  {formatNumber(change.value)}
                                </div>

                                <div className="text-xs text-muted-foreground">
                                  {change.percent === null
                                    ? 'Persentase —'
                                    : `${change.percent > 0 ? '+' : ''}${change.percent.toLocaleString(
                                        'id-ID',
                                        {
                                          maximumFractionDigits: 1,
                                        },
                                      )}%`}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Catatan: minggu dimulai pada hari Senin. Perbandingan menggunakan
            rentang hari yang sebanding. Periode berjalan mungkin belum lengkap.
            Persentase tidak ditampilkan jika nilai periode sebelumnya nol.
          </p>
        </section>
      )}

      {/* =====================================================
          TREND CHART
      ====================================================== */}

      {result?.success && <ReturnTrendChart data={trend} />}

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {!result && !loading && (
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-8" />
            </div>

            <h2 className="text-xl font-semibold">
              Siap Menganalisis Data Return
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Klik tombol <strong>Analisis Data</strong> untuk menyiapkan
              ringkasan monitoring dan meminta Gemini menganalisis ringkasan
              tersebut.
            </p>

            <p className="mt-3 text-xs text-muted-foreground">
              Analisis tidak mengubah data Return.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Loader2 className="size-8 animate-spin" />
            </div>

            <h2 className="text-xl font-semibold">
              Menyiapkan analisis monitoring...
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Aplikasi sedang menyiapkan ringkasan data Return dan meminta
              Gemini menganalisis ringkasan tersebut. Proses ini dapat
              membutuhkan beberapa saat.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          AI RESULT
      ====================================================== */}

      {result && result.success && (
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BrainCircuit className="size-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Analisis Monitoring Return
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Ringkasan analisis berdasarkan data Return.
                  </p>
                </div>
              </div>

              <div className="hidden rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary sm:block">
                Gemini AI
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="rounded-xl bg-muted/40 p-5">
              <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                {result.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          INFORMATION
      ====================================================== */}

      <div className="grid gap-4 md:grid-cols-3">
        {/* DATA SOURCE */}

        <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Database className="size-5" />
            </div>

            <p className="text-sm font-semibold">Data Source</p>
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Data Return aktif digunakan untuk menyajikan ringkasan monitoring,
            perbandingan periode, dan tren. Return yang dibatalkan dikecualikan
            dari analisis.
          </p>
        </div>

        {/* AI ROLE */}

        <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
            </div>

            <p className="text-sm font-semibold">AI Role</p>
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Aplikasi menghitung dan menyiapkan ringkasan data Return. Gemini
            hanya menganalisis ringkasan tersebut tanpa akses langsung ke
            database dan tidak mengubah data Return.
          </p>
        </div>

        {/* ANALYSIS */}

        <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <BarChart3 className="size-5" />
            </div>

            <p className="text-sm font-semibold">Analysis</p>
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Insight dan tren dibuat berdasarkan ringkasan data yang tersedia
            pada saat analisis dijalankan.
          </p>
        </div>
      </div>
    </div>
  )
}
