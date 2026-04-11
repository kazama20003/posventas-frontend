import { ProductFormPageClient } from "../../product-form-page-client"

type EditProductPageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params

  return <ProductFormPageClient mode="edit" productId={id} />
}
