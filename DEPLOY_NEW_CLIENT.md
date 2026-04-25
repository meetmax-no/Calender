# Deploy ny kunde — sjekkliste

5-min sjekkliste for å sette opp en ny kunde-instans av KoDo Planner.

> Full bakgrunn og arkitektur: se `memory/CLIENT_ONBOARDING.md`

---

## 1. Lag kundens config-fil

```bash
cp public/clients/_template.json public/clients/<kunde>.json
```

Tilpass `_meta`, `taskTypes`, `holidays`, `commercialDays` og `backgrounds`.
Commit + push.

## 2. Opprett Vercel-prosjekt

- Vercel Dashboard → **Add New → Project**
- Velg samme GitHub-repo
- Project Name: `planner-<kunde>`

## 3. Sett env-vars i Vercel

| Variabel | Verdi |
|---|---|
| `NEXT_PUBLIC_CLIENT_CONFIG` | `<kunde>` (uten .json) |
| `NEXT_PUBLIC_BRAND_NAME` | F.eks. `Acme Planner` |
| `NEXT_PUBLIC_BRAND_TAGLINE` | F.eks. `Strategi & vekst` |
| `JSONBIN_MASTER_KEY` | Kundens egen *(eller etter Fase A: KV-vars auto-injiseres)* |
| `JSONBIN_BIN_ID` | Kundens egen |

## 4. Deploy + verifiser

- [ ] Header viser riktig brand-navn og tagline
- [ ] Tab-tittel matcher
- [ ] Bakgrunnsbilder/taskTypes lastes fra riktig client-fil
- [ ] Test å opprette + slette en oppgave
- [ ] Footer viser `<brand> · By Ko | Do · Consult · v2.0`

## 5. (Valgfritt) Custom domene

Vercel → Project → Settings → Domains → Add `planner.kunde.no` + DNS CNAME.

---

**Tips:** `<kunde>` = filnavnet på client-config, ikke nødvendigvis brand-navn.
F.eks. `NEXT_PUBLIC_CLIENT_CONFIG=acme` + `NEXT_PUBLIC_BRAND_NAME=Acme Group AS`.
