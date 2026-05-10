# Offerte Tool - Van Winden Techniek

Een productie-klare web applicatie voor het verwerken van ExcelAir System-Care maandplanningen naar offertes.

## Functies

- Upload maandplanning PDF van ExcelAir System-Care
- Automatisch uitlezen van werklocaties, uren en werkzaamheden codes
- Berekening van arbeidskosten o.b.v. tarieven per werkzaamheden code
- Reiskosten berekening vanuit Naaldwijk via Google Maps
- Review en bewerk individuele klussen
- Genereer professionele offerte PDF
- Sla offertes op in Supabase database
- Beheerportal voor tarieven beheer

## Vereisten

- Node.js 18+
- npm of yarn
- (Optioneel) Supabase account
- (Optioneel) Google Maps API key

## Installatie

```bash
# Kloon de repository
git clone <repo-url>
cd offerte-tool

# Installeer dependencies
npm install

# Kopieer voorbeeld environment file
cp .env.local.example .env.local
```

## Configuratie

Bewerk `.env.local` en vul de volgende variabelen in:

### Supabase (optioneel, voor opslaan offertes)
1. Ga naar [supabase.com](https://supabase.com) en maak een project aan
2. Ga naar Project Settings > API
3. Kopieer de Project URL en anon/public key

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
```

### Google Maps API (optioneel, voor afstandsberekening)
1. Ga naar [Google Cloud Console](https://console.cloud.google.com)
2. Enable de "Distance Matrix API"
3. Maak een API key aan

```env
GOOGLE_MAPS_API_KEY=AIzaSy...
```

### Admin wachtwoord
```env
NEXT_PUBLIC_ADMIN_PASSWORD=jouw_wachtwoord
```

## Supabase database migratie

Als je Supabase gebruikt, voer de migratie uit:

1. Ga naar je Supabase project
2. Open de SQL Editor
3. Kopieer en plak de inhoud van `supabase/migrations/001_initial.sql`
4. Klik op "Run"

Of via de Supabase CLI:
```bash
npx supabase db push
```

## Lokaal draaien

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## App zonder API keys

De app werkt ook zonder API keys:
- **Zonder Google Maps**: afstanden worden op 0 gezet (handmatig aanpassen in review)
- **Zonder Supabase**: tarieven worden uit standaard lijst geladen, offertes kunnen niet worden opgeslagen in database
- PDF generatie werkt altijd

## Stappen in de app

1. **Upload** - Sleep of klik om de ExcelAir PDF te uploaden
2. **Berekening** - Automatisch: locaties worden herkend, afstanden berekend, tarieven gekoppeld
3. **Review** - Controleer en pas individuele klussen aan (uren, uurtarief, km, reistijd)
4. **Definitief** - Download de offerte PDF of sla op in database

## PDF formaat (ExcelAir)

De app verwacht PDFs met kolommen:
```
Dag | Datum | Duur | Project/Taak | Project/Werkbon | Werkzaamheden
```

Voorbeeld:
```
Wednesday  03-06-2026  8.00  PG QPark Oostpoort Amsterdam O-G  5133004S WO251714  Onderhoud O-G
```

## Tarieven beheer

Ga naar `/admin` om tarieven te beheren. Standaard wachtwoord: `admin123` (aanpassen in `.env.local`).

Tarieven zijn gekoppeld aan werkzaamheden codes zoals `O-G`, `O-R`, `O-RGB`, etc.

## Reiskosten berekening

- Origine: Naaldwijk, Zuid-Holland
- Km tarief: €0,50 per km (retour)
- Uurtarief reis: €55,00 per uur (retour, dus x2)

## Productie deployment

```bash
npm run build
npm run start
```

Voor deployment op Vercel:
```bash
npx vercel deploy
```

Zorg dat alle environment variabelen zijn ingesteld in het Vercel dashboard.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **@react-pdf/renderer** - PDF generatie
- **pdf-parse** - PDF uitlezen
- **@supabase/supabase-js** - Database
- **axios** - HTTP client voor Google Maps
