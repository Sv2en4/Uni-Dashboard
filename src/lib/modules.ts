// Helpers for modules that are not React components.

// Fixed palette for module colors: readable in light and dark mode.
export const MODULE_COLORS = [
  { name: 'Violett', value: '#8b5cf6' },
  { name: 'Blau', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Grün', value: '#22c55e' },
  { name: 'Gelb', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rot', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Grau', value: '#64748b' },
] as const

// Same rule as the database check: lowercase letters, digits, umlauts, - and _
export function normalizeKuerzel(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9äöüß_-]/g, '')
}

// "Statistik II" → "stat"
export function suggestKuerzel(name: string): string {
  return normalizeKuerzel(name).slice(0, 4)
}

// Translate Postgres errors from Supabase into German messages.
export function moduleErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === '23505') return 'Dieses Kürzel ist schon vergeben.'
  if (error.code === '23514') return 'Bitte Name, Kürzel und Farbe prüfen.'
  return `Fehler: ${error.message}`
}
