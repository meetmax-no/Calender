# Deploy ny kunde — Komplett oppskrift

**Fra "Godag, jeg vil ha en planner" til "Værsågod, her er din egen instans".**
**Total tid: ~30 minutter (når du har gjort det én gang).**

> 🎯 Modell: Én GitHub-repo → ett Vercel-prosjekt per kunde → egen Upstash Redis per kunde.
> Full arkitektur og bakgrunn: `memory/CLIENT_ONBOARDING.md`

---

## 🏢 Eierskap-modell — velg ÉN per kunde

Før du starter, bestem deg for hvem som skal eie tjenestene:

### Modell A — Du eier alt på din Pro-konto _(standard)_

```
Din Vercel Pro ($20/mnd uansett kundeantall)
├── planner-meetmax
├── planner-acme
└── planner-demo

Din Upstash Pay-as-you-go (~$1/mnd per kunde)
├── planner-meetmax-kv
├── planner-acme-kv
└── planner-demo-kv
```

- ✅ **Enklest** — null jobb for kunden, du har full kontroll
- ✅ **Marginal kostnad** for hver ekstra kunde: ~$1/mnd
- ✅ **Du fakturerer kunden** f.eks. 500 kr/mnd som dekker hosting + support
- ✅ **Bug-fix og deploy** kan du gjøre når som helst uten å mase på kunden
- ⚠️ Hvis dere skulle skille lag, må kunden migrere selv

**Bruk denne for:**
- Demo-instansen
- Solo-konsulent-kunder (1–2 brukere)
- Alle kunder med mindre de eksplisitt ønsker noe annet

### Modell B — Kunden eier sin Vercel + Upstash _(opsjonal)_

```
Kundens egen Vercel Pro ($20/mnd, kunden betaler)
└── planner-acme        ← du er invitert team-medlem

Kundens egen Upstash-konto
└── planner-acme-kv     ← du har tilgang via deres konto
```

- ✅ **Klart eierskap** — kunden eier sine data og sin deploy
- ✅ **GDPR-vennlig** — kunden er sin egen data-prosessor
- ✅ **Du skalerer uten kostnadsvekst** — 1 eller 50 kunder, dine egne kostnader er like
- ⚠️ **5–10 min ekstra onboarding** — kunden må klikke gjennom Vercel + Upstash signup
- ⚠️ Krever at kunden er villig til å ha en $20/mnd Vercel-faktura
- ⚠️ Kunden ser regningen direkte — kan reagere

**Bruk denne for:**
- Større bedrifter med IT-avdeling
- Kunder som eksplisitt vil eie sin egen infrastruktur
- Kunder som har strenge data-krav

> 💡 **Tommelfingerregel:** Start med Modell A. Bytt til Modell B kun hvis kunden ber om det.

---

## ☎️ Fase 0 — Forarbeid (10 min, før møtet)

Når du har en interessert kunde, samle inn:

- [ ] **Kundens fulle navn** (f.eks. *Acme AS*)
- [ ] **Kort kallenavn** (f.eks. `acme`) — brukes i URL og filnavn
- [ ] **E-poster som skal ha tilgang** (per nå: alle som har URL får tilgang. Auth kommer senere)
- [ ] **Brand-tagline** — kort beskrivelse vist i header (f.eks. *"Strategi & vekst"*)
- [ ] **Spesielle ønsker:** task-typer, helligdager, bakgrunner — eller bruk standard?
- [ ] **Bekreft modell:** A (du eier alt — standard) eller B (kunden eier sine kontoer)

> 📝 **Hvis Modell B:** Be kunden opprette Vercel-konto og Upstash-konto i forkant. Be dem invitere deg som team-medlem på begge før møtet.

---

## 🛠️ Fase 1 — Lag client-config (5 min)

### 1.1 Kopier malen

Lokalt eller via GitHub web-editor:

```bash
cp public/clients/_template.json public/clients/<kallenavn>.json
```

### 1.2 Tilpass innholdet

Åpne den nye filen og fyll inn:

```json
{
  "_meta": {
    "client": "Acme AS",
    "createdAt": "2026-04-25",
    "createdBy": "Ko|Do Consult",
    "notes": "Kontakt: ola@acme.no | Bestilt: 2026-04-25"
  },
  "taskTypes": {
    "MEETING":  { "label": "Møte",     "color": "#3B82F6", "active": true, "defaultSlot": "10-12" },
    "DEEPWORK": { "label": "Fokus",    "color": "#10B981", "active": true, "defaultSlot": "08-10" },
    "ADMIN":    { "label": "Admin",    "color": "#94A3B8", "active": true, "defaultSlot": "08-10" },
    "OTHER":    { "label": "Annet",    "color": "#A855F7", "active": true, "defaultSlot": "12-14" }
  },
  "holidays": { /* kopier fra meetmax.json eller la stå tomt */ },
  "commercialDays": {},
  "colors": [ /* kopier fra meetmax.json */ ],
  "backgrounds": [
    { "url": "https://images.unsplash.com/photo-...", "name": "Kundens valgte bilde 1" }
  ]
}
```

