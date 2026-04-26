# KoDo Planner — UI/Design DNA

Design-prinsippene som gjør appen distinkt. Kopier disse til nye prosjekter for samme look & feel.

---

## 🎨 Den overordnede estetikken

**Det visuelle uttrykket er "Glass på et fotografi".**

Tre lag, alltid:
1. **Bakgrunn:** Et stort, atmosfærisk fotografi (natur, by, eller abstrakte landskap) som dekker hele viewport
2. **Mørkt overlay:** En semi-transparent svart hinne (`bg-black/30` på desktop, `bg-black/65 backdrop-blur-[2px]` på mobil) som demper bildet til "stemnings-bakteppe"
3. **Glass-elementer:** Alle UI-paneler er semi-transparente med blur, så bakgrunnen lyser svakt gjennom

Dette gir en følelse av **dybde og romslighet** uten å bruke farger. Du står *foran* noe vakkert, ikke *i* en flat boks.

---

## 🪟 Glassmorphism — den viktigste teknikken

Hvert UI-panel følger denne formelen:

```css
bg-white/10            /* 10% hvit transparens */
backdrop-blur-xl       /* Sterk blur av det bak */
border border-white/20 /* Subtil hvit kant */
rounded-2xl            /* Generøse hjørner */
shadow-2xl             /* Dyp skygge for å lyfte fra bakgrunn */
```

For tyngre elementer (modaler, dropdowns):
```css
bg-slate-900/95        /* Nesten ugjennomsiktig */
backdrop-blur-xl       /* Fortsatt blur for kontekst */
border border-white/15
```

**Aldri solid-fylte paneler.** Alt skal lyse litt gjennom.

---

## 🎨 Fargepalett

Hovedfargene er **monokromer** + **én aksent** + **status-farger**:

| Bruk | Farge | Tailwind |
|---|---|---|
| Tekst primær | Hvit | `text-white` |
| Tekst sekundær | 70% hvit | `text-white/70` |
| Tekst tertiær / hint | 50% hvit | `text-white/50` |
| Bakgrunn paneler | 10% hvit | `bg-white/10` |
| Borders | 20% hvit | `border-white/20` |
| Hover bakgrunn | 15% hvit | `bg-white/15` |
| **Aksent (action)** | Blå | `bg-blue-500` (primær knapp) |
| **Suksess** | Grønn | `bg-emerald-500` |
| **Advarsel** | Gul | `bg-amber-400/15` med `text-amber-100` |
| **Fare** | Rød | `bg-rose-500` |
| **Info** | Indigo til lilla gradient | `from-indigo-400 to-purple-500` (kun avatar) |

**Regel:** Aldri pastelle eller "AI-slop" lilla gradienter. Hovedflatene skal være sort/hvit-spektrum, fargene reservert for handling.

---

## ✍️ Typografi

**Font:** System default (Inter er OK, men du kan bruke noe mer karakteristisk for et passord-app, f.eks. **JetBrains Mono** for selve passord-feltene — det signaliserer "tekniskhet/sikkerhet")

**Hierarki:**

| Type | Klasse | Bruk |
|---|---|---|
| H1 | `text-base sm:text-xl font-semibold tracking-tight` | App-tittel i header |
| H2 | `text-sm font-semibold tracking-wide uppercase` | Seksjons-overskrifter i Settings |
| Body | `text-sm` | Standard tekst |
| Small | `text-xs` | Metadata, dato, tags |
| Tiny | `text-[11px]` | Footer, hint-tekst |
| Tabular | `tabular-nums` | Alle tall som skal lines opp (datoer, antall, tider) |

**Regel:** Bruk `tracking-tight` på overskrifter, `tracking-wider uppercase` på etiketter (kategori-tags, seksjons-headers). Det gir karakter.

---

## 🟦 Knapper — tre nivåer

### Primær (positiv action)
```css
bg-blue-500 hover:bg-blue-600
text-white text-sm font-medium
px-4 py-2.5 rounded-lg shadow
transition
```

### Sekundær (nøytral action)
```css
bg-white/10 hover:bg-white/20
border border-white/15
text-white text-sm font-medium
px-4 py-2.5 rounded-lg
transition
```

