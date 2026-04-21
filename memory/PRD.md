# Kodo Calendar - PRD

## Opprinnelig problemstilling
Brukeren (meetmax-no) har et GitHub-repo (Calender) med en Next.js 15 + React 19 + TypeScript kalender-app generert av v0.app. Først trengte vi hjelp med å deploye til Vercel (fikset - Output Directory hadde trailing space). Deretter oppdaget vi at appen er en UI-prototype uten funksjonalitet. Vi bygger nå videre på designet med faktisk funksjonalitet.

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
- Én enkeltbruker (eieren) som ønsker en personlig kalender
- Ingen auth i MVP — bin-ID og master-key utgjør "autentisering"

## Core requirements
- Beholde eksisterende design (brukeren digger det)
- Dato-navigasjon som faktisk virker (piltaster, Today-knapp)
- Create / Edit / Delete events
- Data lagres i jsonbin.io

## Hva er gjort
- **2026-04-21**: Klonet repo fra GitHub, flyttet inn i Emergent workspace (/app)
- **2026-04-21**: Fikset Vercel deploy (Output Directory trailing space)
- **2026-04-21**: Verifisert at `pnpm build` kjører fint (4 static pages)
- **2026-04-21**: Installert deps, oppdatert .gitignore for Next.js
- **2026-04-21**: Opprettet .env.local.example med jsonbin variabler
- **2026-04-21**: Hentet integrasjonsguide for jsonbin.io

## Prioritert backlog

### P0 (neste: i morgen)
- [ ] Bruker oppretter JSONBin-bin og gir oss `JSONBIN_MASTER_KEY` + `JSONBIN_BIN_ID`
- [ ] Opprett `/app/api/calendar/route.ts` (GET + PUT proxy til jsonbin)
- [ ] Opprett custom hook `useCalendarEvents` (fetch/add/update/delete)
- [ ] Koble `page.tsx` fra hardkodet array til hook
- [ ] Ekte dato-navigasjon (piltaster flytter uke, "Today" går til dagens uke)
- [ ] Current date/month beregnes fra faktisk Date-objekt
- [ ] "Create Event"-modal med skjema (tittel, dag, start, slutt, farge, beskrivelse, lokasjon)
- [ ] "Edit Event" + "Delete Event" på event-detaljmodal
- [ ] data-testid på alle interaktive elementer

### P1
- [ ] Day / Month view rendering (ikke bare toggle)
- [ ] Mini-calendar navigasjon (prev/next month, klikk dato går til den uken)
- [ ] "My Calendars" checkboxes filtrerer events
- [ ] Search filtrerer events
- [ ] Drag-and-drop for å flytte events mellom dager/tider
- [ ] Resize events

### P2 / Backlog
- [ ] Multi-user støtte med auth
- [ ] Google Calendar sync
- [ ] Recurring events
- [ ] Notifikasjoner / reminders
- [ ] Mobile responsive (nåværende design er desktop-only)
- [ ] Keyboard shortcuts

## Next tasks (ved neste session)
1. Motta jsonbin credentials fra bruker
2. Implementer API route + hook
3. Koble på create/edit/delete UI
4. Implementer ekte datologikk
5. Test end-to-end lokalt → push til GitHub → Vercel deploy
