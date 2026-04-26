# 🔄 Slik kommer du tilbake til prosjektet

Denne guiden er for deg (brukeren), ikke for agenten. Lim eventuelt deler av den inn i ny chat for å gi den nye agenten kontekst.

---

## Steg 1: Åpne en ny chat i Emergent

Gå inn på Emergent-platformen og åpne samme prosjekt (KoDo Planner / Calender). Velg **ny chat** når den dukker opp. En fersk agent har ren hukommelse, men den vil automatisk lese denne dokumentasjonen som ligger i `/app/memory/`:

| Fil | Inneholder |
|---|---|
| `/app/memory/PRD.md` | Hva appen er, hva som er bygget, kritisk teknisk info |
| `/app/memory/BACKLOG.md` | Alle ideer og prioriteringer vi har diskutert |
| `/app/memory/CLIENT_ONBOARDING.md` | Hvordan legge til en ny kunde |
| `/app/memory/Restart.md` | Denne filen |
| `/app/DEPLOY_NEW_CLIENT.md` | Steg-for-steg deploy-runbook |

**👉 Det første du bør si til den nye agenten:**
> *"Les PRD.md og BACKLOG.md før vi starter. Snakk Norsk."*

Den vil da være fullstendig oppdatert på hva vi har gjort, hva som er prioritert, og hva som er valgt bort.

---

## Steg 2: Hent siste kode fra GitHub

Dette er **kritisk** og glemmes ofte. Når du åpner ny chat får du en fersk container — koden der starter fra et tidlig punkt og er **ikke synkronisert** med det som ligger i Vercel/GitHub. Du må eksplisitt hente ned siste versjon.

Si til agenten:
> *"Pull alle filer fra GitHub før vi starter."*

Den vil kjøre:
```bash
git fetch origin main && git reset --hard origin/main
```

Dette er allerede dokumentert i PRD.md, så agenten vet hvordan. Hvis du har redigert `public/clients/meetmax.json` direkte på GitHub i mellomtiden (f.eks. for å justere bakgrunnsbilder eller helligdager), blir det også med ned.

---

## Steg 3: Fortell agenten hva du vil gjøre

Her er det viktigste: **vær konkret om hva du vil ha gjort**. Si f.eks.:

✅ *"Jeg har testet appen i to uker og oppdaget at jeg savner X. Kan du legge til det?"*

✅ *"Jeg vil starte på Google Auth med privat/team-synlighet, slik vi planla i backlog."*

✅ *"Det er en bug: når jeg gjør X skjer Y. Skjermbilde vedlagt."*

Unngå:

❌ *"Fortsett der vi slapp"* — agenten har ingen sesjon-hukommelse, så dette er litt vagt

❌ *"Hva skal vi gjøre nå?"* — du vet bedre enn agenten hva *du* trenger

---

## Steg 4: Lagre tilbake til GitHub etterpå

Når du er ferdig med endringene og vil deploye:

1. Trykk på **"Save to GitHub"**-knappen i Emergent-chatten (under input-feltet)
2. Vercel ser commit-en og deployer automatisk innen 1–2 minutter
3. Du tester på din vanlige URL

---

## ⚠️ Tre fallgruver å unngå

### 1. Ikke glem å pulle først
Hvis agenten begynner å redigere kode rett ut av boksen uten å pulle, kan du ende opp med å overskrive endringer du gjorde i forrige sesjon. Si **alltid "pull fra GitHub først"** ved start av ny sesjon.

### 2. Ikke la agenten gjette på hva du vil
Du har en mye klarere mental modell av appen enn agenten. Hvis du sier "fiks det" uten kontekst, ender du opp med å sløse tokens på forklaringer. Vær konkret — én setning om hva, én om hvorfor.

### 3. Universal Key kan gå tom
Hvis du senere skal bruke AI-features (f.eks. auto-foreslå oppgaver), har du en "Universal Key" som har en saldo. Den ses i din profil → Universal Key. Du kan slå på auto-topp-opp så du slipper å tenke på det.

---

## 📝 Anbefalt arbeidsflyt mens du tester

Mens du tester, lag deg en enkel notat-fil på telefonen eller i Notion:

```
KoDo Planner — feedback (uke X–Y)

✅ Det jeg liker:
- Drag-drop er kjempegøy
- Bakgrunnsbilder i mobil ser bra ut

🐛 Bugs:
- Når jeg gjør X på Måned-visning skjer Y
- Type-chip i mobil-toolbaren scroller ikke pent

💡 Mangler:
- Jeg savner Z når jeg gjør W
```

Når du kommer tilbake, lim hele lista inn i ny chat. Da kan agenten prioritere alt på én gang i stedet for å mate inn ett og ett ønske.

---

## 🎯 Mal for første melding i ny chat

Hvis du vil ha en rask copy-paste, her er en god åpning:

```
Hei! Jeg er tilbake etter to uker med testing av KoDo Planner.

1. Les PRD.md og BACKLOG.md først
2. Pull siste kode fra GitHub før vi starter
3. Snakk Norsk

Her er feedbacken min:
[lim inn notatene dine]

Foreslå en prioritert plan og spør før du starter.
```

---

_Sist oppdatert: 2026-04-26 (v4.5.2)_
