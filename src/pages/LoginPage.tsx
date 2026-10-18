import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

// Login with magic link. The email also contains a code: typing it in works
// inside the installed iPhone app, where opening the link would land in Safari.
export function LoginPage() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  async function sendLink(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) setError(germanError(error.message))
    else setSent(true)
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    })
    setBusy(false)
    if (error) setError(germanError(error.message))
    // on success, AuthProvider gets the session and we redirect automatically
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Uni-Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {sent
            ? `Wir haben dir eine E-Mail an ${email.trim()} geschickt. Klick auf den Link oder gib den Code ein.`
            : 'Melde dich mit deiner E-Mail-Adresse an. Du bekommst einen Link zum Einloggen.'}
        </p>
      </div>

      {!sent ? (
        <form onSubmit={sendLink} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? 'Wird gesendet …' : 'Login-Link senden'}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="code">Code aus der E-Mail</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="h-11 tracking-widest"
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? 'Prüfe …' : 'Einloggen'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full"
            onClick={() => {
              setSent(false)
              setCode('')
              setError('')
            }}
          >
            Andere E-Mail verwenden
          </Button>
        </form>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </main>
  )
}

function germanError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('rate limit') || m.includes('security purposes'))
    return 'Zu viele Versuche. Bitte warte ein paar Minuten.'
  if (m.includes('expired') || m.includes('invalid'))
    return 'Der Code ist ungültig oder abgelaufen.'
  if (m.includes('signups not allowed') || m.includes('signup'))
    return 'Registrierung ist deaktiviert. Nur bestehende Konten können sich anmelden.'
  return `Fehler: ${message}`
}
