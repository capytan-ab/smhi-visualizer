'use client'

import React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
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

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec',
}

type MonthKey =
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | '11'
  | '12'

type MonthlyData = Record<MonthKey, number>

interface ChartBarMultipleProps {
  cloudPct: MonthlyData
  lightningProb: MonthlyData
  year: number
}

const chartConfig = {
  cloud: {
    label: 'Cloud Coverage',
    color: 'var(--chart-1)',
  },
  lightning: {
    label: 'Lightning Probability',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

export function ChartBarMultiple({
  cloudPct,
  lightningProb,
  year,
}: ChartBarMultipleProps) {
  const chartData = (Object.keys(MONTH_LABELS) as MonthKey[])
    .sort()
    .map((key) => ({
      month: MONTH_LABELS[key],
      cloud: Number((cloudPct[key] ?? 0).toFixed(1)),
      lightning: Number(((lightningProb[key] ?? 0) * 100).toFixed(1)),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Weather Data</CardTitle>
        <CardDescription>{year}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  formatter={(value, name) => {
                    const config = chartConfig[name as keyof typeof chartConfig]
                    return (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                          style={
                            {
                              '--color-bg': `var(--color-${name})`,
                            } as React.CSSProperties
                          }
                        />
                        {config?.label}
                        <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                          {value}
                          <span className="font-normal text-muted-foreground">
                            %
                          </span>
                        </div>
                      </>
                    )
                  }}
                />
              }
            />
            <Bar dataKey="cloud" fill="var(--color-cloud)" radius={4} />
            <Bar dataKey="lightning" fill="var(--color-lightning)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
