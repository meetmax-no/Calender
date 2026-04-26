# 🚀 Ny kunde på KoDo Planner — Runbook

> ⚠️ **MERK (apr 2026):** Dette er det opprinnelige planleggings-dokumentet fra før implementering.
> JSONBin er erstattet av **Upstash Redis**, og **Google Auth er ikke implementert ennå** (planlagt v5.0).
> For den faktiske, oppdaterte deploy-runbooken, se `/DEPLOY_NEW_CLIENT.md`.
> Denne filen beholdes som arkitektur-referanse og bakgrunns-tankegang.

_Teoretisk onboardings-dokument. Leses før implementering._
_Mål: Fra "ny kunde signert" til "live på egen URL" på ≤ 30 min._

---

## 0. Hvorfor denne modellen?

Hver kunde skal ha **full dataisolering**, egen merkevare, og egne innloggede brukere — uten at du vedlikeholder flere kodebaser.

**Løsning:** Én GitHub-repo → mange Vercel-prosjekter → hver sin JSONBin og config-fil, styrt via env-variabler.

```
   meetmax-no/Calender  ←── én kodebase, alltid oppdatert
          │
   ┌──────┼─────────┬───────────┐
   │      │         │           │
 Vercel  Vercel   Vercel      Vercel
 (KoDo)  (Acme)   (Beta)      (kunde-N)
   │      │         │           │
 JSONBin JSONBin  JSONBin     JSONBin
 (KoDo)  (Acme)   (Beta)      (kunde-N)
```

Hver Vercel-deploy leser sine egne env-vars og laster:
- Sin egen `clients/<kundenavn>.json` (taskTypes, helligdager, bakgrunner, branding)
- Sin egen JSONBin (oppgavedata)
- Sin egen Google-whitelist (hvem får logge inn)

---

## 1. Komponenter per kunde

| Ressurs | Hva | Hvor opprettes |
|---|---|---|
| **Vercel-prosjekt** | Egen deployment med kunde-spesifikk URL | vercel.com |
| **Vercel KV-store** | Oppgave-lagring (ToDoEvents) — ~20 ms reads/writes | Vercel Dashboard |
| **Google OAuth whitelist** | Liste med e-poster som får logge inn | Vercel env |
| **Client config** | JSON-fil i repo under `/public/clients/` | GitHub-commit |
| **(Evt.) custom domene** | planner.kunde.no i stedet for vercel.app | Vercel + DNS |

---

## 2. Hva som må bygges ÉN GANG (før første kunde)

Dette er arbeidet vi skal gjøre i hugget:

### 2.1 Multi-client config-struktur
- Flytt `/public/config.json` → `/public/clients/default.json`
- Lag `/public/clients/_template.json` (mal for nye kunder)
- Oppdater `useAppConfig.ts` til å lese `process.env.NEXT_PUBLIC_CLIENT_CONFIG`
  - Default "default" hvis ikke satt
  - Fetch URL blir `/clients/${name}.json`

### 2.2 Google OAuth med NextAuth.js (Auth.js v5)
- Installer `next-auth@beta`
- Lag `/app/api/auth/[...nextauth]/route.ts` med Google-provider
- Feature flag: `NEXT_PUBLIC_AUTH_ENABLED`
  - `false` → appen virker som i dag (ingen login)
  - `true` → login kreves, whitelist sjekkes
- E-post-whitelist via `ALLOWED_EMAILS` (komma-separert)
- Login/logout-knapp i `AppHeader`
- Redirect til `/login` hvis auth aktiv og ikke logget inn

### 2.3 Branding via env
- `NEXT_PUBLIC_BRAND_NAME` → vises i header (f.eks. "Acme Planner")
- `NEXT_PUBLIC_BRAND_ACCENT` → hex-farge for primære knapper (valgfritt)
- Footer-tekst bygges automatisk: `"{BRAND} · Powered by Ko|Do Consult"`

### 2.4 Deploy-sjekkliste (DEPLOY_NEW_CLIENT.md)
Sjekkliste for deg selv når ny kunde skal opp. Lagres i repo.

---

## 3. Vercel env-variabler per kunde

Dette er **alle** env-vars et kunde-prosjekt trenger. Legg inn i Vercel Dashboard → Settings → Environment Variables.

