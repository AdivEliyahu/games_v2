# Neon Game List App

This project implements a dark‑mode, neon‑themed game list application with a secure admin area.  
Visitors see a ranked list of games as brightly glowing cards.  An admin can unlock additional controls to add, edit, delete and reorder items, and everyone can download the current list as a notepad‑friendly text file.

## Features

* **Vite + React + Tailwind CSS** — the front‑end is built with Vite for fast development, React for UI logic and Tailwind for styling.  The entire site is dark by default and uses neon cyan, green, purple and pink accents.
* **Admin unlock** — a terminal‑style password prompt appears at the top of the page.  Entering the correct password (stored in the `ADMIN_SECRET` environment variable) calls the server‑side `/api/auth/unlock` route.  On success the server issues a signed, secure session cookie and reveals an admin sidebar with actions.
* **Game list management** — in admin mode you can add a new game, edit an existing game, delete a game and reorder games via drag‑and‑drop.  Changes are saved through protected API routes and persisted in a JSON file stored in Vercel Blob storage.
* **Download list** — a public endpoint `/api/games/download.txt` generates a plain text representation of the current list (e.g. `#1 Cyberpunk 2077 – #story #rpg`).  Clicking **Download TXT** in the admin sidebar opens the file in the browser for easy saving.
* **Serverless functions** — all API routes live in the `api/` directory and run as Vercel serverless functions.  They read and write data using the `@vercel/blob` SDK and never expose the admin secret to the client.  The `vercel.json` file maps the `.txt` download route to the correct function.

## Getting started locally

1. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

2. Copy `.env.example` to `.env` and fill in the following values:

   * `ADMIN_SECRET` – the password you will use to unlock admin mode.  Do **not** prefix it with `VITE_` because it must never be exposed on the client.
   * `BLOB_READ_WRITE_TOKEN` – a token granting read/write access to your Vercel Blob store.  When you create a Blob store in the Vercel dashboard it automatically adds a `BLOB_READ_WRITE_TOKEN` environment variable to your project 【233845061030098†L69-L74】.  Copy the value into your `.env` file.

3. The development server will run at `http://localhost:5173`.  Note that Vercel Blob cannot call back to `localhost` when testing uploads; if you want to exercise the Blob API locally you can expose your server with a tunnelling service like ngrok【233845061030098†L85-L88】.

## Deployment on Vercel

1. **Create a Blob store.**  In your Vercel project’s **Storage** tab choose **Blob** and create a new store.  Vercel automatically provisions the `BLOB_READ_WRITE_TOKEN` environment variable for you【233845061030098†L69-L74】.

2. **Add environment variables.**  In your project settings under **Environment Variables** add:
   * `ADMIN_SECRET` – the admin password you choose.
   * Ensure `BLOB_READ_WRITE_TOKEN` is present (it should have been auto‑added when the Blob store was created).

3. **Deploy.**  Push this repository to GitHub and import it into Vercel, or run `vercel` from the project root.  Vercel will detect the serverless functions under `api/`, build the React front‑end, and deploy your application.

4. **Seed data (optional).**  The `games.json` file in the root of this repository contains example data.  After the first deployment, if no `games.json` exists in your Blob store, the API will fall back to this seed to populate initial values.  Alternatively you can manually upload `games.json` to your Blob store via the Vercel dashboard.

## How authentication and sessions work

1. **Password verification.**  The client sends the password entered in the terminal prompt to `/api/auth/unlock`.  That endpoint compares the submitted password to `process.env.ADMIN_SECRET`.  Because this comparison happens in a serverless function, the secret never travels to the browser.

2. **Session cookie.**  When the password matches, the server creates a signed token using the `ADMIN_SECRET` as the HMAC key.  The token encodes a timestamp and an `authorized` flag.  The server sets this token in an `admin_session` cookie with the `HttpOnly`, `Secure` and `SameSite=Strict` attributes so it is not accessible from client‑side JavaScript.

3. **Authorization checks.**  Every API route that modifies data parses the `admin_session` cookie and verifies its signature.  If the token is missing or invalid the route returns a 401 error.  Only read‑only routes (`GET /api/games` and `GET /api/games/download.txt`) are publicly accessible.

4. **Locking admin mode.**  Clicking the **Lock** icon in the admin sidebar clears the session cookie by setting an expired cookie.  The UI will immediately revert to public mode.

## How data is stored and updated

* **Blob store as a JSON file.**  All games are stored in a single file named `games.json` inside your Vercel Blob store.  When the API routes read the list they first call `head('games.json')` on the Blob SDK to get the file’s URL and then fetch the contents.  If the file does not exist, the seed data in this repository is used.  Write operations assemble the updated list, assign sequential `order` numbers and upload the new JSON by calling `put('games.json', JSON.stringify(games), { access: 'private' })`.

* **Maintaining order.**  Each game item has an `order` property.  In reorder mode the client sends an array of game IDs in their desired order to `/api/games/reorder`, and the server recalculates the `order` field for each item.  The `#{number}` displayed on each card is derived from `order`.

* **Download endpoint.**  The `/api/games/download.txt` route reads the current list and converts it into plain text lines (e.g. `#1 Cyberpunk 2077 – #story #rpg`).  It sets the `Content‑Disposition` header so browsers treat the response as a file named `games.txt`.

## Project structure

```
neon-game-list/
├─ api/                   # Vercel serverless functions
│  ├─ auth/
│  │  └─ unlock.js        # Verify password and issue session cookie
│  └─ games/
│     ├─ index.js         # GET list and POST to create
│     ├─ [id].js          # PUT update and DELETE remove
│     ├─ reorder.js       # Reorder the games
│     └─ download.js      # Return plain text representation
├─ src/
│  ├─ components/
│  │  ├─ GameCard.jsx
│  │  ├─ GameList.jsx
│  │  ├─ TerminalUnlock.jsx
│  │  ├─ AdminSidebar.jsx
│  │  └─ TagList.jsx
│  ├─ context/
│  │  └─ AdminContext.jsx
│  ├─ utils/
│  │  └─ api.js           # Client‑side helper functions
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ public/
│  └─ index.html
├─ games.json             # Seed data
├─ tailwind.config.js
├─ postcss.config.js
├─ vite.config.js
├─ vercel.json            # Route configuration for download.txt
├─ .env.example
└─ README.md
```

## Notes

* This repository provides the full source code needed to run locally or deploy on Vercel.  You should not commit your real `.env` file to version control.
* The UI uses lucide‑react icons for all actions and `@dnd-kit` for smooth drag‑and‑drop reordering.
* Feel free to customise the neon palette in `tailwind.config.js` or extend the admin sidebar with additional actions.

Enjoy your neon game list app!