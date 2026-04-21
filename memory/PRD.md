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
- [ ] Drag-drop for å flytte oppgaver mellom dager
- [ ] Gjentakende oppgaver
- [ ] Auth / multi-user
- [ ] Mobile responsive layout

## Next tasks (ved neste session)
1. Motta jsonbin credentials fra bruker
2. Implementer API route + hook
3. Koble på create/edit/delete UI
4. Implementer ekte datologikk
5. Test end-to-end lokalt → push til GitHub → Vercel deploy
