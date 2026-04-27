# Kodo Calendar - PRD

## Opprinnelig problemstilling
Brukeren (meetmax-no) har et GitHub-repo (Calender) med en Next.js 15 + React 19 + TypeScript kalender-app generert av v0.app. Først trengte vi hjelp med å deploye til Vercel (fikset - Output Directory hadde trailing space). Deretter oppdaget vi at appen er en UI-prototype uten funksjonalitet.

**OPPDATERT FORSTÅELSE**: Brukeren har en eksisterende, fungerende app kalt "MeetMax Manager v3.4" i repo `meetmax-no/kalender` (ren HTML + React via CDN + Babel). Det er et marketing/sales-pipeline-verktøy med Facebook Ads KPI-analyse. Vi skal **porte hele MeetMax v3.4** til det nye Next.js-designet med fjellbilde + glassmorphism-estetikk.

## Tech stack
- Next.js 15.2.6 (App Router)
- React 19
- TypeScript
- Tailwind CSS 3.4
- Radix UI / shadcn-ui komponenter
- lucide-react ikoner
- Deploy: Vercel (fra GitHub meetmax-no/Calender)
- Storage: jsonbin.io (brukeren har konto)

## Arkitektur
- Alt kjører client-side (Next.js static build, deploy som statisk til Vercel)
- JSONBin.io kalles via Next.js Route Handler (`/app/api/calendar/route.ts`) som proxy — holder API-nøkkel server-side
- ENV-variabler settes i Vercel dashboard og lokal `.env.local`:
  - `JSONBIN_MASTER_KEY`
  - `JSONBIN_BIN_ID`

## Brukerpersona
- Markedsfører/gründer (Me & Max AS) som jobber med:
  - **Sales outreach** langs 4 tracks (LinkedIn, NewCustomers, OldContacts, TheContract)
  - **Facebook Ads** med løpende KPI-tracking (reach, ROAS, CPA, CTR osv.)
- Én bruker — bin-ID + master-key utgjør "autentisering"
- Norsk UI

## Eksisterende datakilde (ALLEREDE I BRUK)
- JSONBin API_KEY: `$2a$10$POD7waxX5380sIzCicwFUejlDXC5wrch8IRkc409YItsJWSTnvpxO` (publikt committet)
- JSONBin BIN_ID: `68d6a28943b1c97be951089f`
- Strukturerte data lagret: `{ campaigns: [], kpiData: [], updatedAt }`

**⚠️ TODO FREDAG**: Bytt API-key i JSONBin (Regenerate Master Key).
- Grunn: gammel key er eksponert i `meetmax-no/kalender` (public repo)
- Avhengighet: En annen app bruker fortsatt gammel key - må oppdateres først
- Steg: (1) oppdater gammel app først, (2) regenerer key i jsonbin.io, (3) oppdater Vercel env var `JSONBIN_MASTER_KEY` for `meetmax-no/Calender`, (4) oppdater lokal `/app/.env.local`

## TASK_TYPES (fra config.js)
- `TRACK1` - S1-LinkedIn (pink)
- `TRACK2` - S2-NewCustomers (blue)
- `TRACK3` - S3-OldContacts (sky)
- `TRACK4` - S4-TheContract (green)
- `ADMIN` - Admin (slate)
- `OTHER` - Annet (violet)

## Core requirements
- Beholde eksisterende visuelle designspråk (fjellbakgrunn + glassmorphism fra nye repo)
- Month-view som primær (som MeetMax v3.4), ikke week-view
- Alle 14+ features fra v3.4 portes over
- Data lagres i eksisterende JSONBin via server-side Next.js API route (sikrer key)
- Norsk helligdager + commercial days vises i kalenderen

## Hva er gjort
- **2026-04-21**: Klonet repo fra GitHub, flyttet inn i Emergent workspace (/app)
- **2026-04-21**: Fikset Vercel deploy (Output Directory trailing space)
- **2026-04-21**: Verifisert at `pnpm build` kjører fint (4 static pages)
- **2026-04-21**: Installert deps, oppdatert .gitignore for Next.js
- **2026-04-21**: Opprettet .env.local.example med jsonbin variabler
- **2026-04-21**: Hentet integrasjonsguide for jsonbin.io

## Prioritert backlog

