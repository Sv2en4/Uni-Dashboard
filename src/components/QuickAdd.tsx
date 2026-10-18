import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { CalendarDays, CircleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { ModuleDot } from '@/components/ModuleDot'
import { Input } from '@/components/ui/input'
import { useCreateItem } from '@/hooks/useItems'
import { useModules } from '@/hooks/useModules'
import { formatDatum } from '@/lib/dates'
import { TYP_LABELS } from '@/lib/labels'
import { parseQuickInput, type Mode } from '@/lib/parser'
import { cn } from '@/lib/utils'

export function QuickAdd() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<Mode>('aufgabe')
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: modules = [] } = useModules()
  const createTask = useCreateItem('tasks')
  const createEvent = useCreateItem('events')

  const parsed = useMemo(() => parseQuickInput(text, mode, modules), [text, mode, modules])

  // Keyboard shortcut: N focuses the field (unless you are typing somewhere else)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (parsed.error) return
    const saved = text
    setText('') // clear right away so the next entry can be typed immediately
    try {
      if (parsed.mode === 'aufgabe') {
        await createTask.mutateAsync({
          titel: parsed.titel,
          module_id: parsed.module?.id ?? null,
          faellig: parsed.datum,
        })
      } else {
        await createEvent.mutateAsync({
          titel: parsed.titel,
          module_id: parsed.module?.id ?? null,
          datum: parsed.datum!,
          typ: parsed.typ,
        })
      }
      toast.success(parsed.mode === 'aufgabe' ? 'Aufgabe angelegt' : 'Termin angelegt', {
        duration: 1500,
      })
    } catch (err) {
      setText(saved)
      toast.error(`Fehler: ${(err as Error).message}`)
    }
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <div
          role="radiogroup"
          aria-label="Art des Eintrags"
          className="flex shrink-0 rounded-lg border p-0.5"
        >
          {(['aufgabe', 'termin'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={parsed.mode === m}
              onClick={() => {
                setMode(m)
                inputRef.current?.focus()
              }}
              className={cn(
                'rounded-md px-3 text-sm transition-colors',
                parsed.mode === m
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m === 'aufgabe' ? 'Aufgabe' : 'Termin'}
            </button>
          ))}
        </div>
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && inputRef.current?.blur()}
          placeholder={
            mode === 'aufgabe' ? 'Übungsblatt 3 #stat fr' : 'Klausur #stat 12.02. !pruefung'
          }
          aria-label="Neuer Eintrag"
          enterKeyHint="done"
          autoComplete="off"
          className="h-11 text-base"
        />
      </div>
      <Preview text={text} parsed={parsed} />
    </form>
  )
}

function Preview({ text, parsed }: { text: string; parsed: ReturnType<typeof parseQuickInput> }) {
  if (!text.trim()) {
    return (
      <p className="px-1 text-xs text-muted-foreground">
        <kbd className="rounded border px-1 font-sans">N</kbd> zum Eintippen · #kürzel · heute,
        morgen, fr, 24.10. · !pruefung, !test, !abgabe
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">
        {parsed.mode === 'aufgabe' ? 'Aufgabe' : TYP_LABELS[parsed.typ]}
      </span>
      {parsed.titel && <span className="truncate">„{parsed.titel}“</span>}
      {parsed.module && (
        <span className="flex items-center gap-1.5">
          <ModuleDot color={parsed.module.farbe} className="size-2" />
          {parsed.module.name}
        </span>
      )}
      {parsed.unknownKuerzel && (
        <span className="text-orange-600 dark:text-orange-400">
          {parsed.unknownKuerzel} unbekannt
        </span>
      )}
      <span className="flex items-center gap-1">
        <CalendarDays className="size-3" />
        {parsed.datum ? formatDatum(parsed.datum) : 'ohne Datum'}
      </span>
      {parsed.error && (
        <span className="flex items-center gap-1 text-destructive">
          <CircleAlert className="size-3" />
          {parsed.error}
        </span>
      )}
    </div>
  )
}