### 1.3 Commit og push

```bash
git add public/clients/acme.json
git commit -m "feat: add Acme client config"
git push
```

---

## ☁️ Fase 2 — Opprett Upstash Redis (3 min)

> Hver kunde får sin egen database — ingen risiko for datablanding.

1. **Vercel Dashboard** → Storage → **Create Database**
2. Velg **Upstash for Redis**
3. Aksepter Terms of Service
4. Konfigurasjon:
   - **Name:** `planner-<kallenavn>-kv` (f.eks. `planner-acme-kv`)
   - **Primary Region:** *Frankfurt (West)* (lavest latency for Norge)
   - **Read Regions:** (la stå tom)
   - **Eviction:** *Off* (vi vil ikke at oppgaver slettes automatisk)
   - **Plan:** **Pay-as-you-go** ⚠️ *Ikke Free!*
     - Free tier tillater kun **1 database per Upstash-konto**
     - Pay-as-you-go: $0,20 per 100k commands + $0,25/mnd per database
     - Realistisk per KoDo-kunde: **~$1/mnd** total
     - Bruk Free **kun** for første kunde/demo hvis du ikke har andre DB-er
5. Klikk **Create**
6. **Custom Prefix:** la stå tom (verdi blir "STORAGE_..." automatisk — vi VIL ha defaults)

> 💡 **Modell B-variant:** Hvis kunden eier sin egen Upstash-konto, kan **deres** DB stå på Free tier (siden det er deres første og eneste).

---

## 🚀 Fase 3 — Opprett Vercel-prosjekt (5 min)

### 3.1 Importer repo

1. Vercel Dashboard → **Add New → Project**
2. Velg GitHub-repoet `meetmax-no/Calender`
3. **Project Name:** `planner-<kallenavn>` (f.eks. `planner-acme`)
4. **Framework:** Next.js (auto-detected)
5. ⛔ **IKKE klikk Deploy ennå** — gå til Environment Variables først

### 3.2 Sett env-variabler

Under **Environment Variables**, legg til:

| Variabel | Verdi | Eksempel |
|---|---|---|
| `NEXT_PUBLIC_CLIENT_CONFIG` | Kallenavn (uten .json) | `acme` |
| `NEXT_PUBLIC_BRAND_NAME` | Kundens visningsnavn | `Acme Planner` |
| `NEXT_PUBLIC_BRAND_TAGLINE` | Tagline | `Strategi & vekst` |

> 💡 Velg "Production, Preview, and Development" for alle tre.

### 3.3 Deploy

Klikk **Deploy**. Bygget tar 1–2 min.

### 3.4 Koble til KV-storen

Når deploy er ferdig:

1. Gå til **Storage**-fanen i prosjektet
2. Klikk **Connect Store** → velg `planner-<kallenavn>-kv`
3. Velg **alle 3 environments** (Production, Preview, Development)
4. **Custom Prefix:** la stå tom
5. Klikk **Connect**

Vercel vil **automatisk re-deploye** og injisere disse 5 vars:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`
- `REDIS_URL`

---

## ✅ Fase 4 — Verifisering (5 min)

Åpne `https://planner-<kallenavn>.vercel.app` og sjekk:

- [ ] Header viser **`<tagline> · <brand-name>`** (f.eks. *Strategi & vekst · Acme Planner*)
- [ ] Tab-tittel: `Acme Planner · Strategi & vekst`
- [ ] Footer: `Acme Planner · By Ko | Do · Consult · v4.5.3`
- [ ] Sidebar: Riktige task-typer og farger fra kundens config
- [ ] Bakgrunner: Riktige bilder
- [ ] Helligdager (hvis satt): Vises i kalenderen
- [ ] **Innstillinger (⚙️) → Konfigurasjon:** Aktiv config = `clients/<kallenavn>.json`
- [ ] **Innstillinger (⚙️) → Datalager:** *Upstash Redis*
- [ ] Opprett en testoppgave → ser den i grid + liste
- [ ] Refresh siden → oppgaven består
- [ ] **Upstash Data Browser** (åpne via Storage-fanen): Key `todos` finnes med data
- [ ] Slett testoppgaven → forsvinner i begge

