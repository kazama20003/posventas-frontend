import { PosPageClient } from "./pos-page-client"

type PosPageProps = {
  params: Promise<{ slug: string }>
}

export default async function PosPage({ params }: PosPageProps) {
  const { slug } = await params

  return <PosPageClient slug={slug} />
}
