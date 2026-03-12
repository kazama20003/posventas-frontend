import { WarehousesPageClient } from "./warehouses-page-client"

type WarehousesPageProps = {
  params: Promise<{ slug: string }>
}

export default async function WarehousesPage({ params }: WarehousesPageProps) {
  const { slug } = await params

  return <WarehousesPageClient slug={slug} />
}