### Destruktiv (rød zone)
```css
bg-rose-500/10 hover:bg-rose-500/20
border border-rose-400/30 hover:border-rose-400/50
text-rose-200 hover:text-rose-100
px-4 py-2.5 rounded-lg
transition
```

**Disabled state alltid samme:** `disabled:opacity-40 disabled:cursor-not-allowed`

**Tab-fokus alltid:** `focus:outline-none focus:ring-2 focus:ring-{farge}/40`

---

## 🃏 Kort — informasjons-bæreren

Hvert "datapunkt" presenteres som et kort:

```css
bg-white/[0.06]        /* Litt mørkere enn paneler */
backdrop-blur-sm
rounded-xl
border border-white/10
p-3
flex items-start gap-3
transition
```

Inni kortet — alltid samme struktur:
1. **Status-indikator** til venstre (sirkel, ikon, eller fargekode)
2. **Hovedinnhold** i midten (tittel + meta-rad)
3. **Sekundær-info** under tittel (mindre, dempet)

For passord-appen: avatar/ikon → tjenestenavn → brukernavn-undertekst → kopi-knapper på høyre.

---

## 🔘 Chips og tags

For kategorier eller status-markører:

```css
inline-flex items-center gap-1
px-2 py-0.5
rounded-full
bg-{kategori-farge}/30   /* 30% av kategorifargen */
text-white
text-[11px] font-medium
```

Kombiner med en liten sirkel som "punkt":
```jsx
<span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: farge}} />
```

Dette mønsteret er overalt: task-typer, status-filter, demo-modus-merket. Konsistent = gjenkjennelig.

---

## 🪟 Modaler og dialoger

Alltid samme struktur:

```
┌──────────────────────────────────────┐
│  Mørk overlay (bg-black/60 + blur)   │
│  ┌──────────────────────────────┐    │
│  │ [Ikon] Tittel       [X]      │    │
│  │ Beskrivelse                  │    │
│  │ [Innhold]                    │    │
│  ├──────────────────────────────┤    │
│  │     [Avbryt]  [Bekreft]      │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

**Dimensjoner:**
- Modal: `max-w-md` (eller `lg` for store skjemaer)
- Padding: `p-5` for innhold, `px-5 py-4` for footer
- Footer separator: `border-t border-white/10`
- Footer bakgrunn: `bg-white/[0.02]` (subtil tonal forskjell)

**Animasjoner:**
- Inn: `animate-in fade-in zoom-in-95 duration-150`
- Ut: standard React unmount

**Auto-fokus på Avbryt-knappen** for destruktive handlinger. Kritisk for sikkerhets-følelse.

**Bakgrunnsklikk + Esc lukker** alltid (med mindre busy=true).

---

## 🎯 Mikro-interaksjoner

Disse små detaljene gjør forskjellen:

### Hover på handling
```css
transition: bg-color 150ms;
hover: lysere variant
```

### Trykk-respons
```css
active:scale-95   /* Knappen "synker" 5% ved trykk */
```

### Drag-feedback
```css
opacity-30 scale-95   /* Det du drar blir gjennomsiktig og krymper */
```

### Drop-target
```css
ring-2 ring-blue-400/70 ring-inset bg-blue-400/15
```

### Loading
```css
animate-pulse   /* Skeleton-loading av kort */
opacity-50      /* Disabled mens venter */
```

**Regel:** ALLE klikk-bare elementer skal ha hover-state OG fokus-state. Aldri "bare en div".

---

## 📐 Spacing — generøst

KoDo bruker `gap-2` til `gap-4` mellom relaterte elementer, `gap-6` til `gap-8` mellom seksjoner. **Det føles luftigere enn nesten alt annet.**

Tommelfingerregel:
- **Mellom relaterte ting:** `gap-2`
- **Mellom grupper:** `gap-4`  
- **Mellom seksjoner:** `mt-6 pt-5 border-t border-white/10`
- **Padding i kort:** `p-3` for små, `p-5` for store

---

## 🖼️ Iconografi

**Bibliotek:** `lucide-react` — moderne, konsistent strek, mange ikoner.

**Standard størrelser:**
- I knapper: `h-4 w-4`
- I headere: `h-5 w-5`
- I store områder: `h-6 w-6`
- I små chips: `h-3 w-3`

**Stroke:** `strokeWidth={2}` (default) for de fleste, `strokeWidth={3}` for "viktig" (sjekk-mark, lås).

**Aldri emoji-ikoner i kjerne-UI.** Kun Lucide. Emoji-bruk er reservert for tekst (toast-meldinger, beskrivelser).

---

## 📱 Mobile-first thinking

Når du bygger nye komponenter, tenk:

1. **Hva ser jeg på 390x844 først?** — Mobil-first
2. **Hva endres ved 768+?** — Desktop-tweaks
3. **Bruk JS-deteksjon for store layout-skift**, ikke bare Tailwind breakpoints (særlig for landscape-håndtering: `min(width, height) < 600`)

**Mobil må ha:**
- Floating action button (FAB) for primær-handling — `fixed bottom-6 right-6`
- Større touch-targets (`min-h-[44px]`)
- Ingen drag-and-drop (bruk modal/edit i stedet)
- Diskret footer med versjon nederst

---

## 🎨 Konkret oppskrift for passord-appen din

Hvis du vil ha samme estetikk men "tilpasset passord":

**Bakgrunn:** Velg én bilde-stil og hold deg til den. Forslag for passord-app:
- Astrofotografi (mørke himler, rom, Aurora) — assosiasjoner: dybde, hemmelighet
- Eller minimalistiske nordlige landskap (snø, skog, fjell)

**Aksent-farge:** Bytt blå → **emerald-500** eller **teal-400**. Grønn signaliserer "trygt/sikkert" på en annen måte enn KoDo's blå "produktiv".

**Typografi for passord-felter:** Bruk `font-mono` (`JetBrains Mono` eller `Fira Code`). Det gjør at passord ser ut som tekniske strenger og er lettere å verifisere.

**Master-passord-skjerm:**
- Full-screen takeover med samme bakgrunn
- Ett input-felt sentrert
- Ingen distraherende elementer
- Store, generøse hjørner og spacing
- "Lås opp"-knapp i emerald

**Passord-kort:**
- Tjenestenavn øverst (h-tag)
- Brukernavn som meta-rad
- Passord vises som **`••••••••`** by default — klikk for å vise
- "Kopier"-knapp som primær interaksjon (ikon: `Copy` fra Lucide)
- "Sist oppdatert: ..."-tag som chip

**Søk på toppen:**
- Samme `SearchInputDesktop`-komponent som KoDo
- Fungerer identisk: skriv → dropdown → klikk → åpner kort

**Kategorier:**
- Bruk samme chip-system som KoDo's task-types
- Forslag: "Personlig", "Jobb", "Kunde X", "Familie"
- Hver med sin egen farge

**Status-filter:**
- "Alle / Sist brukt / Aldri brukt / Trenger oppdatering" — samme `StatusFilterBar`-komponent

---

## 🛠️ Tech stack-anbefaling for passord-app

For å bevare estetikken med minst friksjon:

```
Next.js 15 + App Router
TypeScript
Tailwind CSS (samme config som KoDo)
lucide-react (ikoner)
sonner (toasts)
shadcn/ui (komponent-base)
Web Crypto API (kryptering — innebygd i nettleser)
localStorage eller Upstash (lagring)
```

**Du kan bokstavelig talt kopiere `/app/components/ConfirmDialog.tsx` og `/app/components/Search.tsx` rett over** — de fungerer uavhengig av domene-logikken og gir deg umiddelbart "KoDo-følelsen".

---

## 📋 Quick-start sjekkliste for ny app

Når du starter passord-prosjektet, gjør disse i denne rekkefølgen:

1. ✅ Velg ett bakgrunnsbilde, sett opp `BackgroundLayer.tsx`
2. ✅ Kopier `tailwind.config` fra KoDo
3. ✅ Sett `globals.css` med samme `text-white` body, samme overlay-mønster
4. ✅ Lag én glass-card-komponent som mal — alle andre arver fra denne
5. ✅ Implementer søk + dialog først (de er gjenbrukbare)
6. ✅ Bygg så domene-logikken oppå

---

_Sist oppdatert: 2026-04-26 (KoDo Planner v4.5.3)_
_Dette dokumentet kan kopieres til andre prosjekter som design-blueprint._
