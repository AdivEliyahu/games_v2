const crypto = require('crypto');
const { head, put } = require('@vercel/blob');

// Read JSON body from request
async function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

// Parse cookies from the cookie header into an object
function parseCookies(header = '') {
  const out = {};
  header.split(';').forEach((cookie) => {
    const parts = cookie.trim().split('=');
    if (parts.length === 2) {
      out[parts[0]] = decodeURIComponent(parts[1]);
    }
  });
  return out;
}

// Verify the admin_session cookie.  Returns true if the signature is
// correct, false otherwise.
function verifyAdmin(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.admin_session;
  if (!token) return false;
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return false;
  try {
    const payloadStr = Buffer.from(payloadB64, 'base64').toString();
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadStr)
      .digest('hex');
    return signature === expectedSig;
  } catch {
    return false;
  }
}

// Read the games list from the blob store.  If the file doesn't exist
// or fails to parse, fall back to the local seed file.
async function readGames() {
  try {
    // head() returns metadata including the URL.  For private stores the URL
    // will be signed for download.
    const meta = await head('games.json');
    const url = meta.url;
    const response = await fetch(url);
    const text = await response.text();
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    // fallback: use seed file packaged with the repo
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const seed = require('../../../games.json');
      return Array.isArray(seed) ? seed : [];
    } catch {
      return [];
    }
  }
}

// Write the games list back to the blob store.  The file is stored
// privately so only your API can read it.  The games array is sorted by
// order before writing.
async function writeGames(games) {
  const sorted = games
    .slice()
    .sort((a, b) => a.order - b.order);
  await put('games.json', JSON.stringify(sorted, null, 2), {
    access: 'private',
  });
}

module.exports = {
  readBody,
  parseCookies,
  verifyAdmin,
  readGames,
  writeGames,
};