# Uni-Dashboard

Personal single-user dashboard for university life. Full original spec: `uni-dashboard-prompt.md`.

## Working with the user
- User knows Python and SQL, not web development: briefly explain important steps.
- Build in stages (see below). **Stop after each stage** so the user can test. Commit after each stage.
- When choosing between approaches, pick the simpler one and say why.

## Goal
At a glance: what is still to do, when the next deadline/test is, when I last worked on each module.
Adding and ticking off tasks/events must take seconds, on MacBook and iPhone.
**Out of scope:** study-time tracker, per-module progress bars, grades, timetable.

## Stack
- Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- react-router (`/`, `/einstellungen`, `/login`)
- TanStack Query for data fetching, optimistic updates and undo
- date-fns with German locale (`de`)
- Supabase (Postgres, Auth, RLS). Migrations are SQL files in `supabase/migrations/`, run manually in the Supabase SQL Editor (no Supabase CLI)
- Vitest for unit tests (at minimum `src/lib/parser.ts` and date helpers)
- PWA via `vite-plugin-pwa`
- Hosting: Vercel, connected to GitHub (via web UI, no CLI)
- Auth: magic link (email) only. Single user. **Remind the user to disable new sign-ups in Supabase after they register.**
  The email template also contains the one-time code (`{{ .Token }}`); the login page accepts it too, because on iOS a magic link opens in Safari, not in the installed PWA.
- Secrets only in `.env.local` (git-ignored). Keep `.env.example` without values.

## Data model
- **modules**: id, user_id, name, kuerzel, farbe, archiviert (bool), last_touched_at (timestamptz null), created_at
- **tasks**: id, user_id, module_id (null), titel, faellig (date null), erledigt, erledigt_am (timestamptz null), created_at
- **events**: id, user_id, module_id (**nullable**, deviates from spec), titel, typ (`pruefung` | `zwischentest` | `abgabe`), datum (date, required), erledigt, erledigt_am, created_at
- RLS on all tables: users only see and change their own rows.
- View `module_status`: per module, last activity = max(erledigt_am of its tasks and events, modules.last_touched_at), plus count of open tasks and next open event.
- `user_id` defaults to `auth.uid()`: the frontend never sends it.
- `erledigt_am` is set/cleared by a DB trigger when `erledigt` changes: the frontend only toggles `erledigt`.
- `module_status` uses `security_invoker = true` (respects RLS) and computes "today" in `Europe/Berlin`.
- Migrations are run manually in the SQL Editor; never edit an applied migration, add a new numbered file instead.

## Decisions on ambiguous points
1. Events can exist without a module (`module_id` nullable).
2. A weekday like `fr` means the next occurrence, **including today** if today is that day.
3. A date like `24.10.` that already passed this year means next year.
4. "Diese Woche" = from tomorrow through Sunday of the current week (ISO week, Monday start).
5. Past events: `pruefung`/`zwischentest` disappear automatically once the date has passed. `abgabe` stays visible (as overdue) until ticked off.
6. Design: font **Geist**, accent color **violet**.
7. Quick entry in event mode without a date: save is blocked, preview shows "Datum fehlt".

## Quick entry syntax
- `#kuerzel` sets the module; `heute`, `morgen`, weekday abbreviations (`mo di mi do fr sa so`), `24.10.` set the date
- Events: `!pruefung`, `!test` (→ zwischentest), `!abgabe` (default: abgabe)
- Extras: `übermorgen`, full weekday names, `!klausur`/`!prüfung` (→ pruefung), `24.10.2027`. A `!type` switches the entry to "Termin" even if the toggle says "Aufgabe".
- Parser lives in `src/lib/parser.ts` with tests in `parser.test.ts` (`npm test`). Keep tests green when changing it.
- Enter saves, field stays focused; `N` focuses the field; preview of parsed values below the field

## UI rules
- Main page, top to bottom (one column on mobile in this order): quick entry, upcoming events, module grid, tasks. Settings on a separate plain page.
- Event cards: countdown ("heute", "morgen", "in 3 Tagen"); urgency red ≤3 days, orange ≤7, else neutral. Only abgaben can be ticked off on cards.
- Module cards: sorted by longest inactivity first; traffic light green <5 days, orange 5–9, red ≥10, grey if never; "Heute gearbeitet" button sets last_touched_at; click filters tasks.
- All thresholds live in `src/lib/constants.ts`.
- Task groups: Überfällig, Heute, Diese Woche, Später, Ohne Datum (hide empty). Checkbox with short animation + "Rückgängig" toast. Click opens edit dialog (title, module, date, delete). Done tasks hidden behind a toggle.
- Minimal design (Linear / Things 3 / Vercel): neutral palette, one accent, color only with meaning, thin borders instead of shadows, rounded corners, subtle transitions. Light/dark mode follows the system. Touch-friendly controls. **All UI text in German.**

## Stages
1. Project setup, run locally, connect Supabase (guide through dashboard)
2. Schema, RLS and view as migration
3. Magic link login
4. Manage modules in settings
5. Create/edit/complete tasks and events, including quick entry
6. Main page with all four sections, countdown and last-activity logic
7. Design polish, dark mode, mobile view
8. PWA + deploy to Vercel (guide through GitHub and Vercel)
   - Add the Vercel URL to Supabase Auth → URL Configuration (Site URL + Redirect URLs).

## Status and deployment
- All 8 stages done (2026-10-18). Live: https://uni-dashboard-red.vercel.app
- GitHub repo `uni-dashboard` (private), pushed via GitHub Desktop. Vercel deploys every push to `main` automatically.
- Env vars on Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Supabase Auth URLs: Site URL = Vercel URL; Redirect URLs = Vercel URL `/**` and `http://localhost:5173/**`.
- Sign-ups are disabled in Supabase (single user).
- Local dev: `npm run dev` (http://localhost:5173), `npm test`, `npm run build`.

## Open TODO: login on the iPhone (postponed by the user)
Why: on iOS, the installed home-screen app has its own storage. A magic link from Mail always opens in Safari, so the app itself stays logged out. Fix: log in with the code from the email instead.
Already done in code: `LoginPage.tsx` shows a code field after sending the email (`verifyOtp`, type `email`).
Still to do (Supabase dashboard only, no code changes):
1. Set up custom SMTP (Project Settings → Authentication → SMTP), e.g. Gmail with an app password or Resend. Required, because email templates are locked with the built-in sender. Also lifts the limit of a few emails per hour.
2. Authentication → Emails → Templates: add the code to "Magic Link" (and "Confirm signup"):
   `<p><a href="{{ .ConfirmationURL }}">Hier klicken zum Einloggen</a></p><p>Oder diesen Code in der App eingeben: <strong>{{ .Token }}</strong></p>`
3. Test: open the installed app on the iPhone → enter email → type the code from the email.
