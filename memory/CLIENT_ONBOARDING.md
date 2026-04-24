# 🚀 Ny kunde på KoDo Planner — Runbook

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
| **JSONBin** | Oppgave-lagring (ToDoEvents) | jsonbin.io |
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
| `JSONBIN_MASTER_KEY` | `$2a$10$...` | ✅ | Kundens egen JSONBin master-key |
| `JSONBIN_BIN_ID` | `65abc123...` | ✅ | Kundens egen bin-ID for ToDoEvents |
| `NEXT_PUBLIC_AUTH_ENABLED` | `true` | ✅ | `true` = Google login aktiv |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | ✅ hvis auth | Fra Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | ✅ hvis auth | Fra Google Cloud Console |
| `NEXTAUTH_SECRET` | _(random 32+ tegn)_ | ✅ hvis auth | Generer med `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://planner-acme.vercel.app` | ✅ hvis auth | Prosjektets produksjons-URL |
| `ALLOWED_EMAILS` | `ola@acme.no,kari@acme.no` | ✅ hvis auth | Komma-separert whitelist |
| `NEXT_PUBLIC_BRAND_NAME` | `Acme Planner` | ⚪ | Navn i header. Default: "KoDo Planner" |
| `NEXT_PUBLIC_BRAND_ACCENT` | `#E85D04` | ⚪ | Aksent-hex. Default: blå |

---

## 4. Onboarding av ny kunde — 7 steg

**Antatt tid: 20–30 min per kunde.**

### Steg 1 — JSONBin.io (5 min)
1. Logg inn på [jsonbin.io](https://jsonbin.io) (egen konto eller delt via deg)
2. **Create new bin** → lim inn starter-JSON:
   ```json
   { "ToDoEvents": [] }
   ```
3. Lagre. Noter:
   - `BIN_ID` (fra URL-en)
   - `MASTER_KEY` (fra API Keys-seksjonen)
4. _(Valgfritt)_ Sett bin til "private"

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
5. Lim inn alle env-vars fra listen i seksjon 3
6. Klikk **Deploy**

### Steg 5 — Bekreft deploy (2 min)
1. Åpne `https://planner-<kunde>.vercel.app`
2. Sjekk:
   - [ ] Riktig branding i header
   - [ ] Login-skjerm dukker opp (hvis auth aktiv)
   - [ ] Logg inn med whitelistet e-post → får tilgang
   - [ ] Prøv ikke-whitelistet e-post → avslås
   - [ ] Opprett en test-oppgave → verifiser den dukker opp i JSONBin
   - [ ] Slett test-oppgaven

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
- Bruk samme `JSONBIN_MASTER_KEY` på tvers av prosjekter _bare hvis_ kunden er komfortabel med at du har tilgang
- Roter `NEXTAUTH_SECRET` minst én gang per år
- Legg til backup-export via "Last ned JSON" i Settings-panelet for hver kunde

### ❌ IKKE GJØR
- **Aldri** hardkod kunde-spesifikke verdier i koden — alltid via env eller client-config
- **Aldri** del samme JSONBin mellom kunder — data vil lekke
- **Aldri** pusje `.env.local` til GitHub
- **Ikke** bruk samme Google OAuth-credentials på tvers av kunder (sikkerhet + isolasjon)

---

## 7. Prisestimat per kunde (2026)

| Tjeneste | Plan | Pris/mnd |
|---|---|---|
| Vercel Hobby | Gratis | 0 kr |
| JSONBin.io | Free tier (10k requests/mnd) | 0 kr |
| Google OAuth | Gratis for < 100 brukere | 0 kr |
| Custom domene | Hvis kunden har det | 0 kr (de betaler) |
| **Totalt per kunde** | | **0 kr** |

Vercel Pro ($20/mnd) trengs først når:
- Du har > 100 deploys per dag totalt
- Du trenger password-protected preview-URL-er
- Du vil ha kortere build-køer

---

## 8. Skaleringsgrense for denne modellen

Modellen fungerer fint opp til **~10–15 kunder**. Over det blir manuelt oppsett kjedelig.

**Når du skal over 15 kunder:** Vurder migrering til ekte multi-tenant:
- Én Vercel-deploy (`planner.kodoconsult.no`)
- Supabase eller MongoDB Atlas i stedet for JSONBin
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
- `/DEPLOY_NEW_CLIENT.md` (sjekkliste, commitet)
- `.env.local.example` (mal for deg selv)

### Filer som endres
- `/hooks/useAppConfig.ts` — leser env for config-filnavn
- `/app/layout.tsx` — wrap med SessionProvider + AuthGate
- `/app/page.tsx` — sjekker auth-status
- `/components/AppHeader.tsx` — login/logout-knapp + brand-navn
- `/components/SettingsPanel.tsx` — vis innlogget bruker

### Filer som slettes
- `/public/config.json` (flyttet)

---

## 10. Implementerings-rekkefølge (når vi gjør hugget)

**Fase A — Multi-client foundation** (~45 min)
1. Flytt config, lag clients-mappe
2. Les env-var i useAppConfig
3. Test lokalt med to ulike configs

**Fase B — Branding via env** (~20 min)
4. BRAND_NAME i AppHeader
5. (Valgfritt) ACCENT i Tailwind via CSS-var

**Fase C — Auth** (~90 min)
6. Installer next-auth
7. Sett opp route + providers
8. Whitelist-logikk
9. AuthGate-komponent
10. Login-side + logout-knapp
11. Feature flag på/av

**Fase D — Dokumentasjon + testing** (~30 min)
12. Skriv DEPLOY_NEW_CLIENT.md (commitet sjekkliste)
13. Skriv `_template.json`
14. End-to-end test lokalt

**Fase E — Deploy første kunde (deg selv)** (~15 min)
15. Sett opp Ko|Do-instans med alle env-vars
16. Test Google-login
17. Verifiser JSONBin-data fortsatt er intakt

**Total: ~3–3,5 timer i ett hugg.**

---

## 11. Risikoer å være klar over

| Risiko | Sannsynlighet | Mitigering |
|---|---|---|
| Glemmer env-var → appen krasjer ved deploy | Høy | Sjekkliste i DEPLOY_NEW_CLIENT.md |
| Google OAuth callback URL-mismatch | Middels | Dokumenter begge URL-er (lokal + prod) |
| JSONBin free tier-grense | Lav | Flytt til Pro ($3/mnd) eller Supabase ved behov |
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

---

_Siste oppdatering: Apr 2026_
_Forfatter: Ko|Do Consult + E1_
