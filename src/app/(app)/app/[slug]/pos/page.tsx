import Image from "next/image"
import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Smartphone,
  Tag,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

type PosPageProps = {
  params: Promise<{ slug: string }>
}

type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  image: string
}

type CartItem = {
  productId: string
  name: string
  qty: number
  price: number
}

const products: Product[] = [
  {
    id: "P-001",
    name: "Mouse Inalambrico",
    category: "Tecnologia",
    price: 349,
    stock: 25,
    image: "/products/mouse.svg",
  },
  {
    id: "P-002",
    name: "Audifonos BT",
    category: "Tecnologia",
    price: 599,
    stock: 18,
    image: "/products/audifonos.svg",
  },
  {
    id: "P-003",
    name: "Cuaderno Ejecutivo",
    category: "Papeleria",
    price: 95,
    stock: 42,
    image: "/products/cuaderno.svg",
  },
  {
    id: "P-004",
    name: "Foco LED 12W",
    category: "Hogar",
    price: 79,
    stock: 65,
    image: "/products/foco-led.svg",
  },
  {
    id: "P-005",
    name: "Shampoo Herbal",
    category: "Cuidado Personal",
    price: 128,
    stock: 34,
    image: "/products/shampoo.svg",
  },
  {
    id: "P-006",
    name: "Cable USB-C 1m",
    category: "Accesorios",
    price: 149,
    stock: 30,
    image: "/products/cable-usbc.svg",
  },
  {
    id: "P-007",
    name: "Taza Termica 500ml",
    category: "Hogar",
    price: 260,
    stock: 20,
    image: "/products/taza-termica.svg",
  },
  {
    id: "P-008",
    name: "Mochila Urbana",
    category: "Accesorios",
    price: 699,
    stock: 14,
    image: "/products/mochila.svg",
  },
]

const cartItems: CartItem[] = [
  { productId: "P-001", name: "Mouse Inalambrico", qty: 1, price: 349 },
  { productId: "P-003", name: "Cuaderno Ejecutivo", qty: 2, price: 95 },
  { productId: "P-006", name: "Cable USB-C 1m", qty: 1, price: 149 },
]

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
})

export default async function PosPage({ params }: PosPageProps) {
  const { slug } = await params

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const discount = 50
  const taxes = Math.round(subtotal * 0.16)
  const total = subtotal - discount + taxes
  const categories = Array.from(new Set(products.map((product) => product.category)))

  return (
    <main className="space-y-4 p-4">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Punto de venta
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Nueva venta POS</h1>
          <p className="text-sm text-muted-foreground">
            Catalogo mixto con productos de tecnologia, hogar, oficina y mas para{" "}
            <span className="font-semibold text-foreground">{slug}</span>.
          </p>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Catalogo de productos</CardTitle>
                <CardDescription>Muestra visual de productos en diferentes categorias.</CardDescription>
              </div>
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Buscar producto por nombre o codigo" className="pl-9" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                type="button"
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
            <Separator />
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg border border-border/70 bg-gradient-to-br from-card to-card/95 p-3 dark:from-card/80 dark:to-card"
                >
                  <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-md border border-border/60 bg-muted/20">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      {product.category}
                    </div>
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">Stock disponible: {product.stock}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-lg font-bold text-foreground">{money.format(product.price)}</p>
                    <Button size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Agregar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Carrito de compra
            </CardTitle>
            <CardDescription>{cartItems.length} productos en la venta actual.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.productId} className="rounded-lg border border-border/70 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{money.format(item.price)} c/u</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {money.format(item.price * item.qty)}
                    </p>
                  </div>

                  <div className="mt-2 inline-flex items-center rounded-md border border-border">
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted"
                      type="button"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="inline-flex h-8 min-w-8 items-center justify-center border-x border-border px-2 text-sm font-medium">
                      {item.qty}
                    </span>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted"
                      type="button"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{money.format(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Descuento</span>
                <span className="font-medium text-foreground">-{money.format(discount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">IVA (16%)</span>
                <span className="font-medium text-foreground">{money.format(taxes)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">{money.format(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Metodo de pago
              </p>
              <div className="grid gap-2">
                <button
                  className="inline-flex items-center justify-between rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Tarjeta
                  </span>
                  Seleccionado
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  type="button"
                >
                  <Banknote className="h-4 w-4" />
                  Efectivo
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  type="button"
                >
                  <Smartphone className="h-4 w-4" />
                  Transferencia
                </button>
              </div>
            </div>

            <Button className="w-full">Cobrar {money.format(total)}</Button>
            <Button variant="outline" className="w-full">
              Guardar como venta pendiente
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
