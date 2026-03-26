import { PurchaseOrdersPageClient } from "./purchase-orders-page-client"

type PurchaseOrdersPageProps = {
  params: Promise<{ slug: string }>
}

export default async function PurchaseOrdersPage({ params }: PurchaseOrdersPageProps) {
  const { slug } = await params

  return <PurchaseOrdersPageClient slug={slug} />
}
