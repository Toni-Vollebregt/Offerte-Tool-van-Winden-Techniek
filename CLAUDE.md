# Offerte Tool – Van Winden Techniek

Webapplicatie die ExcelAir maandplannings-PDF's inleest, prijzen berekent
(arbeid + reiskosten vanuit Naaldwijk), en een totaalofferte PDF genereert.

---

## Tech Stack

| Laag | Pakket | Versie |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| Runtime | React | 19.2.4 |
| Taal | TypeScript | ^5 |
| Styling | Tailwind CSS | v4 |
| Bundler | Turbopack (Next.js default) | — |
| Database | Supabase (@supabase/supabase-js) | ^2.105.4 |
| PDF lezen | pdf-parse | ^2.4.5 (class-based API: `PDFParse`) |
| PDF genereren | @react-pdf/renderer | ^4.5.1 |
| HTTP client | axios | ^1.16.0 |
| Maps | Google Maps Distance Matrix API | REST |

---

## Project Structuur

```
offerte-tool/
├── app/
│   ├── page.tsx                   # Stap 1: PDF upload + berekening
│   ├── review/page.tsx            # Stap 3: review & aanpassen
│   ├── finalize/page.tsx          # Stap 4: PDF download + opslaan
│   ├── admin/page.tsx             # Beheerportal: tarieven beheren
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── parse-pdf/route.ts     # POST: PDF inlezen → klussen[]
│       ├── maps/route.ts          # GET ?locatie=: afstand + reistijd
│       ├── tarieven/route.ts      # GET/POST/PUT/DELETE: tarieven CRUD
│       └── offertes/route.ts      # GET/POST: offertes opslaan
├── components/
│   ├── Header.tsx                 # Logo + navigatie
│   ├── StepIndicator.tsx          # Voortgangsbalk stappen 1-4
│   ├── PdfUpload.tsx              # Drag & drop upload zone
│   ├── KlusCard.tsx               # Bewerkbaar kaartje per klus
│   ├── OfferteDocument.tsx        # react-pdf A4 landschap document
│   └── PdfActions.tsx             # Client-only wrapper (no-SSR) voor react-pdf
├── lib/
│   ├── pdf-parser.ts              # ExcelAir PDF → Klus[]
│   ├── maps.ts                    # Google Maps Distance Matrix aanroep
│   ├── calculations.ts            # berekenKlus(), berekenOfferteTotalen(), formatCurrency()
│   └── supabase.ts                # Supabase client
├── types/
│   └── index.ts                   # Klus, Offerte, Tarief interfaces
├── supabase/
│   └── migrations/001_initial.sql # DB schema + 14 standaard tarieven
└── public/
    ├── vanwinden_techniek_logo_donker.png       # Gebruikt in PDF
    └── vanwinden_techniek_logo_transparant.png  # Gebruikt in header
```

---

## Branding

- **Primair (cyan):** `#00E8FF`
- **Secundair (blauw):** `#0055FF`
- **Achtergrond donker:** `#2D2D2D`
- **Card achtergrond:** `#3D3D3D`
- **Muted tekst:** `#9D9D9D`
- Tailwind config heeft `brand.cyan`, `brand.blue`, `brand.dark`, `brand.gray` als custom kleuren

---

## Tariefstructuur

Berekening per klus:
```
arbeidskosten  = duur (uur) × uurtarief
reiskostenKm   = afstandKm (retour) × €0,50
reiskostenUur  = reisUren (enkele reis) × 2 × €55
totaal         = arbeidskosten + reiskostenKm + reiskostenUur
```

Vertrekpunt altijd: **Naaldwijk, Zuid-Holland, Nederland**

### Tarieven (uit officieel document "Betekenissen en Uurtarieven")

| Code | Omschrijving | €/uur |
|---|---|---|
| O-G | Onderhoud Garagedeuren | 60 |
| O-R | Onderhoud Roldeuren | 60 |
| O-B | Onderhoud Borstels | 67 |
| O-O | Onderhoud Overig | 65 |
| O-V | Onderhoud Vliegendeuren | 60 |
| O-VB | Onderhoud Vluchtbalken | 67 |
| O-VGB | Onderhoud VG Balken | 67 |
| O-RIVG | Onderhoud RI VG | 55 |
| O-VG | Onderhoud Veiligheidsgordijnen | 60 |
| O-VG+REINIGEN | Onderhoud VG + Reinigen | 60 |
| PAC/MOBIEL | ONDERHOUD PAC EN MOBIEL ABONNEMENT | 60 |
| O-ROLSCHERMEN | Onderhoud Rolschermen | 55 |
| O-BEHEER BMI/RWA | Onderhoud Beheer BMI/RWA | 65 |
| STORINGEN | Storingen Arbeidsuren | 60 |

Fallback bij onbekende code: **€60/uur**. Bij meerdere codes per klus: hoogste tarief wint.

---

## PDF Parser — ExcelAir Formaat