---

## 🌐 Fase 5 — Custom domene (valgfritt, 10 min + DNS-venting)

Hvis kunden vil ha `planner.acme.no` i stedet for `planner-acme.vercel.app`:

1. Vercel → Project → **Settings → Domains** → **Add**
2. Skriv inn `planner.acme.no`
3. Vercel viser DNS-instruksjon (CNAME → `cname.vercel-dns.com`)
4. Be kunden legge inn DNS-record hos sin domeneleverandør
5. Vent 5–60 min på DNS-propagering
6. Domenet får automatisk SSL-sertifikat (gratis)

---

## 📤 Fase 6 — Levering til kunde (5 min)

Send velkomst-e-post med:

```
Hei <Kunde>,

Din KoDo Planner-instans er klar:
🌐 URL:  https://planner-<kallenavn>.vercel.app
📅 Versjon: v4.5.3

Slik kommer du i gang:
1. Bokmerk lenken
2. Legg til oppgaver med klikk i kalenderen
3. Bruk hover-tooltip for å se beskrivelser
4. Estimer timer for å se ressurssum i sidebar

Spørsmål? Bare ta kontakt.

Mvh,
<ditt navn>
Ko|Do Consult
```

📎 Legg gjerne ved en kort PDF eller Loom-video som viser bruk.

---

## 🔧 Vedlikehold etter levering

### Endre task-typer / helligdager / bakgrunner
1. Rediger `public/clients/<kallenavn>.json` i GitHub
2. Commit + push
3. Vercel re-deployer alt automatisk innen 1–2 min

### Bugfix til alle kunder samtidig
1. Gjør endring i koden (én gang)
2. Push til main
3. **Alle** kundeprosjekter re-deployer automatisk ✨

### Backup av kundedata
1. Vercel → Storage → kundens KV-store → **Open in Upstash**
2. Upstash Console → Data Browser → **Export**
3. Lagre JSON-filen lokalt eller i Drive

### Slette en kunde permanent
1. Vercel → Project → Settings → **Delete Project**
2. Storage → KV-store → **Delete Database**
3. Be sikker — dette kan ikke angres

---

## 💸 Kostnader

### Modell A (du eier alt — anbefalt)

| Tjeneste | Plan | Pris/mnd |
|---|---|---|
| Vercel Pro | $20/mnd uansett antall kunder | **~200 kr** (din faste kostnad) |
| Upstash Pay-as-you-go | $0,20 per 100k commands + $0,25/DB | **~$1 (10 kr) per kunde** |
| GitHub | Allerede din | 0 kr |
| Custom domene | Kunden eier | 0 kr |
| **Marginal kostnad per ekstra kunde** | | **~10 kr/mnd** |

**Faktureringsmodell mot kunden:** ~500 kr/mnd (dekker hosting + support + din tid). Inntekt 490 kr per kunde, ren margin.

### Modell B (kunden eier alt)

| Tjeneste | Hvem betaler | Pris/mnd |
|---|---|---|
| Vercel Pro | **Kunden** | $20 (200 kr) |
| Upstash Free tier | **Kunden** | 0 kr |
| Custom domene | Kunden eier | 0 kr |
| **Din kostnad** | | **0 kr** |

**Faktureringsmodell mot kunden:** Kun support-tid (f.eks. 200–300 kr/mnd som vedlikehold).

---

> 💡 **Free tier-info for Modell A:**
> Upstash Free Plan = **1 database per Upstash-konto** (ikke per prosjekt!)
> Du må derfor oppgradere DIN Upstash til Pay-as-you-go for å lage flere DB-er.
> Realistisk forbruk per KoDo-kunde: ~90k commands/mnd = ~$0,43/mnd.
> Sett av $1/kunde for trygghet.

---

## 🚦 Rask sjekkliste (når du gjør det 5. gang)

```
[ ] Fase 1: clients/<navn>.json laget + pushet
[ ] Fase 2: Upstash Redis opprettet
[ ] Fase 3: Vercel-prosjekt + 3 env-vars + KV-tilkobling
[ ] Fase 4: Smoke-test i prod
[ ] Fase 5: (valgfritt) custom domene
[ ] Fase 6: Velkomst-e-post sendt
```

---

## 🧪 Demo-deployment (variant av samme runbook)

Når du skal sette opp en **demo-instans** for å vise potensielle kunder:

### Forskjeller fra vanlig kunde-deploy

