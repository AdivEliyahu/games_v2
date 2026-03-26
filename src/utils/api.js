// Helper functions for interacting with the serverless API endpoints.  All
// methods return promises and throw on non‑OK responses so the caller can
// handle errors centrally.

/**
 * Fetch the current list of games.
 * @returns {Promise<Array>} array of game objects
 */
async function tryParseJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON response from ${response.url}: ${err.message}`);
  }
}

export async function fetchGames() {
  const isDev = import.meta.env.DEV;

  // In dev mode we may not have Vercel serverless endpoints available, so use static file.
  if (isDev) {
    const raw = await fetch('/games.json');
    if (!raw.ok) {
      throw new Error(`/games.json status ${raw.status}`);
    }
    const parsed = await raw.json();
    if (!Array.isArray(parsed)) {
      throw new Error('/games.json must be an array');
    }
    return parsed;
  }

  // Production/main path: use the API endpoint backed by Vercel blob storage.
  try {
    const res = await fetch('/api/games');
    if (res.ok) {
      try {
        const parsed = await tryParseJson(res);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        console.warn('/api/games returned JSON but not an array. Falling back to /games.json');
      } catch (jsonErr) {
        console.warn('API /api/games returned non-JSON; falling back:', jsonErr.message);
      }
    } else {
      const text = await res.text().catch(() => '');
      console.warn('API /api/games returned non-OK:', res.status, res.statusText, text);
    }
  } catch (err) {
    console.warn('API /api/games fetch failed:', err.message);
  }

  // Fallback for production (or if API unreachable): static JSON file in project root.
  try {
    const raw = await fetch('/games.json');
    if (!raw.ok) {
      throw new Error(`/games.json status ${raw.status}`);
    }

    const parsed = await raw.json();
    if (!Array.isArray(parsed)) {
      throw new Error('/games.json must be an array');
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load games.json fallback:', err.message);
    throw new Error(`Failed to fetch games: ${err.message}`);
  }
}

/**
 * Attempt to unlock admin mode with the given password.
 * @param {string} password
 * @returns {Promise<boolean>} whether the unlock was successful
 */
export async function unlock(password) {
  if (import.meta.env.DEV) {
    console.warn('Running in DEV; /api/auth/unlock is not available (static mode)');
    return false;
  }

  try {
    const res = await fetch('/api/auth/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json.success === true;
  } catch (err) {
    console.warn('API /api/auth/unlock fetch failed:', err.message);
    return false;
  }
}

/**
 * Add a new game.  Only available for admins; the server verifies the session
 * cookie.
 * @param {{title:string, tags:string[]}} data
 */
export async function addGame(data) {
  const res = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add game');
  return res.json();
}

/**
 * Update an existing game by ID.
 * @param {string} id
 * @param {{title:string, tags:string[]}} data
 */
export async function updateGame(id, data) {
  const res = await fetch(`/api/games/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update game');
  return res.json();
}

/**
 * Delete a game by ID.
 * @param {string} id
 */
export async function deleteGame(id) {
  const res = await fetch(`/api/games/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete game');
  return res.json();
}

/**
 * Reorder games by providing an array of IDs in the new order.
 * @param {string[]} ids
 */
export async function reorderGames(ids) {
  const res = await fetch('/api/games/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Failed to reorder games');
  return res.json();
}

/**
 * Trigger download of the TXT file.  The browser handles the file download.
 */
export function downloadTxt() {
  window.open('/api/games/download.txt');
}