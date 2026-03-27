# Neon Game List App

This project is a Vite + React game ranking app with an unlockable admin mode. Public users can browse and download the list, while admins can add, edit, delete, and reorder entries through protected Vercel API routes.

## Features

- React + Vite + Tailwind UI
- Admin unlock flow backed by `ADMIN_SECRET`
- CRUD + drag-and-drop reordering for games
- Plain-text export at `/api/games/download.txt`
- Server-side Supabase Postgres storage

## Environment Variables

Create a `.env` file locally or add these in Vercel:

```env
ADMIN_SECRET=replace-with-your-admin-password
SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xpwmummcutzmldpwalyo.supabase.co:5432/postgres
```

Notes:

- Keep both values server-side only. Do not prefix them with `VITE_`.
- The API also accepts `SUPABASE_DB_URL` or `DATABASE_URL`, but `SUPABASE_DATABASE_URL` is the primary name used in this repo.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app:

   ```bash
   npm run dev
   ```

3. In local Vite dev mode, the front end falls back to `games.json` for reads because the Vercel serverless routes are not mounted by default.

## Deployment

1. Add `ADMIN_SECRET` and `SUPABASE_DATABASE_URL` in your Vercel project settings.
2. Deploy the repo to Vercel.
3. On first database access, the API auto-creates a `games` table if it does not already exist.
4. If the table is empty, the production UI now shows an empty state instead of sample data.

## Storage Model

The API stores rows in a `games` table with these fields:

- `id`
- `title`
- `tags`
- `sort_order`
- `created_at`
- `updated_at`

The client still talks to the same API routes:

- `GET /api/games`
- `POST /api/games`
- `PUT /api/games/:id`
- `DELETE /api/games/:id`
- `POST /api/games/reorder`
- `GET /api/games/download.txt`

## Project Structure

```text
api/
  auth/unlock.js
  games/_utils.js
  games/index.js
  games/[id].js
  games/reorder.js
  games/download.js
src/
  components/
  context/
  utils/api.js
```
