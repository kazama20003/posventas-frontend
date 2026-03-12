import { StoresPageClient } from "./stores-page-client"

type StoresPageProps = {
  params: Promise<{ slug: string }>
}

export default async function StoresPage({ params }: StoresPageProps) {
  const { slug } = await params

  return <StoresPageClient slug={slug} />
}
