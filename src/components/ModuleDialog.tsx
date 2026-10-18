import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateModule, useUpdateModule } from '@/hooks/useModules'
import { MODULE_COLORS, moduleErrorMessage, normalizeKuerzel, suggestKuerzel } from '@/lib/modules'
import type { Module } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // undefined = create a new module
  module?: Module
}

export function ModuleDialog({ open, onOpenChange, module }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* key resets the form whenever another module is opened */}
        <ModuleForm key={module?.id ?? 'neu'} module={module} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function ModuleForm({ module, onDone }: { module?: Module; onDone: () => void }) {
  const [name, setName] = useState(module?.name ?? '')
  const [kuerzel, setKuerzel] = useState(module?.kuerzel ?? '')
  // while the user has not typed a shortcut, suggest one from the name
  const [kuerzelTouched, setKuerzelTouched] = useState(Boolean(module))
  const [farbe, setFarbe] = useState<string>(module?.farbe ?? MODULE_COLORS[0].value)
  const create = useCreateModule()
  const update = useUpdateModule()
  const busy = create.isPending || update.isPending

  async function submit(e: FormEvent) {
    e.preventDefault()
    const input = { name: name.trim(), kuerzel, farbe }
    if (!input.name || !input.kuerzel) return
    try {
      if (module) await update.mutateAsync({ id: module.id, ...input })
      else await create.mutateAsync(input)
      onDone()
    } catch (err) {
      toast.error(moduleErrorMessage(err as { code?: string; message: string }))
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{module ? 'Fach bearbeiten' : 'Neues Fach'}</DialogTitle>
        <DialogDescription>
          Das Kürzel nutzt du in der Schnelleingabe, z.B. „Übungsblatt 3 #{kuerzel || 'stat'}“.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="modul-name">Name</Label>
        <Input
          id="modul-name"
          required
          autoFocus
          value={name}
          placeholder="Statistik"
          className="h-11"
          onChange={(e) => {
            setName(e.target.value)
            if (!kuerzelTouched) setKuerzel(suggestKuerzel(e.target.value))
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="modul-kuerzel">Kürzel</Label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
            #
          </span>
          <Input
            id="modul-kuerzel"
            required
            value={kuerzel}
            placeholder="stat"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-11 pl-6"
            onChange={(e) => {
              setKuerzelTouched(true)
              setKuerzel(normalizeKuerzel(e.target.value))
            }}
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Farbe</legend>
        <div className="flex flex-wrap gap-2">
          {MODULE_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-label={c.name}
              aria-pressed={farbe === c.value}
              onClick={() => setFarbe(c.value)}
              className={cn(
                'flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition',
                farbe === c.value && 'ring-2 ring-foreground/40',
              )}
              style={{ backgroundColor: c.value }}
            >
              {farbe === c.value && <Check className="size-4 text-white" />}
            </button>
          ))}
        </div>
      </fieldset>

      <DialogFooter>
        <Button type="submit" className="h-11 sm:h-9" disabled={busy || !name.trim() || !kuerzel}>
          {module ? 'Speichern' : 'Anlegen'}
        </Button>
      </DialogFooter>
    </form>
  )
}