| Variabel | Eksempel | Påkrevd? | Forklaring |
|---|---|---|---|
| `NEXT_PUBLIC_CLIENT_CONFIG` | `acme` | ✅ | Navn på config-fil (uten .json) under `/public/clients/` |
| `KV_URL` | `redis://default:xxx@...` | ✅ | Vercel KV connection string (auto-injiseres ved KV-kobling) |
| `KV_REST_API_URL` | `https://...upstash.io` | ✅ | Auto-injiseres ved KV-kobling |
| `KV_REST_API_TOKEN` | `AX...` | ✅ | Auto-injiseres ved KV-kobling |
| `KV_REST_API_READ_ONLY_TOKEN` | `AY...` | ✅ | Auto-injiseres ved KV-kobling |
| `NEXT_PUBLIC_AUTH_ENABLED` | `true` | ✅ | `true` = Google login aktiv |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | ✅ hvis auth | Fra Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | ✅ hvis auth | Fra Google Cloud Console |
| `NEXTAUTH_SECRET` | _(random 32+ tegn)_ | ✅ hvis auth | Generer med `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://planner-acme.vercel.app` | ✅ hvis auth | Prosjektets produksjons-URL |
| `ALLOWED_EMAILS` | `ola@acme.no,kari@acme.no` | ✅ hvis auth | Komma-separert whitelist |
| `NEXT_PUBLIC_BRAND_NAME` | `Acme Planner` | ⚪ | Navn i header. Default: "KoDo Planner" |
| `NEXT_PUBLIC_BRAND_ACCENT` | `#E85D04` | ⚪ | Aksent-hex. Default: blå |

> 💡 **Tips:** De fire `KV_*`-variablene settes automatisk når du kobler en KV-store til Vercel-prosjektet. Du trenger ikke kopiere dem manuelt.

---

## 4. Onboarding av ny kunde — 7 steg

**Antatt tid: 20–30 min per kunde.**

### Steg 1 — Vercel KV-store (3 min)
1. Vercel Dashboard → **Storage** → **Create Database** → velg **KV**
2. Navn: `planner-<kunde>-kv`
3. Region: velg nærmest kundens brukere (f.eks. `arn1` for Norden)
4. Klikk **Create**
5. **Connect Project** → velg kundens Vercel-prosjekt (gjøres i steg 4, men kan kobles nå hvis prosjektet finnes)
6. Under **Quickstart** → kopier JSON-fragmentet med `KV_*`-variablene _(kun hvis du IKKE har auto-koblet prosjektet — ellers injiseres de automatisk)_

> 💡 Første gang du oppretter en KV-store får du et valg om Upstash-basert eller native. Velg **Upstash-basert** (default). Det er samme produktet under panseret.

