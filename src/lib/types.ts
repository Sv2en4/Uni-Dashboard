// TypeScript versions of the database tables (see supabase/migrations/0001_init.sql)

export type Module = {
  id: string
  user_id: string
  name: string
  kuerzel: string
  farbe: string
  archiviert: boolean
  last_touched_at: string | null
  created_at: string
}

export type Task = {
  id: string
  user_id: string
  module_id: string | null
  titel: string
  faellig: string | null // 'YYYY-MM-DD'
  erledigt: boolean
  erledigt_am: string | null
  created_at: string
}

export type EventTyp = 'pruefung' | 'zwischentest' | 'abgabe'

export type UniEvent = {
  id: string
  user_id: string
  module_id: string | null
  titel: string
  typ: EventTyp
  datum: string // 'YYYY-MM-DD'
  erledigt: boolean
  erledigt_am: string | null
  created_at: string
}

export type ModuleStatus = Module & {
  letzte_aktivitaet: string | null
  offene_aufgaben: number
  naechster_termin_id: string | null
  naechster_termin_titel: string | null
  naechster_termin_typ: EventTyp | null
  naechster_termin_datum: string | null
}
