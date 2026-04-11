import { CashPageClient } from "./cash-page-client"

type CashPageProps = {
  params: Promise<{ slug: string }>
}

export default async function CashPage({ params }: CashPageProps) {
  const { slug } = await params

  return <CashPageClient slug={slug} />
}
