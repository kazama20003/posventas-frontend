type DashboardPageProps = {
  params: Promise<{ slug: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params

  return (
    <main className="space-y-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Dashboard de {slug}</p>
    </main>
  )
}
