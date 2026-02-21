'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
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
} from '@/components/ui/chart'

interface ConversionChartProps {
  data: Array<{
    date: string
    conversion: number
    avgOrder: number
  }>
}

export function ConversionChart({ data }: ConversionChartProps) {
  return (
    <Card className="rounded-xl border-border/50 bg-gradient-to-br from-card to-card/95 dark:from-card/80 dark:to-card">
      <CardHeader>
        <CardTitle>Conversión y Ticket Promedio</CardTitle>
        <CardDescription>
          Tasa de conversión (%) y valor promedio de órdenes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            conversion: {
              label: 'Tasa de Conversión (%)',
              color: 'var(--chart-3)',
            },
            avgOrder: {
              label: 'Ticket Promedio ($)',
              color: 'var(--chart-4)',
            },
          }}
          className="h-[350px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorAvgOrder" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                stroke="var(--muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="conversion"
                stroke="var(--chart-3)"
                fillOpacity={1}
                fill="url(#colorConversion)"
                name="Tasa de Conversión"
              />
              <Area
                type="monotone"
                dataKey="avgOrder"
                stroke="var(--chart-4)"
                fillOpacity={1}
                fill="url(#colorAvgOrder)"
                name="Ticket Promedio"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
