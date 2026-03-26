import { OrdersPageClient } from "./orders-page-client"

type OrdersPageProps = {
  params: Promise<{ slug: string }>
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { slug } = await params

  return <OrdersPageClient slug={slug} />
}