### Steg 2 — Google Cloud Console (5 min, kun første gang per kunde)
1. Gå til [console.cloud.google.com](https://console.cloud.google.com)
2. Opprett nytt prosjekt: `Planner-<Kunde>`
3. APIs & Services → Credentials → **Create Credentials → OAuth client ID**
4. Application type: **Web application**
5. Authorized redirect URIs:
   ```
   https://planner-<kunde>.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google   ← for lokal test
   ```
6. Noter `CLIENT_ID` og `CLIENT_SECRET`

_Tips: Hvis kunder er Google Workspace-kunder, kan OAuth-apper begrenses til deres domene i consent screen-oppsett._

### Steg 3 — Client config (3 min)
1. I GitHub-repoet: kopier `public/clients/_template.json` → `public/clients/<kunde>.json`
2. Tilpass:
   - `taskTypes` (kundens farge/typer)
   - `holidays` (kan være lik default)
   - `backgrounds` (kundens bilder eller standard-sett)
   - `brandName` _(hvis vi vil styre via config i stedet for env)_
3. Commit + push til main

### Steg 4 — Vercel-prosjekt (5 min)
1. Vercel Dashboard → **Add New → Project**
2. Velg samme GitHub-repo `meetmax-no/Calender`
3. Project Name: `planner-<kunde>`
4. Ikke deploy enda — gå til **Environment Variables** først
5. Lim inn alle env-vars fra listen i seksjon 3 (EKSKLUSIV `KV_*`-variablene)
6. Klikk **Deploy**
7. Etter første deploy: Gå til **Storage**-fanen → koble KV-storen fra steg 1 til prosjektet. Da injiseres `KV_*` automatisk og prosjektet re-deployer.

### Steg 5 — Bekreft deploy (2 min)
1. Åpne `https://planner-<kunde>.vercel.app`
2. Sjekk:
   - [ ] Riktig branding i header
   - [ ] Login-skjerm dukker opp (hvis auth aktiv)
   - [ ] Logg inn med whitelistet e-post → får tilgang
   - [ ] Prøv ikke-whitelistet e-post → avslås
   - [ ] Opprett en test-oppgave → verifiser den lagres i KV (sjekk i Vercel → Storage → KV → Data Browser)
   - [ ] Slett test-oppgaven
   - [ ] Mål response-tid (bør være < 100 ms, ofte ~20 ms)

### Steg 6 — Custom domene (valgfritt, 5 min + DNS-venting)
1. Vercel → Project → Settings → Domains → Add
2. F.eks. `planner.acme.no`
3. Legg til DNS CNAME hos kundens registrar → `cname.vercel-dns.com`
4. Oppdater `NEXTAUTH_URL` til `https://planner.acme.no`
5. Oppdater Google OAuth redirect URI tilsvarende
6. Re-deploy

### Steg 7 — Overlever til kunde (5 min)
1. Send e-post med:
   - URL til appen
   - Liste med whitelistede e-poster
   - Kort intro til bruk
2. _(Anbefalt)_ Felles 30-min onboardings-call første gang

---

## 5. Vedlikehold etter go-live

### Legge til ny bruker hos eksisterende kunde
1. Vercel → Project → Settings → Environment Variables
2. Rediger `ALLOWED_EMAILS` → legg til ny e-post
3. Klikk **Save** → **Redeploy** (tar 30 sek)

### Oppdatere kundens config (farger, helligdager)
1. Rediger `public/clients/<kunde>.json` i GitHub
2. Commit → push
3. Alle kundens deploys oppdateres automatisk

### Bugfix/ny feature
1. Gjør endringen i Emergent / lokalt
2. Push til GitHub
3. **Alle** kundeprosjektene re-deployer automatisk ✨

---

## 6. Viktige prinsipper

### ✅ GJØR
- Hold `clients/<kunde>.json` i git slik at det er versjonert
- Roter `NEXTAUTH_SECRET` minst én gang per år
- Legg til backup-export via "Last ned JSON" i Settings-panelet for hver kunde
- Eksporter KV-data som backup før store endringer (Vercel KV → Data Browser → Export)

### ❌ IKKE GJØR
- **Aldri** hardkod kunde-spesifikke verdier i koden — alltid via env eller client-config
- **Aldri** del samme KV-store mellom kunder — data vil lekke
- **Aldri** pusje `.env.local` til GitHub
- **Ikke** bruk samme Google OAuth-credentials på tvers av kunder (sikkerhet + isolasjon)
- **Ikke** bruk Edge Config som DB — den er for feature-flags, ikke CRUD-data

---

## 7. Prisestimat per kunde (2026)

| Tjeneste | Plan | Pris/mnd |
|---|---|---|
| Vercel Hobby | Gratis | 0 kr |
| Vercel KV (Upstash) | Free tier (30k kommandoer/mnd) | 0 kr |
| Google OAuth | Gratis for < 100 brukere | 0 kr |
| Custom domene | Hvis kunden har det | 0 kr (de betaler) |
| **Totalt per kunde** | | **0 kr** |

Vercel Pro ($20/mnd) trengs først når:
- Du har > 100 deploys per dag totalt
- Du trenger password-protected preview-URL-er
- Du vil ha kortere build-køer
- Du må over 30k KV-kommandoer/mnd per kunde (_tilsvarer ~500 oppgaveendringer/dag vedvarende_)

---

## 8. Skaleringsgrense for denne modellen

Modellen fungerer fint opp til **~10–15 kunder**. Over det blir manuelt oppsett kjedelig.

**Når du skal over 15 kunder:** Vurder migrering til ekte multi-tenant:
- Én Vercel-deploy (`planner.kodoconsult.no`)
- Én felles Vercel Postgres (Neon) eller Supabase-database
- Kundene separeres via `workspaceId` i database
- Selvbetjent onboarding
- Mulighet for Stripe-abonnement

Men det er framtids-Ko|Do sitt problem. 😄

---

## 9. Filer som vil endres/opprettes ved implementering

### Nye filer
- `/public/clients/default.json` (flyttet fra `config.json`)
- `/public/clients/_template.json`
- `/app/api/auth/[...nextauth]/route.ts`
- `/app/login/page.tsx`
- `/components/AuthGate.tsx` (wrapper som sjekker session)
- `/components/LoginButton.tsx`
- `/lib/auth.ts`
- `/lib/kv.ts` (tynn wrapper rundt @vercel/kv)
- `/scripts/migrate-jsonbin-to-kv.ts` (engangs-migrering)
- `/DEPLOY_NEW_CLIENT.md` (sjekkliste, commitet)
- `.env.local.example` (mal for deg selv)

### Filer som endres
- `/hooks/useAppConfig.ts` — leser env for config-filnavn
- `/app/api/todos/route.ts` — bytter JSONBin-fetch til `kv.get/set`
- `/hooks/useTodos.ts` — ingen endring (fortsatt samme API-endepunkt)
- `/app/layout.tsx` — wrap med SessionProvider + AuthGate
- `/app/page.tsx` — sjekker auth-status
- `/components/AppHeader.tsx` — login/logout-knapp + brand-navn
- `/components/SettingsPanel.tsx` — vis innlogget bruker
- `/package.json` — legger til `@vercel/kv` og `next-auth@beta`

### Filer som slettes
- `/public/config.json` (flyttet)
- Referanser til `JSONBIN_MASTER_KEY` / `JSONBIN_BIN_ID` i alle env-filer

---

## 10. Implementerings-rekkefølge (når vi gjør hugget)

_Revidert rekkefølge: Migrering → Multi-client + Branding → Auth. Dette gir trygg base først, bygger på stabil arkitektur, og legger auth på toppen når alt annet er verifisert._

**Fase A — Migrering JSONBin → Vercel KV** (~45 min)
_Gjøres først så vi har en rask og stabil base._
1. Opprett Vercel KV-store for Ko|Do-prosjektet
2. Installer `@vercel/kv`
3. Skriv om `/app/api/todos/route.ts` til KV
4. Lag engangs-migrerings-skript: `scripts/migrate-jsonbin-to-kv.ts`
5. Kjør migrering for Ko|Do-instansen
6. Verifiser data-integritet mot JSONBin (antall records + stikkprøver)
7. Deploy + test i produksjon (Ko|Do-instansen)
8. Behold JSONBin som backup i 1 uke før sletting

**Fase B — Multi-client foundation + branding** (~60 min)
_Gjøres sammen fordi de deler samme struktur: env-driven config._
9. Flytt `config.json` → `public/clients/default.json`
10. Lag `public/clients/_template.json` (mal for nye kunder)
11. Oppdater `useAppConfig.ts` til å lese `NEXT_PUBLIC_CLIENT_CONFIG`
12. Legg til `NEXT_PUBLIC_BRAND_NAME` i `AppHeader`
13. (Valgfritt) `NEXT_PUBLIC_BRAND_ACCENT` via Tailwind CSS-var
14. Test lokalt med to ulike configs + brandnavn
15. Deploy Ko|Do med `NEXT_PUBLIC_CLIENT_CONFIG=default`

**Fase C — Google Auth** (~90 min)
_Legges på når datalaget og config-strukturen er stabil._
16. Installer `next-auth@beta`
17. Sett opp `/app/api/auth/[...nextauth]/route.ts` med Google Provider
18. Whitelist-logikk via `ALLOWED_EMAILS`
19. Feature flag: `NEXT_PUBLIC_AUTH_ENABLED` (true/false)
20. `AuthGate`-komponent som wrapper hele appen
21. Login-side + logout-knapp i header
22. Test: whitelistet e-post → inn, annen e-post → avvises
23. "Emergency bypass"-env-var (`AUTH_BYPASS_KEY`) for nødstilfelle

**Fase D — Dokumentasjon + sjekkliste** (~20 min)
24. Skriv `DEPLOY_NEW_CLIENT.md` (commitet sjekkliste i repo)
25. Oppdater `README.md` med nye env-vars
26. `.env.local.example` med alle vars og kommentarer

**Fase E — Første kunde-deploy (deg selv, full runde)** (~15 min)
27. Verifiser alt på Ko|Do-instansen en siste gang
28. Aktiver auth (`NEXT_PUBLIC_AUTH_ENABLED=true`)
29. Test innlogging med din egen Google-konto
30. Slett JSONBin permanent

**Total: ~3,5–4 timer i ett hugg.**

### Hvorfor denne rekkefølgen?
- **Migrering først** = rask app fra første minutt; alt annet arbeid skjer mot ferdig datalag
- **Multi-client + branding sammen** = begge handler om "lese env-var, endre oppførsel" — ingen grunn til å splitte
- **Auth sist** = minst risiko for å låse oss ute av appen under utvikling, og vi vet at resten funker før vi gater det

---

## 11. Risikoer å være klar over

| Risiko | Sannsynlighet | Mitigering |
|---|---|---|
| Glemmer env-var → appen krasjer ved deploy | Høy | Sjekkliste i DEPLOY_NEW_CLIENT.md |
| Google OAuth callback URL-mismatch | Middels | Dokumenter begge URL-er (lokal + prod) |
| KV-migrering mister data | Lav | Kjør dry-run først, behold JSONBin til alt er verifisert |
| KV free tier-grense nås | Lav | 30k kommandoer/mnd holder i praksis; oppgrader eller bytt til Postgres |
| Kunde mister OAuth-tilgang (domene utløper) | Lav | Egen OAuth-app per kunde = isolert feil |
| Accidentally pusher secrets til Git | Middels | Bruk `.env.local` + `.gitignore` + hemmelighets-scanner |

---

## 12. Sjekkliste før vi starter hugget

Før vi setter i gang med implementering, bekreft:

- [ ] Har du en Google Cloud-konto? (brukes gratis)
- [ ] Er du komfortabel med at NextAuth.js er biblioteket (ikke Firebase/Clerk)?
- [ ] Ønsker du "feature flag-modus" der auth kan skrus helt av per deploy?
- [ ] Skal første implementering også inkludere din egen Ko|Do-instans med auth, eller beholder vi den åpen?
- [ ] Vil du ha en "Emergency bypass"-env-var i tilfelle auth krasjer i produksjon?
- [ ] Migrere JSONBin → Vercel KV som del av samme hugg? _(anbefalt — se seksjon 13)_

---

## 13. Migrering: JSONBin → Vercel KV

### Hvorfor vi bytter

| Metric | JSONBin | Vercel KV |
|---|---|---|
| Read-tid | 200–2000 ms (varierer) | ~20 ms (stabil) |
| Write-tid | 300–500 ms | ~20 ms |
| Free tier-grense | 10k requests/mnd | 30k kommandoer/mnd |
| Kobling til Vercel | HTTP fetch med header-auth | SDK, env-auto-injiseres |
| Data-browser | Web-UI på jsonbin.io | I Vercel Dashboard |
| Backup/export | Manuell (CSV eller download) | Én-klikk i Vercel |

**Hovedsmerte:** JSONBin er tregt og uforutsigbart. Brukere opplever spinnere på handlinger som toggle/add/delete.

### Hva som faktisk endres i koden

Kun **én fil** endres i praksis: `/app/api/todos/route.ts`. Hooks og komponenter forblir identiske fordi de snakker mot samme internal API.

**Før** (forenklet):
```typescript
export async function GET() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { "X-Master-Key": MASTER_KEY }
  });
  const { record } = await res.json();
  return Response.json(record);
}

export async function PUT(req: Request) {
  const body = await req.json();
  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": MASTER_KEY,
    },
    body: JSON.stringify(body),
  });
  return Response.json({ ok: true });
}
```

**Etter**:
```typescript
import { kv } from "@vercel/kv";

export async function GET() {
  const data = (await kv.get<BinData>("todos")) ?? { ToDoEvents: [] };
  return Response.json(data);
}

export async function PUT(req: Request) {
  const body = await req.json();
  await kv.set("todos", body);
  return Response.json({ ok: true });
}
```

Mindre kode, raskere, og nøkler forsvinner fra applikasjonen (Vercel injiserer dem automatisk).

### Migreringsflyt (engangs-jobb per kunde)

1. **Opprett KV-store** i Vercel (3 min, steg 1 i onboardings-flyten)
2. **Kjør migreringsskript** `scripts/migrate-jsonbin-to-kv.ts`:
   ```bash
   npx tsx scripts/migrate-jsonbin-to-kv.ts \
     --bin-id=$OLD_JSONBIN_ID \
     --master-key=$OLD_JSONBIN_KEY
   ```
   Skriptet:
   - Henter alle `ToDoEvents` fra JSONBin
   - Skriver dem til `kv.set("todos", data)`
   - Printer antall records migrert
3. **Verifiser** i Vercel KV Data Browser — skal se samme antall oppgaver
4. **Bytt kode-endepunkt** til KV (commit + deploy)
5. **Behold JSONBin i 1 uke** som fail-safe backup
6. **Slett JSONBin** når alt er verifisert i produksjon

### Rollback-plan

Hvis noe går galt:
1. Revertér commit som byttet til KV
2. Env-var `JSONBIN_*` er fortsatt i Vercel → appen virker igjen
3. Ingen datatap så lenge JSONBin ikke er slettet

### Kostnad etter bytte

- JSONBin: behold gratis til data er slettet (1 uke), si opp
- Vercel KV free tier: 30k kommandoer/mnd = ~1000/dag = mer enn nok for en konsulent-planlegger
- Realistisk forbruk for én bruker: ~50–200 kommandoer/dag

---

_Siste oppdatering: Apr 2026_
_Forfatter: Ko|Do Consult + E1_
