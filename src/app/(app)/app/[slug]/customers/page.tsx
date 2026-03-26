import { CustomersPageClient } from "./customers-page-client"

type CustomersPageProps = {
  params: Promise<{ slug: string }>
}

export default async function CustomersPage({ params }: CustomersPageProps) {
  const { slug } = await params

  return <CustomersPageClient slug={slug} />
}
