# Projekt: Uni-Dashboard

Ich möchte ein persönliches Dashboard für meinen Uni-Alltag bauen. Ich bin kein erfahrener Webentwickler (ich kenne Python und SQL), erkläre also wichtige Schritte kurz und baue in Etappen. Bevor du startest: Lies diesen Plan, stell mir Rückfragen, wenn etwas unklar ist, und schlag mir eine Projektstruktur vor. Leg danach eine CLAUDE.md mit den wichtigsten Entscheidungen aus diesem Dokument an.

## Ziel

Auf einen Blick sehen:
1. was noch zu tun ist,
2. wann die nächste Abgabe oder der nächste Test ist,
3. wann ich zuletzt etwas für jedes Fach getan habe.

Neue Aufgaben und Termine müssen in wenigen Sekunden eingetragen und abgehakt werden können, auf dem MacBook und auf dem Handy.

Bewusst NICHT enthalten: Lernzeit-Tracker, Fortschrittsbalken pro Fach, Noten, Stundenplan.

## Technik

- Frontend: Vite + React + TypeScript + Tailwind CSS, Komponenten mit shadcn/ui
- Datumslogik: date-fns mit deutscher Locale
- Backend und Datenbank: Supabase (Postgres, Auth, Row Level Security)
- Hosting: Vercel, verbunden mit einem GitHub-Repository
- Als PWA installierbar, damit ich es auf iPhone und iPad als App auf den Homescreen legen kann
- Login per Magic Link (E-Mail). Es gibt nur einen Nutzer: mich. Nach meiner Registrierung sollen neue Registrierungen in Supabase deaktiviert werden, erinnere mich daran.
- Secrets nur in `.env.local`, die nie committet wird. Nutze git und committe nach jeder Etappe.

## Datenmodell

Lege das Schema als SQL-Migration an und erkläre sie mir kurz.

- **modules**: id, user_id, name, kuerzel (z.B. "stat", für die Schnelleingabe), farbe, archiviert (bool), last_touched_at (timestamptz, nullable), created_at
- **tasks** (Aufgaben): id, user_id, module_id (nullable), titel, faellig (date, nullable), erledigt (bool), erledigt_am (timestamptz, nullable), created_at
- **events** (Termine): id, user_id, module_id, titel, typ ('pruefung' | 'zwischentest' | 'abgabe'), datum (date), erledigt (bool), erledigt_am (timestamptz, nullable), created_at

Row Level Security auf allen Tabellen: Nutzer sehen und ändern nur eigene Zeilen.

**Letzte Aktivität pro Fach** = der späteste Zeitpunkt aus: erledigt_am aller Aufgaben und Termine des Fachs sowie modules.last_touched_at. Berechne das in einer SQL-View `module_status`, die pro Modul auch die Anzahl offener Aufgaben und den nächsten offenen Termin liefert.

## Aufbau der Oberfläche

Eine einzige Hauptseite, von oben nach unten:

**1. Schnelleingabe (ganz oben, immer sichtbar)**
- Ein Eingabefeld mit Umschalter „Aufgabe / Termin“. Enter speichert, das Feld bleibt fokussiert für den nächsten Eintrag.
- Tastenkürzel: `N` fokussiert das Feld.
- Einfache Schreibweise wird erkannt: `#stat` setzt das Modul über das Kürzel, Datumsangaben wie `heute`, `morgen`, `fr`, `24.10.` setzen das Datum. Bei Terminen setzen `!pruefung`, `!test`, `!abgabe` den Typ (Standard: Abgabe).
- Beispiel: `Übungsblatt 3 #stat fr` legt eine Aufgabe für Statistik mit Fälligkeit Freitag an.
- Unter dem Feld eine kleine Vorschau, was erkannt wurde.

**2. Nächste Termine**
- Eine horizontale Reihe mit den nächsten 4 bis 5 offenen Terminen als Karten.
- Jede Karte: groß der Countdown („in 3 Tagen“, „morgen“, „heute“), darunter Titel, Typ und Modul mit Farbpunkt.
- Dringlichkeit dezent farblich: rot bis 3 Tage, orange bis 7 Tage, sonst neutral.
- Abgaben lassen sich direkt auf der Karte abhaken.

**3. Fächer-Übersicht**
- Ein Raster mit einer kompakten Karte pro aktivem Modul, sortiert nach „am längsten nichts getan“ zuerst.
- Jede Karte zeigt: Name mit Farbpunkt, „zuletzt vor X Tagen“ mit Ampel (grün unter 5 Tagen, orange 5 bis 9, rot ab 10, grau wenn noch nie), Anzahl offener Aufgaben, nächster Termin des Fachs.
- Ein kleiner Button „Heute gearbeitet“ setzt last_touched_at auf jetzt, für Lernen ohne abhakbare Aufgabe.
- Klick auf eine Karte filtert die Aufgabenliste auf dieses Fach.
- Die Schwellenwerte 5 und 10 als Konstanten an einer Stelle im Code, damit ich sie leicht ändern kann.

**4. Aufgaben**
- Offene Aufgaben gruppiert: „Überfällig“, „Heute“, „Diese Woche“, „Später“, „Ohne Datum“. Leere Gruppen ausblenden.
- Abhaken per Checkbox mit kurzer Animation, danach ein Hinweis „Rückgängig“ für einige Sekunden.
- Klick auf eine Aufgabe öffnet eine schlichte Bearbeitung (Titel, Modul, Datum, Löschen).
- Erledigte Aufgaben ausgeblendet, über einen kleinen Schalter einblendbar.

**Einstellungen** (eigene, schlichte Seite): Module anlegen, bearbeiten, Farbe und Kürzel setzen, archivieren.

## Design

- Sauber, minimalistisch, modern. Orientierung: Linear, Things 3, Vercel-Dashboard.
- Viel Weißraum, eine neutrale Grundpalette, genau eine Akzentfarbe. Farbe nur mit Bedeutung: Dringlichkeit, Ampel, Modulfarben als kleine Punkte.
- Schrift: Inter oder Geist. Klare Hierarchie über Größe und Gewicht, nicht über Farbe.
- Dünne Ränder statt schwerer Schatten, abgerundete Ecken, dezente Übergänge.
- Hell- und Dunkelmodus, automatisch nach Systemeinstellung.
- Responsiv: auf dem MacBook mehrspaltig, auf dem Handy eine Spalte in der Reihenfolge Schnelleingabe, Termine, Fächer, Aufgaben. Alle Bedienelemente groß genug für Touch.
- Alle Texte der Oberfläche auf Deutsch.

## Etappen

Bau in dieser Reihenfolge und halte nach jeder Etappe an, damit ich teste, bevor es weitergeht:

1. Projekt aufsetzen, lokal starten, Supabase-Projekt verbinden (führe mich durch die Schritte im Supabase-Dashboard)
2. Datenbankschema, RLS und View als Migration
3. Login per Magic Link
4. Module in den Einstellungen verwalten
5. Aufgaben und Termine anlegen, bearbeiten, abhaken, inklusive Schnelleingabe
6. Hauptseite mit allen vier Bereichen und der Logik für Countdown und letzte Aktivität
7. Design-Feinschliff, Dunkelmodus, Handy-Ansicht
8. PWA einrichten und auf Vercel veröffentlichen (führe mich durch GitHub und Vercel)

Wenn du an einer Stelle zwischen mehreren Wegen entscheiden musst, nimm den einfacheren und sag mir, warum.
