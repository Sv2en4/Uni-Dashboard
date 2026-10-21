import { useState, type FormEvent } from 'react'
import { Archive, ArchiveRestore, ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ModuleDialog } from '@/components/ModuleDialog'
import { ModuleDot } from '@/components/ModuleDot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useModules, useUpdateModule } from '@/hooks/useModules'
import { supabase } from '@/lib/supabase'
import type { Module } from '@/lib/types'

export function SettingsPage() {
  const { data: modules = [], isLoading, error } = useModules()
  const update = useUpdateModule()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Module | undefined>()
  const [showArchived, setShowArchived] = useState(false)

  const active = modules.filter((m) => !m.archiviert)
  const archived = modules.filter((m) => m.archiviert)

  function openDialog(module?: Module) {
    setEditing(module)
    setDialogOpen(true)
  }

  function setArchived(module: Module, archiviert: boolean) {
    update.mutate(
      { id: module.id, archiviert },
      {
        onSuccess: () =>
          toast(archiviert ? `„${module.name}“ archiviert` : `„${module.name}“ wiederhergestellt`),
        onError: (err) => toast.error(`Fehler: ${err.message}`),
      },
    )
  }

  return (
    <div className="space-y-8 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Fächer</h2>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus /> Neues Fach
          </Button>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Lädt …</p>}
        {error && <p className="text-sm text-destructive">Fehler: {error.message}</p>}
        {!isLoading && active.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Noch keine Fächer. Leg dein erstes Fach an.
          </p>
        )}

        {active.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {active.map((m) => (
              <ModuleRow
                key={m.id}
                module={m}
                onEdit={() => openDialog(m)}
                action={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${m.name} archivieren`}
                    title="Archivieren"
                    onClick={() => setArchived(m, true)}
                  >
                    <Archive />
                  </Button>
                }
              />
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 && (
        <section className="space-y-3">
          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setShowArchived((v) => !v)}
          >
            <ChevronRight className={showArchived ? 'size-4 rotate-90 transition' : 'size-4 transition'} />
            Archiviert ({archived.length})
          </button>
          {showArchived && (
            <ul className="divide-y rounded-lg border">
              {archived.map((m) => (
                <ModuleRow
                  key={m.id}
                  module={m}
                  muted
                  onEdit={() => openDialog(m)}
                  action={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${m.name} wiederherstellen`}
                      title="Wiederherstellen"
                      onClick={() => setArchived(m, false)}
                    >
                      <ArchiveRestore />
                    </Button>
                  }
                />
              ))}
            </ul>
          )}
        </section>
      )}

      <PasswordSection />

      <ModuleDialog open={dialogOpen} onOpenChange={setDialogOpen} module={editing} />
    </div>
  )
}

// Sets the password for the email + password login, so later logins on any
// device need no email: the password manager fills in both fields.
function PasswordSection() {
  const { session } = useAuth()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      toast.error(passwordError(error.message))
      return
    }
    setPassword('')
    toast('Passwort gespeichert')
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Passwort</h2>
      <form onSubmit={save} className="space-y-3 rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          Damit kannst du dich auf jedem Gerät mit E-Mail und Passwort anmelden, ohne Login-Link.
          Lass es vom Schlüsselbund speichern, dann reicht später Face ID oder Touch ID.
        </p>
        {/* hidden, tells the password manager which account the password belongs to */}
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={session?.user.email ?? ''}
          readOnly
          hidden
        />
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Neues Passwort</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </div>
        <Button type="submit" className="h-11" disabled={busy}>
          {busy ? 'Speichert …' : 'Passwort speichern'}
        </Button>
      </form>
    </section>
  )
}

function passwordError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('different from the old'))
    return 'Das neue Passwort muss sich vom alten unterscheiden.'
  if (m.includes('weak') || m.includes('at least'))
    return 'Das Passwort ist zu schwach. Nimm ein längeres.'
  if (m.includes('reauthentication'))
    return 'Supabase verlangt eine erneute Bestätigung. Melde dich ab und wieder an, dann versuch es noch einmal.'
  return `Fehler: ${message}`
}

function ModuleRow({
  module,
  onEdit,
  action,
  muted,
}: {
  module: Module
  onEdit: () => void
  action: React.ReactNode
  muted?: boolean
}) {
  return (
    <li className="flex items-center gap-2 pr-2">
      <button
        type="button"
        onClick={onEdit}
        className="flex min-h-12 flex-1 items-center gap-3 rounded-l-lg px-4 text-left hover:bg-muted/50"
      >
        <ModuleDot color={module.farbe} className={muted ? 'opacity-50' : undefined} />
        <span className={muted ? 'text-muted-foreground' : undefined}>{module.name}</span>
        <span className="text-sm text-muted-foreground">#{module.kuerzel}</span>
      </button>
      {action}
    </li>
  )
}