### Kolommen input PDF
```
Dag | Datum | Duur | Project/Taak | Project/Werkbon | Werkzaamheden
```

### Parsing logica (lib/pdf-parser.ts)

1. Regex op dagname (`Monday|Tuesday|...`) om planningsrijen te herkennen
2. Twee splitsstrategieën voor Project/Taak vs. Project/Werkbon:
   - **Tab aanwezig:** split op `\t`
   - **Geen tab:** zoek projectcode patroon `\d{5,8}[A-Z0-9]+\s+WO\d+` als grens
3. Locatie extractie uit Project/Taak veld:
   - Strip leading prefix: `PG`, `SG`, `PKG`, etc.
   - Strip trailing werkzaamheden codes iteratief: `O-G`, `O-RGB`, `I-RB`, `REM`, `RT350`, etc.
   - Strip trailing ExcelAir noten: `1x op afstand`, `2x per jaar`, etc.
4. Werkzaamheden codes extractie uit zowel Project/Taak als Werkzaamheden kolom

### Kritieke next.config.ts instelling
```typescript
serverExternalPackages: ['pdf-parse', 'pdfjs-dist']
```
**Zonder dit:** Turbopack bundelt pdfjs-dist en de PDF.js worker kan niet gevonden worden.
Dit was de hoofdoorzaak van de falende PDF parsing bij eerste opstart.

---

## Databeheer

### Sessieopslag
Klussen en offerte worden via `sessionStorage` doorgegeven tussen pagina's:
- `sessionStorage.getItem('offerte')` → JSON string van `Offerte` interface

### Supabase tabellen
- **tarieven** — code, omschrijving, uurtarief (beheerbaar via `/admin`)
- **offertes** — maand, jaar, totaal, volledige data als JSONB

### Fallback zonder Supabase
API route `/api/tarieven` heeft `DEFAULT_TARIEVEN` hardcoded — app werkt ook
zonder Supabase (tarieven dan niet aanpasbaar, offertes niet opgeslagen).

---

## Wat Werkt

- **PDF upload en parsing** — volledig werkend, getest met echte ExcelAir PDF
- **Locatie extractie** — alle 7 testklussen correct geparsed
- **Tariefkoppeling** — werkzaamheden codes gematchd met tarieven
- **Review scherm** — alle velden aanpasbaar, live herberekening
- **PDF generatie** — A4 landschap met logo, tabel, subtotalen
- **Beheerportal** (`/admin`) — tarieven bekijken en aanpassen
- **Supabase fallback** — werkt volledig zonder database geconfigureerd
- **Logo** — transparant in header, donker in gegenereerde PDF

---

## Wat Nog Niet Werkt / Ontbreekt

### 1. Google Maps — NIET GECONFIGUREERD
- Code staat klaar in `lib/maps.ts` en `app/api/maps/route.ts`
- Vereist: `GOOGLE_MAPS_API_KEY` in `.env.local`
- Zonder key: afstand = 0 km, reisuren = 0 → reiskosten zijn €0
- Gebruiker kan km en reisuren handmatig invullen in review scherm

### 2. Supabase — NIET GECONFIGUREERD
- Code staat klaar, fallback actief
- Vereist: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Migratie uitvoeren via Supabase SQL editor: `supabase/migrations/001_initial.sql`

### 3. Snelstart API — NIET GEÏMPLEMENTEERD
- Knop staat in `/finalize` maar is disabled met "Komt binnenkort"
- Vereist: `SNELSTART_API_KEY` + implementatie in nieuwe API route

### 4. Authenticatie — NIET GEÏMPLEMENTEERD
- Beheerportal (`/admin`) heeft geen echte beveiliging
- Supabase Auth nog niet ingesteld

---

## Omgevingsvariabelen

Bestand: `.env.local` (kopieer van `.env.local.example`)

```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
GOOGLE_MAPS_API_KEY=             # Server-side (niet NEXT_PUBLIC_)
SNELSTART_API_KEY=               # Nog niet geïmplementeerd
```

Google Maps key is bewust **niet** `NEXT_PUBLIC_` — aanroep gaat via `/api/maps`
zodat de key nooit naar de browser gestuurd wordt.

---

## Opstarten

```bash
cd /Users/tonivollebregt/Documents/Programs/offerte-tool
npm run dev      # start op http://localhost:3000
npm run build    # productie build
```

---

## Bekende Quirks

- **@react-pdf/renderer** mag niet server-side renderen → `PdfActions.tsx` laadt
  het via `dynamic import` + `useEffect` (client-only). Doe dit altijd zo.
- **pdf-parse v2** gebruikt class-based API: `new PDFParse({ data: buffer }).getText()`
  (niet de v1 default export functie).
- **Tailwind v4** configuratie werkt anders dan v3 — geen `tailwind.config.js` nodig,
  kleuren zijn gedefinieerd in `globals.css` via CSS custom properties.
