import { useAuth } from '@/hooks/useAuth'

// Placeholder until stage 6.
export function DashboardPage() {
  const { session } = useAuth()
  return (
    <div className="space-y-2 py-8">
      <h1 className="text-xl font-semibold">Hallo!</h1>
      <p className="text-muted-foreground">Eingeloggt als {session?.user.email}</p>
    </div>
  )
}
