'use client'

import { memo, useMemo } from 'react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  XAxis,
  YAxis,
} from 'recharts'

import { EmptyState } from '@/components/app/states'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

import {
  formatDate,
  formatMonthLabel,
  formatNumber,
} from '@/lib/format'

const trendConfig = {
  count: {
    label: 'Jumlah Return',
    color: 'var(--chart-1)',
  },
  qty: {
    label: 'Qty Aktual',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

const customerQtyConfig = {
  qty: {
    label: 'Qty Aktual',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

const customerReturnConfig = {
  count: {
    label: 'Jumlah Return',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig

const adminProgressConfig = {
  filled: {
    label: 'Terisi',
    color: 'var(--chart-2)',
  },
  missing: {
    label: 'Belum Terisi',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig

const disposisiConfig = {
  count: {
    label: 'Jumlah Return',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig

type TrendRow = {
  key: string
  count: number
  qty: number
}

type CustomerQtyRow = {
  name: string
  qty: number
}

type CustomerReturnRow = {
  name: string
  count: number
}

type AdminProgressRow = {
  name: string
  label: string
  filled: number
  missing: number
  filledPercent: number
}

type DisposisiRow = {
  name: string
  count: number
}

type ReturnChartProps = {
  data: TrendRow[]
  mode: 'day' | 'month'
  customerQtyData: CustomerQtyRow[]
  customerData: CustomerReturnRow[]
  adminProgressData: AdminProgressRow[]
  disposisiData: DisposisiRow[]
}

function ChartEmptyState({ description }: { description: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <EmptyState title="Belum ada data" description={description} />
    </div>
  )
}

export const ReturnChart = memo(function ReturnChart({
  data,
  mode,
  customerQtyData,
  customerData,
  adminProgressData,
  disposisiData,
}: ReturnChartProps) {
  const trendRows = useMemo(
    () =>
      data.map((row) => ({
        ...row,
        label:
          mode === 'day'
            ? formatDate(row.key).slice(0, 5)
            : formatMonthLabel(row.key),
        fullLabel:
          mode === 'day'
            ? formatDate(row.key)
            : formatMonthLabel(row.key),
      })),
    [data, mode],
  )

  const customerQtyRows = useMemo(
    () => customerQtyData.slice(0, 10),
    [customerQtyData],
  )

  const customerReturnRows = useMemo(
    () => customerData.slice(0, 10),
    [customerData],
  )

  const adminProgressRows = useMemo(
    () => adminProgressData,
    [adminProgressData],
  )

  const disposisiRows = useMemo(
    () => disposisiData,
    [disposisiData],
  )

  const hasAdminProgress = adminProgressRows.some(
    (row) => row.filled + row.missing > 0,
  )

  const hasDisposisiData = disposisiRows.some(
    (row) => row.count > 0,
  )

  return (
    <div className="space-y-4">
      {/* Grafik 1: tren penerimaan dibuat selebar area konten. */}
      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardHeader className="gap-1 pb-2 sm:px-6 sm:pt-5">
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
              01
            </span>

            <div className="min-w-0">
              <CardTitle className="text-base">
                Tren Penerimaan Return
              </CardTitle>

              <CardDescription className="mt-1">
                Jumlah transaksi dan Qty Aktual per{' '}
                {mode === 'day' ? 'tanggal' : 'bulan'}.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-2 pb-4 sm:px-5 sm:pb-5">
          {trendRows.length === 0 ? (
            <ChartEmptyState description="Grafik tren akan tampil setelah ada penerimaan Return pada periode yang dipilih." />
          ) : (
            <ChartContainer
              config={trendConfig}
              className="h-[300px] w-full sm:h-[340px]"
            >
              <ComposedChart
                data={trendRows}
                margin={{
                  left: -8,
                  right: 14,
                  top: 24,
                  bottom: 12,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={9}
                  minTickGap={18}
                  fontSize={11}
                />

                <YAxis
                  yAxisId="returns"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                  fontSize={11}
                />

                <YAxis
                  yAxisId="qty"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={58}
                  fontSize={11}
                  tickFormatter={(value) =>
                    formatNumber(Number(value))
                  }
                />

                <ChartTooltip
                  cursor={{
                    fill: 'var(--muted)',
                    opacity: 0.35,
                  }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullLabel ?? ''
                      }
                      formatter={(value) =>
                        formatNumber(Number(value))
                      }
                    />
                  }
                />

                <Bar
                  yAxisId="returns"
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={42}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    offset={6}
                    fill="var(--foreground)"
                    fontSize={10}
                    fontWeight={600}
                    formatter={(value) =>
                      formatNumber(Number(value))
                    }
                  />
                </Bar>

                <Line
                  yAxisId="qty"
                  dataKey="qty"
                  type="monotone"
                  stroke="var(--color-qty)"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1.5 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="qty"
                    position="bottom"
                    offset={9}
                    fill="var(--foreground)"
                    fontSize={10}
                    fontWeight={600}
                    formatter={(value) =>
                      formatNumber(Number(value))
                    }
                  />
                </Line>
              </ComposedChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Grafik 2 dan 3: data Customer. */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="gap-1 pb-2 sm:px-5 sm:pt-5">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                02
              </span>

              <div className="min-w-0">
                <CardTitle className="text-base">
                  Qty Aktual per Customer
                </CardTitle>

                <CardDescription className="mt-1">
                  10 customer dengan total Qty Aktual tertinggi.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-2 pb-4 sm:px-4 sm:pb-5">
            {customerQtyRows.length === 0 ? (
              <ChartEmptyState description="Data Qty Aktual per Customer belum tersedia." />
            ) : (
              <ChartContainer
                config={customerQtyConfig}
                className="h-[330px] w-full sm:h-[360px]"
              >
                <BarChart
                  data={customerQtyRows}
                  layout="vertical"
                  margin={{
                    left: 4,
                    right: 62,
                    top: 8,
                    bottom: 8,
                  }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    tickFormatter={(value) =>
                      formatNumber(Number(value))
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={112}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={7}
                    interval={0}
                    fontSize={10}
                  />

                  <ChartTooltip
                    cursor={{
                      fill: 'var(--muted)',
                      opacity: 0.35,
                    }}
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          formatNumber(Number(value))
                        }
                      />
                    }
                  />

                  <Bar
                    dataKey="qty"
                    fill="var(--color-qty)"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={26}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="qty"
                      position="right"
                      offset={7}
                      fill="var(--foreground)"
                      fontSize={10}
                      fontWeight={600}
                      formatter={(value) =>
                        formatNumber(Number(value))
                      }
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="gap-1 pb-2 sm:px-5 sm:pt-5">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                03
              </span>

              <div className="min-w-0">
                <CardTitle className="text-base">
                  Jumlah Return per Customer
                </CardTitle>

                <CardDescription className="mt-1">
                  10 customer dengan jumlah transaksi Return terbanyak.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-2 pb-4 sm:px-4 sm:pb-5">
            {customerReturnRows.length === 0 ? (
              <ChartEmptyState description="Data jumlah Return per Customer belum tersedia." />
            ) : (
              <ChartContainer
                config={customerReturnConfig}
                className="h-[330px] w-full sm:h-[360px]"
              >
                <BarChart
                  data={customerReturnRows}
                  layout="vertical"
                  margin={{
                    left: 4,
                    right: 54,
                    top: 8,
                    bottom: 8,
                  }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    tickFormatter={(value) =>
                      formatNumber(Number(value))
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={112}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={7}
                    interval={0}
                    fontSize={10}
                  />

                  <ChartTooltip
                    cursor={{
                      fill: 'var(--muted)',
                      opacity: 0.35,
                    }}
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          formatNumber(Number(value))
                        }
                      />
                    }
                  />

                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={28}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="count"
                      position="right"
                      offset={7}
                      fill="var(--foreground)"
                      fontSize={10}
                      fontWeight={600}
                      formatter={(value) =>
                        formatNumber(Number(value))
                      }
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grafik 4 dan 5: progres administrasi. */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="gap-1 pb-2 sm:px-5 sm:pt-5">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                04
              </span>

              <div className="min-w-0">
                <CardTitle className="text-base">
                  Kelengkapan Administrasi
                </CardTitle>

                <CardDescription className="mt-1">
                  Persentase pada label menunjukkan jumlah transaksi
                  yang sudah terisi. No Claim dihitung terisi jika
                  minimal satu dari empat kolom digunakan.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-2.5 rounded-sm"
                  style={{
                    backgroundColor: 'var(--color-filled)',
                  }}
                />
                Terisi
              </span>

              <span className="inline-flex items-center gap-2">
                <span
                  className="size-2.5 rounded-sm"
                  style={{
                    backgroundColor: 'var(--color-missing)',
                  }}
                />
                Belum Terisi
              </span>
            </div>
          </CardHeader>

          <CardContent className="px-2 pb-4 sm:px-4 sm:pb-5">
            {!hasAdminProgress ? (
              <ChartEmptyState description="Belum ada transaksi aktif pada filter Dashboard yang dipilih." />
            ) : (
              <ChartContainer
                config={adminProgressConfig}
                className="h-[330px] w-full sm:h-[360px]"
              >
                <BarChart
                  data={adminProgressRows}
                  layout="vertical"
                  barGap={5}
                  barCategoryGap="25%"
                  margin={{
                    left: 4,
                    right: 44,
                    top: 12,
                    bottom: 8,
                  }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    tickFormatter={(value) =>
                      formatNumber(Number(value))
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="label"
                    width={132}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={7}
                    interval={0}
                    fontSize={10}
                  />

                  <ChartTooltip
                    cursor={{
                      fill: 'var(--muted)',
                      opacity: 0.35,
                    }}
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          formatNumber(Number(value))
                        }
                      />
                    }
                  />

                  <Bar
                    dataKey="filled"
                    fill="var(--color-filled)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="filled"
                      position="right"
                      offset={5}
                      fill="var(--foreground)"
                      fontSize={10}
                      fontWeight={600}
                      formatter={(value) =>
                        formatNumber(Number(value))
                      }
                    />
                  </Bar>

                  <Bar
                    dataKey="missing"
                    fill="var(--color-missing)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="missing"
                      position="right"
                      offset={5}
                      fill="var(--foreground)"
                      fontSize={10}
                      fontWeight={600}
                      formatter={(value) =>
                        formatNumber(Number(value))
                      }
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="gap-1 pb-2 sm:px-5 sm:pt-5">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                05
              </span>

              <div className="min-w-0">
                <CardTitle className="text-base">
                  Sebaran Disposisi
                </CardTitle>

                <CardDescription className="mt-1">
                  Jumlah transaksi berdasarkan keputusan disposisi.
                  Transaksi yang belum memiliki pilihan masuk ke
                  kategori Belum ditentukan.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-2 pb-4 sm:px-4 sm:pb-5">
            {!hasDisposisiData ? (
              <ChartEmptyState description="Belum ada data disposisi pada transaksi aktif di filter Dashboard ini." />
            ) : (
              <ChartContainer
                config={disposisiConfig}
                className="h-[330px] w-full sm:h-[360px]"
              >
                <BarChart
                  data={disposisiRows}
                  layout="vertical"
                  margin={{
                    left: 4,
                    right: 54,
                    top: 8,
                    bottom: 8,
                  }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    tickFormatter={(value) =>
                      formatNumber(Number(value))
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={7}
                    interval={0}
                    fontSize={10}
                  />

                  <ChartTooltip
                    cursor={{
                      fill: 'var(--muted)',
                      opacity: 0.35,
                    }}
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          formatNumber(Number(value))
                        }
                      />
                    }
                  />

                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[0, 5, 5, 0]}
                    maxBarSize={26}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="count"
                      position="right"
                      offset={7}
                      fill="var(--foreground)"
                      fontSize={10}
                      fontWeight={600}
                      formatter={(value) =>
                        formatNumber(Number(value))
                      }
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

ReturnChart.displayName = 'ReturnChart'