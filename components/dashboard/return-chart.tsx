
'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
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

const customerConfig = {
  count: {
    label: 'Return',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

type TrendRow = {
  key: string
  count: number
  qty: number
}

type ChartGroupRow = {
  name: string
  count: number
}

type LocationSeries = {
  dataKey: string
  name: string
}

export function ReturnChart({
  data,
  mode,
  customerData,
  locationData,
  locationSeries,
}: {
  data: TrendRow[]
  mode: 'day' | 'month'
  statusData: ChartGroupRow[]
  customerData: ChartGroupRow[]
  locationData: Record<string, string | number>[]
  locationSeries: LocationSeries[]
}) {
  /*
   * ==========================================================
   * GRAFIK 1
   * TREND RETURN
   * ==========================================================
   */

  const trendRows = data.map((d) => ({
    ...d,

    label:
      mode === 'day'
        ? formatDate(d.key).slice(0, 5)
        : formatMonthLabel(d.key),

    fullLabel:
      mode === 'day'
        ? formatDate(d.key)
        : formatMonthLabel(d.key),
  }))

  /*
   * ==========================================================
   * GRAFIK 3
   * RETURN PER CUSTOMER
   * ==========================================================
   */

  const customerRows = customerData.slice(0, 10)

  /*
   * ==========================================================
   * KONFIGURASI GRAFIK LOKASI
   * ==========================================================
   */

  const locationConfig = Object.fromEntries(
    locationSeries.map((series, index) => [
      series.dataKey,
      {
        label: series.name,
        color: `var(--chart-${(index % 5) + 1})`,
      },
    ]),
  ) satisfies ChartConfig

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ======================================================
          GRAFIK 1: TREND RETURN
          ====================================================== */}

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Trend Return
          </CardTitle>

          <CardDescription>
            Jumlah penerimaan return dan Qty Aktual per{' '}
            {mode === 'day' ? 'tanggal' : 'bulan'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {trendRows.length === 0 ? (
            <EmptyState
              title="Belum ada data"
              description="Grafik akan tampil setelah ada penerimaan return."
            />
          ) : (
            <ChartContainer
              config={trendConfig}
              className="h-64 w-full"
            >
              <ComposedChart
                data={trendRows}
                margin={{
                  left: -16,
                  right: 12,
                  top: 8,
                  bottom: 4,
                }}
              >
                <CartesianGrid vertical={false} />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                />

                <YAxis
                  yAxisId="returns"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />

                <YAxis
                  yAxisId="qty"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullLabel ?? ''
                      }
                    />
                  }
                />

                <Bar
                  yAxisId="returns"
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />

                <Line
                  yAxisId="qty"
                  dataKey="qty"
                  type="monotone"
                  stroke="var(--color-qty)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ======================================================
          GRAFIK 2: QTY LOCATION PER BULAN
          GABUNGAN BATANG DAN GARIS
          ====================================================== */}

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Qty Location per Bulan
          </CardTitle>

          <CardDescription>
            Perbandingan batang dan tren Qty Aktual berdasarkan lokasi/SLOC setiap bulan
          </CardDescription>
        </CardHeader>

        <CardContent>
          {locationData.length === 0 ||
          locationSeries.length === 0 ? (
            <EmptyState
              title="Belum ada data"
              description="Data Qty Aktual per lokasi belum tersedia."
            />
          ) : (
            <ChartContainer
              config={locationConfig}
              className="h-64 w-full"
            >
              <ComposedChart
                data={locationData}
                margin={{
                  left: -16,
                  right: 12,
                  top: 8,
                  bottom: 4,
                }}
              >
                <CartesianGrid vertical={false} />

                <XAxis
                  dataKey="key"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                  tickFormatter={(value) =>
                    formatMonthLabel(String(value))
                  }
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        formatMonthLabel(String(value))
                      }
                    />
                  }
                />

                {locationSeries.map((series, index) => (
                  <Bar
                    key={`bar-${series.dataKey}`}
                    dataKey={series.dataKey}
                    name={series.name}
                    fill={`var(--chart-${(index % 5) + 1})`}
                    fillOpacity={0.35}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={32}
                  />
                ))}

                {locationSeries.map((series, index) => (
                  <Line
                    key={`line-${series.dataKey}`}
                    dataKey={series.dataKey}
                    name={series.name}
                    type="monotone"
                    stroke={`var(--chart-${(index % 5) + 1})`}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </ComposedChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ======================================================
          GRAFIK 3: RETURN PER CUSTOMER
          ====================================================== */}

      <Card className="overflow-hidden lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Return per Customer
          </CardTitle>

          <CardDescription>
            Customer dengan jumlah penerimaan return terbanyak
          </CardDescription>
        </CardHeader>

        <CardContent>
          {customerRows.length === 0 ? (
            <EmptyState
              title="Belum ada data"
              description="Data customer return belum tersedia."
            />
          ) : (
            <ChartContainer
              config={customerConfig}
              className="h-72 w-full"
            >
              <BarChart
                data={customerRows}
                layout="vertical"
                margin={{
                  left: 10,
                  right: 20,
                  top: 8,
                  bottom: 8,
                }}
              >
                <CartesianGrid horizontal={false} />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />

                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />

                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
