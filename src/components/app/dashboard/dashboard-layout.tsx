'use client'

import { DollarSign, Users, ShoppingCart, TrendingUp } from "lucide-react"
import { MetricCard } from "./metrics/metric-card"
import { RecentActivity } from "@/components/app/dashboard/recent-activity"
import { TopProducts } from "@/components/app/dashboard/top-products"
import { SalesChart } from "@/components/app/dashboard/sales-chart"
import { RevenueChart } from "@/components/app/dashboard/revenue-chart"
import { ConversionChart } from "@/components/app/dashboard/conversion-chart"

export function DashboardLayout() {
  // Mock data - reemplazar con datos reales de la API
  const metrics = [
    {
      icon: DollarSign,
      label: "Ingresos Totales",
      value: "$12,430",
      change: { value: 12.5, isPositive: true },
    },
    {
      icon: ShoppingCart,
      label: "Número de Órdenes",
      value: "248",
      change: { value: 8.2, isPositive: true },
    },
    {
      icon: Users,
      label: "Clientes Nuevos",
      value: "42",
      change: { value: 3.1, isPositive: false },
    },
    {
      icon: TrendingUp,
      label: "Tasa de Conversión",
      value: "3.24%",
      change: { value: 1.8, isPositive: true },
    },
  ]

  const activities = [
    {
      id: "1",
      icon: ShoppingCart,
      title: "Venta Completada",
      description: "Venta de $450.00 - ID: #2024001",
      timestamp: "hace 5 minutos",
      status: "success" as const,
    },
    {
      id: "2",
      icon: Users,
      title: "Nuevo Cliente Registrado",
      description: "Cliente: Juan Pérez García",
      timestamp: "hace 15 minutos",
      status: "success" as const,
    },
    {
      id: "3",
      icon: ShoppingCart,
      title: "Venta en Proceso",
      description: "Venta pendiente - ID: #2024002",
      timestamp: "hace 25 minutos",
      status: "pending" as const,
    },
    {
      id: "4",
      icon: TrendingUp,
      title: "Inventario Bajo",
      description: "Producto: Café Premium - Stock: 5 unidades",
      timestamp: "hace 1 hora",
      status: "warning" as const,
    },
  ]

  const topProducts = [
    { id: "1", name: "Café Premium", sales: 45, revenue: 1350, trend: 12.5 },
    { id: "2", name: "Croissant Francés", sales: 38, revenue: 228, trend: 8.2 },
    { id: "3", name: "Sandwich Club", sales: 32, revenue: 480, trend: -3.1 },
    { id: "4", name: "Jugo Natural", sales: 28, revenue: 140, trend: 5.8 },
    { id: "5", name: "Postre Chocolate", sales: 22, revenue: 330, trend: 2.1 },
  ]

  const salesData = [
    { day: "Lunes", sales: 2400 },
    { day: "Martes", sales: 1398 },
    { day: "Miércoles", sales: 3800 },
    { day: "Jueves", sales: 3908 },
    { day: "Viernes", sales: 4800 },
    { day: "Sábado", sales: 3800 },
    { day: "Domingo", sales: 4300 },
  ]

  const revenueData = [
    { date: "1 Feb", revenue: 2400, orders: 12 },
    { date: "2 Feb", revenue: 2210, orders: 15 },
    { date: "3 Feb", revenue: 2290, orders: 18 },
    { date: "4 Feb", revenue: 2000, orders: 10 },
    { date: "5 Feb", revenue: 2181, orders: 22 },
    { date: "6 Feb", revenue: 2500, orders: 25 },
    { date: "7 Feb", revenue: 2100, orders: 20 },
    { date: "8 Feb", revenue: 2100, orders: 19 },
    { date: "9 Feb", revenue: 3800, orders: 28 },
    { date: "10 Feb", revenue: 3200, orders: 26 },
    { date: "11 Feb", revenue: 2600, orders: 21 },
    { date: "12 Feb", revenue: 4200, orders: 32 },
    { date: "13 Feb", revenue: 3900, orders: 30 },
    { date: "14 Feb", revenue: 3400, orders: 24 },
    { date: "15 Feb", revenue: 4500, orders: 35 },
  ]

  const conversionData = [
    { date: "1 Feb", conversion: 2.8, avgOrder: 198 },
    { date: "2 Feb", conversion: 3.2, avgOrder: 147 },
    { date: "3 Feb", conversion: 3.5, avgOrder: 127 },
    { date: "4 Feb", conversion: 2.5, avgOrder: 200 },
    { date: "5 Feb", conversion: 4.1, avgOrder: 99 },
    { date: "6 Feb", conversion: 4.2, avgOrder: 100 },
    { date: "7 Feb", conversion: 3.8, avgOrder: 105 },
    { date: "8 Feb", conversion: 3.9, avgOrder: 110 },
    { date: "9 Feb", conversion: 5.2, avgOrder: 135 },
    { date: "10 Feb", conversion: 4.8, avgOrder: 123 },
    { date: "11 Feb", conversion: 4.0, avgOrder: 123 },
    { date: "12 Feb", conversion: 5.5, avgOrder: 131 },
    { date: "13 Feb", conversion: 5.0, avgOrder: 130 },
    { date: "14 Feb", conversion: 4.4, avgOrder: 141 },
    { date: "15 Feb", conversion: 5.6, avgOrder: 128 },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RevenueChart data={revenueData} />
        <ConversionChart data={conversionData} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SalesChart data={salesData} />
          <RecentActivity activities={activities} />
        </div>
        <TopProducts products={topProducts} />
      </div>
    </div>
  )
}
