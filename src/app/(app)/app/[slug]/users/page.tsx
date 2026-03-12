import { UsersPageClient } from "./users-page-client"

type UsersPageProps = {
  params: Promise<{ slug: string }>
}

export default async function UsersPage({ params }: UsersPageProps) {
  const { slug } = await params

  return <UsersPageClient slug={slug} />
}
