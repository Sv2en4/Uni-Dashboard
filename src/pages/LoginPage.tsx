import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

// Default: email + password, so the password manager (iCloud Keychain) can fill
// it in, also inside the installed app. Fallback: magic link, whose email also
// contains a code to type in (a link from Mail would open in Safari, not the app).
// The password itself is set in the settings while logged in.
type Mode = 'password' | 'link' | 'code'

export function LoginPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  function switchMode(next: Mode) {
    setMode(next)
    setCode('')
    setError('')
  }

  async function signInWithPassword(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(germanError(error.message))
    // on success, AuthProvider gets the session and we redirect automatically
  }

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
    else switchMode('code')
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
  }

  const emailField = (
    <div className="space-y-1.5">
      <Label htmlFor="email">E-Mail</Label>
      <Input
        id="email"
        type="email"
        autoComplete="username"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11"
      />
    </div>
  )

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Uni-Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {mode === 'password' && 'Melde dich mit E-Mail und Passwort an.'}
          {mode === 'link' && 'Du bekommst eine E-Mail mit einem Link und einem Code zum Einloggen.'}
          {mode === 'code' &&
            `Wir haben dir eine E-Mail an ${email.trim()} geschickt. Klick auf den Link oder gib den Code ein.`}
        </p>
      </div>

      {mode === 'password' && (
        <form onSubmit={signInWithPassword} className="space-y-3">
          {emailField}
          <div className="space-y-1.5">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? 'Prüfe …' : 'Einloggen'}
          </Button>
          <Button type="button" variant="ghost" className="h-11 w-full" onClick={() => switchMode('link')}>
            Stattdessen Login-Link per E-Mail
          </Button>
        </form>
      )}

      {mode === 'link' && (
        <form onSubmit={sendLink} className="space-y-3">
          {emailField}
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? 'Wird gesendet …' : 'Login-Link senden'}
          </Button>
          <Button type="button" variant="ghost" className="h-11 w-full" onClick={() => switchMode('password')}>
            Mit Passwort anmelden
          </Button>
        </form>
      )}

      {mode === 'code' && (
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
          <Button type="button" variant="ghost" className="h-11 w-full" onClick={() => switchMode('link')}>
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
  if (m.includes('invalid login credentials'))
    return 'E-Mail oder Passwort ist falsch. Noch kein Passwort? Melde dich per Login-Link an und leg es in den Einstellungen fest.'
  if (m.includes('rate limit') || m.includes('security purposes'))
    return 'Zu viele Versuche. Bitte warte ein paar Minuten.'
  if (m.includes('expired') || m.includes('invalid'))
    return 'Der Code ist ungültig oder abgelaufen.'
  if (m.includes('signups not allowed') || m.includes('signup'))
    return 'Registrierung ist deaktiviert. Nur bestehende Konten können sich anmelden.'
  return `Fehler: ${message}`
}
