import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase'

type Status = 'pruefe' | 'ok' | 'fehler'

// Temporary page for stage 1: checks whether Supabase is reachable.
export default function App() {
  const [status, setStatus] = useState<Status>('pruefe')
  const [detail, setDetail] = useState('')

  async function check() {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: { apikey: supabaseAnonKey },
      })
      setStatus(res.ok ? 'ok' : 'fehler')
      setDetail(res.ok ? '' : `HTTP ${res.status}`)
    } catch (e) {
      setStatus('fehler')
      setDetail(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    void check()
  }, [])

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Uni-Dashboard</h1>
      <p className="text-muted-foreground">Etappe 1: Verbindung zu Supabase</p>
      <div className="rounded-lg border p-4 text-sm">
        {status === 'pruefe' && 'Prüfe Verbindung …'}
        {status === 'ok' && '✅ Supabase ist verbunden.'}
        {status === 'fehler' && `❌ Keine Verbindung. ${detail}`}
      </div>
      <Button
        onClick={() => {
          setStatus('pruefe')
          void check()
        }}
        className="self-start"
      >
        Erneut prüfen
      </Button>
    </main>
  )
}
