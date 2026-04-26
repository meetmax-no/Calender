# KoDo Planner — Backlog

Sentralt sted for ideer som ikke er aktive akkurat nå. Henter herfra ved neste "løft".

---

## 🟡 P1 — Vurderes ved konkret behov

### Google Auth (NextAuth med Google-provider)
- **Hvorfor:** Nødvendig hvis flere personer skal jobbe i samme database
- **Hva trengs:** Google OAuth client ID/secret, NextAuth-installasjon, en `users`-tabell i Upstash, oppdaterte API-routes med session-sjekk
- **Estimert jobb:** 2–3 timer
- **Avhengighet:** Brukeren må først bestemme om dette er solo-app eller team-app

#### Nødvendig samtidig: Synlighet per oppgave (privat/team)
Når Auth innføres må det også finnes synlighets-kontroll på hver oppgave, ellers blir det rotete. Foreslått modell:

- **Privat** 🔒 — kun synlig for den som opprettet (default for nye oppgaver?)
- **Team** 👥 — synlig for alle som har tilgang til samme klient-config
- **(Mulig senere) Delt med spesifikke brukere** 👤👤 — pick-list av navngitte teammedlemmer

**Schema-endring i `Todo`:**
```ts
visibility: "private" | "team";
ownerId: string;       // Hvem opprettet oppgaven
sharedWith?: string[]; // Frivillig — for fremtidig "delt med X" 
```

**UI-konsekvenser:**
- Toggle/dropdown i TaskModal ("Synlig for: meg / hele teamet")
- Visuell markør på private oppgaver (lite hengelås-ikon)
- Filter-sjekkbokser i sidebar: "Mine oppgaver / Team-oppgaver / Alle"
- API må filtrere bort private oppgaver fra andre brukere

**Default-policy å velge:**
- Alt er Team som default → enklest for små team, men fare for å lekke noe privat
- Alt er Privat som default → tryggere, men team-oppgaver krever ekstra klikk
- *Min anbefaling:* Privat som default. Det er alltid tryggere å åpne en oppgave senere enn å oppdage at en privat tanke ble synlig.

**Estimert jobb:** ~1.5 timer på toppen av Auth-jobben (dvs. samlet ca. 4 timer for full Auth + visibility)

---

## 🟢 P2 — Mulige forbedringer (avhenger av faktisk bruk)

### Tastatur-snarveier på desktop
- `N` = ny oppgave
- `/` = fokus søkefelt
- `1` / `2` / `3` = bytt mellom Uke/Måned/Liste
- `?` = vis hjelp-overlay
- **Estimert jobb:** ~30 min
- **Avhengighet:** Bruker må teste appen og se om hen savner det

### Notater per dag
- En kort tekstboks per dag (ikke en oppgave) — for "husk å ringe X" eller "møte i Tromsø"
- **Estimert jobb:** ~1 time

### Egen "fokus i dag"-modus
- Liste over alle åpne oppgaver med dagens dato — fullskjerm uten distraksjoner
- **Estimert jobb:** ~1.5 timer

### Svar/notater per oppgave
- Mulighet for å legge til oppdateringer/notater på en eksisterende oppgave (timeline)
- **Estimert jobb:** ~2 timer (krever schema-utvidelse)

### Eksport til PDF eller bilde
- "Print uka som PDF" til kunder/teammedlemmer
- **Estimert jobb:** ~1 time (kan bruke `html2canvas` eller browser print)

---

## ⚪ Idéliste — kanskje ikke

### Day-visning (én dag i stort format)
- **Vurdering:** Trolig overkill. Uke-visningen viser én dag fint nok i en 7-kolonne grid. Ikke prioritert.

### Kopier oppgave til neste uke
- **Vurdering:** Lav verdi. Datofeltet i edit-modal gjør samme jobb. Drag-and-drop dekker også dette.

### Tracking actual time vs estimat
- **Vurdering:** Bruker har eksplisitt sagt "kommer ikke til å bruke det". Skip.

---

## ❌ Fjernet fra scope (gammel MeetMax v3.4-arv)

Disse var planlagt da appen het MeetMax v3.4 og var en markedsføringsverktøy. KoDo Planner har pivotert til et rent planleggingsverktøy, og disse er ikke relevante:

- ~~KPI-fane med Facebook Ads-dashboard (ROAS, CPA, CTR, reach)~~
- ~~CSV-import fra Facebook Ads-eksport~~
- ~~Budsjett/CPA-målvisning fra CAMPAIGN_DEFAULTS~~
- ~~Day-visning (overkill)~~

Hvis Facebook Ads-tall noen gang blir relevant igjen → bygges som *separat* app heller enn å klemme inn her.

---

## 📌 Notater fra brukerens egne ord

- "Appen kan alt + litt mer" (apr 2026) — tegn på at vi nærmer oss MVP-bredden
- "Ikke sikker på keyboard" (apr 2026) — vil teste appen først, vurdere senere
- "Kommer ikke til å bruke" tracking actual time (apr 2026)

---

_Sist oppdatert: 2026-04-26_
