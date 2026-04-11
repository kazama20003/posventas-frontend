import { ProductsPageClient } from "./products-page-client"

type ProductsPageProps = {
  params: Promise<{ slug: string }>
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  await params

  return <ProductsPageClient />
}
