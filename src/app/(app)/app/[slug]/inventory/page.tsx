import { InventoryPageClient } from "./inventory-page-client"
type InventoryPageClientPageProps = {
  params: Promise<{ slug: string }>
}

export default async function InventoryPage({ params }: InventoryPageClientPageProps) {
  const { slug } = await params

  return <InventoryPageClient slug={slug} />
}
