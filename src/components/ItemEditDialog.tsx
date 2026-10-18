import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ModuleDot } from '@/components/ModuleDot'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDeleteItem, useUpdateItem } from '@/hooks/useItems'
import { useModules } from '@/hooks/useModules'
import { TYP_LABELS } from '@/lib/labels'
import type { EventTyp, Task, UniEvent } from '@/lib/types'

// Simple edit dialog: title, module, date (+ type for events), delete.
export type EditTarget = { kind: 'task'; item: Task } | { kind: 'event'; item: UniEvent }

type Props = { target: EditTarget | null; onClose: () => void }

export function ItemEditDialog({ target, onClose }: Props) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {target && <EditForm key={target.item.id} target={target} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

const NO_MODULE = 'none' // Select cannot use '' as a value

function EditForm({ target, onClose }: { target: EditTarget; onClose: () => void }) {
  const isTask = target.kind === 'task'
  const table = isTask ? 'tasks' : 'events'
  const { data: modules = [] } = useModules()
  const update = useUpdateItem(table)
  const remove = useDeleteItem(table)

  const [titel, setTitel] = useState(target.item.titel)
  const [moduleId, setModuleId] = useState(target.item.module_id ?? NO_MODULE)
  const [datum, setDatum] = useState(
    (target.kind === 'task' ? target.item.faellig : target.item.datum) ?? '',
  )
  const [typ, setTyp] = useState<EventTyp>(target.kind === 'event' ? target.item.typ : 'abgabe')

  // archived modules only appear if this item still belongs to one
  const selectable = modules.filter((m) => !m.archiviert || m.id === target.item.module_id)
  const canSave = titel.trim() !== '' && (isTask || datum !== '')

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!canSave) return
    const common = {
      id: target.item.id,
      titel: titel.trim(),
      module_id: moduleId === NO_MODULE ? null : moduleId,
    }
    try {
      await update.mutateAsync(
        isTask ? { ...common, faellig: datum || null } : { ...common, datum, typ },
      )
      onClose()
    } catch (err) {
      toast.error(`Fehler: ${(err as Error).message}`)
    }
  }

  async function del() {
    try {
      await remove.mutateAsync(target.item.id)
      toast(`„${target.item.titel}“ gelöscht`)
      onClose()
    } catch (err) {
      toast.error(`Fehler: ${(err as Error).message}`)
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{isTask ? 'Aufgabe bearbeiten' : 'Termin bearbeiten'}</DialogTitle>
        <DialogDescription className="sr-only">Titel, Fach und Datum ändern oder löschen.</DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="edit-titel">Titel</Label>
        <Input
          id="edit-titel"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Fach</Label>
          <Select value={moduleId} onValueChange={setModuleId}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_MODULE}>Kein Fach</SelectItem>
              {selectable.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <ModuleDot color={m.farbe} />
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isTask && (
          <div className="space-y-1.5">
            <Label>Typ</Label>
            <Select value={typ} onValueChange={(v) => setTyp(v as EventTyp)}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TYP_LABELS) as EventTyp[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYP_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="edit-datum">{isTask ? 'Fällig' : 'Datum'}</Label>
          <div className="flex gap-1">
            <Input
              id="edit-datum"
              type="date"
              value={datum}
              required={!isTask}
              onChange={(e) => setDatum(e.target.value)}
              className="h-11"
            />
          </div>
          {isTask && datum && (
            <button
              type="button"
              onClick={() => setDatum('')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Datum entfernen
            </button>
          )}
        </div>
      </div>

      <DialogFooter className="flex-row justify-between sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-destructive hover:text-destructive sm:h-9"
          onClick={del}
          disabled={remove.isPending}
        >
          <Trash2 /> Löschen
        </Button>
        <Button type="submit" className="h-11 sm:h-9" disabled={!canSave || update.isPending}>
          Speichern
        </Button>
      </DialogFooter>
    </form>
  )
}
