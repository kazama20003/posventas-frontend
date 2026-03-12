import { CategoriesPageClient } from "./categories-page-client"

type CategoriesPageProps = {
  params: Promise<{ slug: string }>
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { slug } = await params

  return <CategoriesPageClient slug={slug} />
}