1. **Bruk kallenavn `demo`** og opprett `public/clients/demo.json`
2. **I JSON-fila, sett:**
   ```json
   {
     "demoMode": true,
     "demoAnchorWeek": 18,
     "taskTypes": { ... },
     "holidays": { ... }
   }
   ```
   - `demoMode: true` → viser oransje "DEMO"-chip i header, skjuler "Slett alle oppgaver"-knappen i Settings (Faresone)
   - `demoAnchorWeek: 18` → app åpner direkte på mandag i ISO-uke 18 (juster til den uka demo-dataene dine ligger i)
3. **Brand:** Velg en nøytral brand, f.eks. `NEXT_PUBLIC_BRAND_NAME=KoDo Planner Demo`
4. **Vercel-prosjekt:** `planner-demo`
5. **Upstash:** Egen separat database (`planner-demo-kv`)

### Etter første deploy — fyll inn demo-data

1. Logg inn på `https://planner-demo.vercel.app`
2. Lag pene, kuraterte oppgaver i uke `demoAnchorWeek` og noen uker rundt:
   - Ulike task-typer for fargevariasjon
   - Realistiske titler ("Møte med Anders K.", "Kvartalsrapport", "LinkedIn outreach")
   - Noen med beskrivelser
   - Noen med estimater
   - Noen med dependencies (én "venter på" en annen)
   - Noen markert som ferdig så grønne hakene synes
3. Test selv at app-en føles levende og pen

### Lag "demo-perfect-state" backup

1. **Innstillinger → Last ned backup**
2. Filen havner i Downloads — gi den et fast navn:
   ```
   demo-perfect-state.json
   ```
3. Lagre filen et trygt sted (Dropbox, iCloud, hvor som helst)

### Workflow før hver demo med interessent

1. Send link → `https://planner-demo.vercel.app`
2. Etter de er ferdige (de kan ha togglet ferdig, redigert, opprettet nye, slettet):
   - **Innstillinger → Gjenopprett fra backup**
   - Velg `demo-perfect-state.json`
   - Bekreft i dialogen → demo er fresh igjen om 3 sekunder

### Hva interessenten kan og ikke kan i demo-modus

| Handling | Tillatt? |
|---|---|
| Opprette ny oppgave | ✅ |
| Redigere oppgave | ✅ |
| **Slette enkelt-oppgave** | ✅ (føles ekte) |
| Toggle ferdig/ikke-ferdig | ✅ |
| Drag-and-drop | ✅ |
| Søk | ✅ |
| Alle visninger (Uke/Måned/Liste) | ✅ |
| Last ned backup | ✅ |
| **Reset DB ("Slett alle oppgaver")** | ❌ skjult |

> 💡 Dette gir interessenten en **realistisk opplevelse** — hen kan rote, slette, lage — men kan ikke nuke hele databasen og ødelegge for neste demo.

---

## 🆘 Vanlige feilmeldinger

| Feil | Årsak | Fix |
|---|---|---|
| `pnpm-lock.yaml is not up to date` | Lockfile ikke oppdatert etter dependency-endring | `pnpm install --lockfile-only` + commit |
| Header viser "KoDo Planner" hos Acme | `NEXT_PUBLIC_BRAND_NAME` ikke satt eller deploy ikke gjort | Sett env, redeploy |
| Innstillinger viser "Avvik: clients/X.json mangler" | Filen ikke pushet eller env feil | Sjekk at filen finnes på GitHub + at env matcher filnavn |
| Oppgaver vises ikke / 500-feil i nettleseren | KV-store ikke koblet | Storage-fanen → Connect Store → redeploy |
| `Cannot find module @upstash/redis` | Build cache fra før Fase A | Vercel → Deployments → Redeploy med "Clear cache" |

---

_Versjon: v4.5.3 · Sist oppdatert: 26. apr 2026_

---

## 🔄 Variant: Modell B (kunden eier kontoer)

Hvis kunden ønsker å eie sin egen Vercel + Upstash:

**Endringer i flyten:**

- **Fase 0:** Kunden lager Vercel-konto (Pro, $20/mnd) og Upstash-konto **før** møtet, og inviterer deg som team-medlem.
- **Fase 2:** Upstash opprettes på *kundens* konto (bruk Free tier — 1 DB per konto er nok når kunden har sin egen)
- **Fase 3:** Vercel-prosjekt opprettes på *kundens* konto (du logger inn som team-medlem)
- **Fase 6:** I velkomst-e-posten nevn også at kunden bør sette inn fakturainfo selv på Vercel og Upstash
- **Vedlikehold:** Du logger inn på kundens kontoer for bug-fix når trengs (~1–2 ganger per måned)

**Resten av runbooken er identisk** — bare tenk "kundens konto" der det står Vercel/Upstash.