### P0 — Kjerne (Må ha i v1)
- [ ] API Route `/app/api/calendar/route.ts` (GET + PUT proxy til JSONBin)
- [ ] Custom hook `useCalendarData` → laster/lagrer `{campaigns, kpiData}`
- [ ] **Månedsvisning** med dagsceller (Man-Søn), 60px høyde, glassmorphism-styling
- [ ] Dato-navigasjon (forrige/neste måned, dagens)
- [ ] Dagsceller viser kampanjer med tasks (farget etter type)
- [ ] HOLIDAYS + COMMERCIAL_DAYS vist i dagsceller
- [ ] **Quick-add fra legend-knapperad** nederst (TASK_TYPES som pills)
- [ ] Modal: "Legg til" (tittel, dato, tid, bildelenke, type)
- [ ] Klikk på oppgave → toggle completed (strikethrough + opacity)
- [ ] Klikk på kampanje → Edit-modal (tittel, dato, tasks)
- [ ] Slett kampanje (hover trash icon)
- [ ] Filter: vis/skjul oppgavetyper (legend-checkboxes)
- [ ] **Månedens fremdrift %** (progressbar)
- [ ] "Lagrer..." / "Online"-indikator
- [ ] data-testid på alle interaktive elementer

### P1 — Aktivitetsliste-fane
- [ ] Tab-bryter (Kalender / Aktiviteter / Analyse)
- [ ] Sortert tabell med alle tasks (dato, tid, type, kampanje, beskrivelse, status)
- [ ] Filter: år, måneder (multi-select), Alle/Kun åpne
- [ ] Sortering på kolonner (dato, type, tittel, status)
- [ ] "Kopier liste" til utklippstavle
- [ ] Overdue tasks markert rødt

### P2 — Import/Export og verktøy
- [ ] Import .ics
- [ ] Eksport .ics per kampanje
- [ ] CSV-eksport
- [ ] JSON backup/restore
- [ ] Google Drive / Dropbox URL-parsing for bilder
- [ ] Bilde-preview (hover + lock på klikk)

### P3 — Analyse-fane
- [ ] KPI-grid (4x4) med 16 KPI-kort fra KPI_CARDS
- [ ] Legg til / slett KPI-rader
- [ ] CSV-import (Facebook Ads export?) — analysefil lå i `src/csvanalyse.js` og `src/analyse.js`
- [ ] Budsjett/CPA-målvisning fra CAMPAIGN_DEFAULTS

### Backlog/nice-to-have
- [ ] Day / Week-visning i tillegg til Month
- [x] Drag-drop for å flytte oppgaver mellom dager (v4.5 — 2026-04-26)
- [x] Gjentakende oppgaver
- [ ] Auth / multi-user (Google Auth via NextAuth — P1)
- [x] Mobile responsive layout (MVP ferdig 2026-04-26)
- [x] Backup + Restore (v4.5 — 2026-04-26)
- [x] Globalt søk (v4.5 — 2026-04-26)
- [ ] Faktisk tid vs estimat (P2 — utsatt, brukeren ikke interessert)
- [ ] Kopier oppgave til neste uke (P2 — utsatt, lavt verdi)

### Mobile MVP (ferdig 2026-04-26)
- `useIsMobile()` hook (telefon-deteksjon: `min(width, height) < 600px` → fungerer i landscape også)
- `app/page.tsx`: tvinger Liste-visning på mobil, FAB for ny oppgave, bruker `urlPortrait` fra config når mobil, mobil-footer med versjon
- `ListView.tsx`: skjuler tabell på mobil og rendrer ny `MobileCardList`-komponent
- Topplinje på mobil: status-filter + sort-dropdown + horisontal type-chip-rad + kompakt stats-rad
- Portrett-versjon av bakgrunnsbilder via `urlPortrait` i client-config
- Bakgrunn dempes med `bg-black/65 backdrop-blur` på mobil for bedre lesbarhet

### v4.6.0 features (2026-04-27)
**Tid-format:** `formatHours()` i `TaskCardTooltip.tsx` viser nå "1t 30min" / "45min" / "2t" i stedet for desimaler

**Estimat-presets** i TaskModal: `15min / 30min / 1t / 2t / 4t` (la til 15min/0.25t)

**Settings-rydding:**
- Fjernet "Tips: Rediger task-typer..."-linja
- Mobil-only solid bakgrunnsfarge: ny "Ensfarget"-mode + hex-color-picker (default `#1A1A1A`). Ikke synlig på desktop

**Mobil header & footer:**
- Online-status synlig som kompakt ikon i mobil-header
- Footer: kortere tekst (`By Ko|Do Consult`) + `whitespace-nowrap` så den ikke knekker

**WeekStats flyttet (desktop):**
- Tidligere lå i sidebar under MiniCalendar (tok plass fra Tasks-typer)
- Nå: compact-modus midt i top-headeren som glass-pill

**Emoji-picker (`components/EmojiPicker.tsx`):**
- Liten knapp ved siden av tittel-input i TaskModal
- 9 standard-emojis: 📞 📧 📄 💬 📅 ✏️ 💡 🎯 ⚙️
- Emoji lagres som første tegn i tittel-strengen (ingen schema-endring)
- Bruker Intl.Segmenter for å håndtere multi-codepoint-emojis korrekt
- "Fjern emoji"-knapp når en allerede er satt

