import { SuppliersPageClient } from "./suppliers-page-client"

type SuppliersPageProps = {
  params: Promise<{ slug: string }>
}

export default async function SuppliersPage({ params }: SuppliersPageProps) {
  const { slug } = await params

  return <SuppliersPageClient slug={slug} />
}
