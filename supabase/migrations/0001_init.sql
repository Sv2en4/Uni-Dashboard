-- =====================================================================
-- Uni-Dashboard: initial schema
-- Run once in Supabase Dashboard → SQL Editor.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

create table public.modules (
  id              uuid primary key default gen_random_uuid(),
  -- default auth.uid(): the frontend does not need to send user_id
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null check (length(trim(name)) > 0),
  -- shortcut for quick entry (#stat): lowercase, no spaces
  kuerzel         text not null check (kuerzel ~ '^[a-z0-9äöüß_-]+$'),
  farbe           text not null default '#8b5cf6' check (farbe ~ '^#[0-9a-fA-F]{6}$'),
  archiviert      boolean not null default false,
  last_touched_at timestamptz,
  created_at      timestamptz not null default now()
);

-- each shortcut only once per user
create unique index modules_user_kuerzel_key on public.modules (user_id, kuerzel);


create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- deleting a module keeps its tasks, they just lose the module
  module_id   uuid references public.modules (id) on delete set null,
  titel       text not null check (length(trim(titel)) > 0),
  faellig     date,
  erledigt    boolean not null default false,
  erledigt_am timestamptz,
  created_at  timestamptz not null default now()
);

create index tasks_user_id_idx   on public.tasks (user_id);
create index tasks_module_id_idx on public.tasks (module_id);


create table public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- nullable on purpose (decision 1 in CLAUDE.md)
  module_id   uuid references public.modules (id) on delete set null,
  titel       text not null check (length(trim(titel)) > 0),
  typ         text not null default 'abgabe' check (typ in ('pruefung', 'zwischentest', 'abgabe')),
  datum       date not null,
  erledigt    boolean not null default false,
  erledigt_am timestamptz,
  created_at  timestamptz not null default now()
);

create index events_user_id_idx   on public.events (user_id);
create index events_module_id_idx on public.events (module_id);


-- ---------------------------------------------------------------------
-- 2. Keep erledigt_am in sync with erledigt
--    The frontend only toggles `erledigt`; the database sets the timestamp.
-- ---------------------------------------------------------------------

create function public.set_erledigt_am()
returns trigger
language plpgsql
as $$
begin
  if new.erledigt and (tg_op = 'INSERT' or not old.erledigt) then
    new.erledigt_am := coalesce(new.erledigt_am, now());
  elsif not new.erledigt then
    new.erledigt_am := null;
  end if;
  return new;
end;
$$;

create trigger tasks_set_erledigt_am
  before insert or update of erledigt on public.tasks
  for each row execute function public.set_erledigt_am();

create trigger events_set_erledigt_am
  before insert or update of erledigt on public.events
  for each row execute function public.set_erledigt_am();


-- ---------------------------------------------------------------------
-- 3. Row Level Security: everyone only sees and changes their own rows
-- ---------------------------------------------------------------------

alter table public.modules enable row level security;
alter table public.tasks   enable row level security;
alter table public.events  enable row level security;

create policy "own modules" on public.modules
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own tasks" on public.tasks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own events" on public.events
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- 4. View module_status: one row per module with
--    - letzte_aktivitaet: latest of erledigt_am (tasks + events) and last_touched_at
--    - offene_aufgaben:   number of open tasks
--    - naechster_termin_*: next open event (same visibility rule as the
--      dashboard: open, and either today or later, or an overdue abgabe)
--
--    security_invoker = true makes the view respect the RLS policies above.
--    "Today" is computed in German time, not UTC.
-- ---------------------------------------------------------------------

create view public.module_status
with (security_invoker = true)
as
select
  m.id,
  m.user_id,
  m.name,
  m.kuerzel,
  m.farbe,
  m.archiviert,
  m.last_touched_at,
  m.created_at,
  greatest(
    m.last_touched_at,
    (select max(t.erledigt_am) from public.tasks  t where t.module_id = m.id and t.erledigt),
    (select max(e.erledigt_am) from public.events e where e.module_id = m.id and e.erledigt)
  ) as letzte_aktivitaet,
  (select count(*) from public.tasks t where t.module_id = m.id and not t.erledigt)::int as offene_aufgaben,
  n.id    as naechster_termin_id,
  n.titel as naechster_termin_titel,
  n.typ   as naechster_termin_typ,
  n.datum as naechster_termin_datum
from public.modules m
left join lateral (
  select e.id, e.titel, e.typ, e.datum
  from public.events e
  where e.module_id = m.id
    and not e.erledigt
    and (e.datum >= (now() at time zone 'Europe/Berlin')::date or e.typ = 'abgabe')
  order by e.datum, e.created_at
  limit 1
) n on true;


-- ---------------------------------------------------------------------
-- 5. Permissions for the API (logged-in users only; RLS still applies)
-- ---------------------------------------------------------------------

grant select, insert, update, delete on public.modules, public.tasks, public.events to authenticated;
grant select on public.module_status to authenticated;
