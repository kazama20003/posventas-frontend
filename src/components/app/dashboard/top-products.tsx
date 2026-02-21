interface Product {
  id: string
  name: string
  sales: number
  revenue: number
  trend: number
}

interface TopProductsProps {
  products: Product[]
}

export function TopProducts({ products }: TopProductsProps) {
  const maxSales = Math.max(...products.map((p) => p.sales), 1)

  return (
    <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/95 p-5 dark:from-card/80 dark:to-card">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">Top Productos</h3>
      <div className="mt-5 space-y-4">
        {products.map((product) => (
          <div key={product.id} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground truncate">
                {product.name}
              </p>
              <p className="text-sm font-bold text-primary whitespace-nowrap">
                ${product.revenue.toLocaleString()}
              </p>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted/60">
              <div
                className="bg-gradient-to-r from-primary to-primary/60 transition-all duration-300"
                style={{ width: `${(product.sales / maxSales) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{product.sales} ventas</span>
              <span className={product.trend > 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-600 dark:text-rose-400 font-semibold"}>
                {product.trend > 0 ? "↑" : "↓"} {Math.abs(product.trend)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
