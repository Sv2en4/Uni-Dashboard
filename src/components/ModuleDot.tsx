import { cn } from '@/lib/utils'

// Small colored dot that identifies a module everywhere in the app.
export function ModuleDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color }}
    />
  )
}
