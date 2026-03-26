// Helper functions for interacting with the serverless API endpoints.  All
// methods return promises and throw on non‑OK responses so the caller can
// handle errors centrally.

/**
 * Fetch the current list of games.
 * @returns {Promise<Array>} array of game objects
 */
export async function fetchGames() {
  const res = await fetch('/api/games');
  if (!res.ok) {
    console.error('Failed to fetch games:', res.status, res.statusText);
    return null;
  }
  return res.json();
}

/**
 * Attempt to unlock admin mode with the given password.
 * @param {string} password
 * @returns {Promise<boolean>} whether the unlock was successful
 */
export async function unlock(password) {
  const res = await fetch('/api/auth/unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return false;
  const json = await res.json();
  return json.success === true;
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