**Privat/Public synlighet (foreløpig MVP — ikke ekte ACL):**
- Nytt felt `visibility?: "public" | "private"` på Todo
- Ny config-flagg `defaultVisibility` per klient
- Toggle i TaskModal: Offentlig (blå prikk) / Privat (grønn prikk)
- Filter-bar i sidebar: Alle / Offentlig / Privat med tellere
- Liten farget prikk på todo-kort i Uke, Måned, Liste (desktop+mobil)
- Når Auth kommer i v5.0 koples ekte filtrering per bruker på toppen

**Demo-modus (`demoMode` + `demoAnchorWeek` i config):**
- Ny config-flagg `demoMode: boolean` per klient-fil (`default.json`, `meetmax.json`, `_template.json`)
- `demoAnchorWeek: number` setter ISO-ukeøyeblikket appen åpner i ved oppstart
- Helper `getMondayOfISOWeek(week, year?)` i `lib/date.ts` regner ut mandag i gitt ISO-uke
- Når demoMode=true:
  - Oransje "DEMO"-chip vises i AppHeader (kolbe-ikon)
  - App ankrer til mandag i `demoAnchorWeek` ved første ready
  - TaskModal sin Slett-knapp skjules (sender ikke `onDelete` ned)
  - ListView sine slett-ikoner skjules (gjør `onTodoDelete` valgfri)
  - Settings sin "Faresone" (Reset DB) skjules
  - Backup + Restore beholdes synlig — salgspersonens reset-verktøy mellom demoer
- Workflow for demo-deployment: lag pen demo-data én gang, ta backup, restore før hver kundedemo

**Backup & Restore (`lib/backup.ts`):**
- Last ned-knapp i Settings → genererer JSON-fil med alle todos + metadata, lastes ned via nettleseren (`kodo-backup-{client}-{dato}.json`)
- Gjenopprett-knapp → filvelger → validerer format → bekreftelses-dialog → skriver til Upstash via `saveAll()`
- "Sist lastet ned" lagres i localStorage
- Validering: sjekker `version`, `todos`-array, krav til id/title/date

**Drag-and-drop (`hooks/useDragAndDrop.ts`):**
- HTML5 native API (ingen nye dependencies)
- WeekView: dra mellom dager OG mellom slots (samme dag)
- MonthView: dra mellom datoer (beholder original slot)
- Disabled på mobil (touch + små targets)
- Visuell feedback: kort blir 30 % opacity + scale, drop-target får blå ring

**Globalt søk (`components/Search.tsx`):**
- Desktop: dropdown under søkefelt i header (allerede plassert), max 8 treff
- Mobil: fullscreen-overlay via søk-knapp i header (forstørrelsesglass)
- Søker i tittel + beskrivelse, case-insensitive, æ/ø/å funker
- Sortering: tittel-treff (prefix > infix) > beskrivelse-treff > nyeste først
- Tastatur-navigasjon: ↑/↓/Enter/Esc
- Highlight på matchende ord

## Next tasks (ved neste session)
1. Motta jsonbin credentials fra bruker
2. Implementer API route + hook
3. Koble på create/edit/delete UI
4. Implementer ekte datologikk
5. Test end-to-end lokalt → push til GitHub → Vercel deploy


## 🔧 GitHub-sync workflow (KRITISK for nye agenter)

Workspacen kommer IKKE med git remote satt opp by default — men det kan og skal settes opp manuelt. Brukeren forventer å kunne si "pull fra GitHub" og få lastet inn siste versjon av filer.

**Repo-URL:** `https://github.com/meetmax-no/Calender.git` (main branch)

### Første gang i ny sesjon — sett opp remote:
```bash
cd /app
git remote add origin https://github.com/meetmax-no/Calender.git
git fetch origin main
```

### Pull-kommandoer brukeren kan be om:

| Bruker sier | Agent kjører |
|---|---|
| "Pull alle filer fra GitHub" | `git fetch origin main && git reset --hard origin/main` |
| "Pull `<filsti>` fra GitHub" | `git fetch origin main && git checkout origin/main -- <filsti>` |
| "Hva er forskjell fra GitHub?" | `git diff HEAD origin/main` |

**VIKTIG:** Brukeren redigerer ofte `public/config.json` direkte på GitHub (bakgrunnsbilder, helligdager, taskTypes). Sjekk alltid med bruker om du skal pulle før du endrer config-filen i en ny sesjon.

### Push tilbake til GitHub:
Brukeren bruker Emergent sin "Save to GitHub"-funksjon i chat-inputen. Agenten skal IKKE bruke `git push`.
