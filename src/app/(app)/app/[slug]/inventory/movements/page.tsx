import { InventoryMovementsPageClient } from "./inventory-movements-page-client"

type InventoryMovementsPageProps = {
  params: Promise<{ slug: string }>
}

export default async function InventoryMovementsPage({ params }: InventoryMovementsPageProps) {
  const { slug } = await params

  return <InventoryMovementsPageClient slug={slug} />
}
