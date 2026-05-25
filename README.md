# Listkompis

Delad checklista för inloggade användare. Alla kan lägga till saker och bocka av – listan synkar live mellan alla inloggade.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** – PostgreSQL-databas, auth och realtime
- **Vitest** + React Testing Library
- **Vercel** – hosting

## Kom igång lokalt

### 1. Klona och installera

```bash
git clone https://github.com/<ditt-användarnamn>/listkompis.git
cd listkompis
npm install
```

### 2. Skapa ett Supabase-projekt

1. Gå till [supabase.com](https://supabase.com) och skapa ett nytt (gratis) projekt.
2. Öppna **SQL Editor** och kör hela filen [`supabase/schema.sql`](supabase/schema.sql).
3. Under **Project Settings → API** hittar du `Project URL` och `anon public`-nyckeln.

### 3. Miljövariabler

```bash
cp .env.local.example .env.local
```

Appen har två lägen:

**Dev-läge (localStorage)** – inget Supabase-konto behövs. Standardläget när du klonar projektet. Aktiveras av `NEXT_PUBLIC_DEV_MODE=true` i `.env.local`.

**Produktionsläge (Supabase)** – kräver ett Supabase-projekt. Ta bort `NEXT_PUBLIC_DEV_MODE` och fyll i dina värden:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> **Obs:** Supabase har nyligen bytt nyckelformat. Använd den **legacy anon-nyckeln** (börjar med `eyJ`) som finns under **Settings → API → Legacy API keys**.

### 4. Starta dev-servern

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

## Skript

| Kommando            | Beskrivning             |
| ------------------- | ----------------------- |
| `npm run dev`       | Startar dev-server      |
| `npm run build`     | Produktionsbygge        |
| `npm run test`      | Kör tester i watch-läge |
| `npm run test:run`  | Kör tester en gång      |
| `npm run typecheck` | TypeScript-kontroll     |
| `npm run lint`      | ESLint                  |

## Deploya till Vercel

1. Pusha repot till GitHub.
2. Gå till [vercel.com](https://vercel.com), välj **Add New Project** och importera repot.
3. Lägg till miljövariablerna `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY` under **Settings → Environment Variables**.
4. Klicka **Deploy** – klart!

## Databasstruktur

```
lists
  id          uuid  (PK)
  name        text
  created_at  timestamptz

list_members
  list_id     uuid → lists
  user_id     uuid → auth.users
  is_favorite boolean
  joined_at   timestamptz

items
  id          uuid  (PK)
  list_id     uuid → lists
  text        text
  is_checked  boolean
  created_at  timestamptz
  created_by  uuid → auth.users

list_invites
  id          uuid  (PK)
  list_id     uuid → lists
  token       text  (unik inbjudningslänk)
  created_at  timestamptz
```

Row Level Security är aktiverat: alla som är medlemmar i en lista kan läsa, lägga till och bocka av i den listan.
