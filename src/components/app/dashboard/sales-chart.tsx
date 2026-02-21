'use client'

interface SalesData {
  day: string
  sales: number
}

interface SalesChartProps {
  data: SalesData[]
}

export function SalesChart({ data }: SalesChartProps) {
  const maxSales = Math.max(...data.map((d) => d.sales), 1)

  return (
    <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/95 p-5 dark:from-card/80 dark:to-card">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">Ventas por Día</h3>
      <div className="mt-6 space-y-4">
        {data.map((item) => (
          <div key={item.day} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{item.day}</p>
              <p className="text-sm font-bold text-primary">
                ${item.sales.toLocaleString()}
              </p>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted/60">
              <div
                className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-500 shadow-sm"
                style={{ width: `${(item.sales / maxSales) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
