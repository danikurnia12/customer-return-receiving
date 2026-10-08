'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
} satisfies ChartConfig

const statusConfig = {
  count: {
    label: 'Return',
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

export function ReturnChart({
  data,
  mode,
  statusData,
  customerData,
}: {
  data: TrendRow[]
  mode: 'day' | 'month'
  statusData: ChartGroupRow[]
  customerData: ChartGroupRow[]
}) {
  /*
   * ==========================================================
   * GRAFIK 1
   * TREND RETURN
   * ==========================================================
   */

  const trendRows =
    data.map((d) => ({
      ...d,

      label:
        mode === 'day'
          ? formatDate(
              d.key,
            ).slice(0, 5)
          : formatMonthLabel(
              d.key,
            ),

      fullLabel:
        mode === 'day'
          ? formatDate(
              d.key,
            )
          : formatMonthLabel(
              d.key,
            ),
    }))

  /*
   * ==========================================================
   * GRAFIK 2
   * STATUS RETURN
   * ==========================================================
   */

  const statusRows =
    statusData.map(
      (item) => ({
        ...item,
        label: formatStatus(
          item.name,
        ),
      }),
    )

  /*
   * ==========================================================
   * GRAFIK 3
   * CUSTOMER
   * ==========================================================
   *
   * Maksimal 10 customer agar grafik tetap
   * nyaman dibaca.
   */

  const customerRows =
    customerData.slice(
      0,
      10,
    )

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ======================================================
          GRAFIK 1
          ====================================================== */}

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Trend Return
          </CardTitle>

          <CardDescription>
            Jumlah penerimaan return per{' '}
            {mode === 'day'
              ? 'tanggal'
              : 'bulan'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {trendRows.length ===
          0 ? (
            <EmptyState
              title="Belum ada data"
              description="Grafik akan tampil setelah ada penerimaan return."
            />
          ) : (
            <ChartContainer
              config={
                trendConfig
              }
              className="h-64 w-full"
            >
              <BarChart
                data={
                  trendRows
                }
                margin={{
                  left: -16,
                  right: 8,
                  top: 8,
                  bottom: 4,
                }}
              >
                <CartesianGrid
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                />

                <YAxis
                  allowDecimals={
                    false
                  }
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(
                        _,
                        payload,
                      ) =>
                        payload?.[0]
                          ?.payload
                          ?.fullLabel ??
                        ''
                      }
                    />
                  }
                />

                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                  maxBarSize={
                    40
                  }
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ======================================================
          GRAFIK 2
          ====================================================== */}

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Status Return
          </CardTitle>

          <CardDescription>
            Distribusi return berdasarkan
            status aktual
          </CardDescription>
        </CardHeader>

        <CardContent>
          {statusRows.length ===
          0 ? (
            <EmptyState
              title="Belum ada data"
              description="Data status return belum tersedia."
            />
          ) : (
            <ChartContainer
              config={
                statusConfig
              }
              className="h-64 w-full"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent />
                  }
                />

                <Pie
                  data={
                    statusRows
                  }
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {statusRows.map(
                    (
                      _entry,
                      index,
                    ) => (
                      <Cell
                        key={`status-${index}`}
                        fill={`var(--chart-${
                          (index %
                            5) +
                          1
                        })`}
                      />
                    ),
                  )}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* ======================================================
          GRAFIK 3
          ====================================================== */}

      <Card className="overflow-hidden lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Return per Customer
          </CardTitle>

          <CardDescription>
            Customer dengan jumlah
            penerimaan return terbanyak
          </CardDescription>
        </CardHeader>

        <CardContent>
          {customerRows.length ===
          0 ? (
            <EmptyState
              title="Belum ada data"
              description="Data customer return belum tersedia."
            />
          ) : (
            <ChartContainer
              config={
                customerConfig
              }
              className="h-72 w-full"
            >
              <BarChart
                data={
                  customerRows
                }
                layout="vertical"
                margin={{
                  left: 10,
                  right: 20,
                  top: 8,
                  bottom: 8,
                }}
              >
                <CartesianGrid
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  allowDecimals={
                    false
                  }
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
                  content={
                    <ChartTooltipContent />
                  }
                />

                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[
                    0,
                    4,
                    4,
                    0,
                  ]}
                  maxBarSize={
                    28
                  }
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ============================================================
   FORMAT STATUS
   ============================================================ */

function formatStatus(
  status: string,
) {
  return status
    .replace(
      /[_-]/g,
      ' ',
    )
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase(),
    )
}