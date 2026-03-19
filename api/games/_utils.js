const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { list, put } = require('@vercel/blob');

const GAMES_BLOB_PATH = 'games.json';
const LOCAL_GAMES_PATH = path.join(process.cwd(), 'games.json');

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
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    return signature === expectedSig;
  } catch {
    return false;
  }
}

async function readLocalSeedGames() {
  try {
    const text = await fs.readFile(LOCAL_GAMES_PATH, 'utf8');
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function readGames() {
  try {
    const { blobs } = await list({
      prefix: GAMES_BLOB_PATH,
      limit: 100,
    });

    const blob =
      blobs.find((item) => item.pathname === GAMES_BLOB_PATH) ??
      blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];

    if (!blob?.url) {
      return await readLocalSeedGames();
    }

    const response = await fetch(blob.url);
    const text = await response.text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch {
    return await readLocalSeedGames();
  }
}

async function writeGames(games) {
  const sorted = games.slice().sort((a, b) => a.order - b.order);
  await put(GAMES_BLOB_PATH, JSON.stringify(sorted, null, 2), {
    access: 'private',
    addRandomSuffix: false,
  });
}

module.exports = {
  readBody,
  parseCookies,
  verifyAdmin,
  readGames,
  writeGames,
};
