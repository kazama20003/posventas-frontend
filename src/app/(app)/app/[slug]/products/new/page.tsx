import { ProductFormPageClient } from "../product-form-page-client"

type NewProductPageProps = {
  params: Promise<{ slug: string }>
}

export default async function NewProductPage({ params }: NewProductPageProps) {
  await params

  return <ProductFormPageClient mode="create" />
}
