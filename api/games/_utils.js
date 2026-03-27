const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');

const LOCAL_GAMES_PATH = path.join(process.cwd(), 'games.json');

function getDatabaseUrl() {
  return (
    process.env.SUPABASE_DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    ''
  );
}

function getDatabaseUrlSource() {
  if (process.env.SUPABASE_DATABASE_URL) return 'SUPABASE_DATABASE_URL';
  if (process.env.SUPABASE_DB_URL) return 'SUPABASE_DB_URL';
  if (process.env.DATABASE_URL) return 'DATABASE_URL';
  return null;
}

function maskDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return '(missing)';
  }

  return databaseUrl.replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]*)(@.*)/i, '$1***$3');
}

function getDatabaseDiagnostics() {
  const databaseUrl = getDatabaseUrl();
  const source = getDatabaseUrlSource();
  const diagnostics = {
    source,
    present: Boolean(databaseUrl),
    maskedUrl: maskDatabaseUrl(databaseUrl),
    length: databaseUrl.length,
    containsPlaceholder: databaseUrl.includes('[YOUR-PASSWORD]'),
  };

  if (!databaseUrl) {
    return diagnostics;
  }

  try {
    const parsed = new URL(databaseUrl);
    diagnostics.protocol = parsed.protocol;
    diagnostics.hostname = parsed.hostname;
    diagnostics.port = parsed.port || '(default)';
    diagnostics.pathname = parsed.pathname;
    diagnostics.username = parsed.username || '(missing)';
    diagnostics.passwordLength = parsed.password.length;
    diagnostics.hasSearch = Boolean(parsed.search);
  } catch (error) {
    diagnostics.parseError = error.message;
  }

  return diagnostics;
}

function logDatabaseDiagnostics(context, error) {
  console.error(`[games] ${context}`, {
    errorName: error?.name,
    errorMessage: error?.message,
    errorCode: error?.code,
    diagnostics: getDatabaseDiagnostics(),
  });
}

function getPublicDatabaseError(error) {
  const message = String(error?.message || 'Unknown database error');

  if (!getDatabaseUrl()) {
    return 'SUPABASE_DATABASE_URL is not configured';
  }

  if (message.includes('[YOUR-PASSWORD]')) {
    return 'SUPABASE_DATABASE_URL still contains the [YOUR-PASSWORD] placeholder';
  }

  if (message.includes('Invalid URL')) {
    return 'SUPABASE_DATABASE_URL is not a valid connection string. If the password has special characters, URL-encode it first';
  }

  if (
    message.includes('password authentication failed') ||
    message.includes('SASL') ||
    message.includes('authentication')
  ) {
    return 'Supabase authentication failed. Check the database password in SUPABASE_DATABASE_URL';
  }

  if (
    message.includes('getaddrinfo') ||
    message.includes('ENOTFOUND') ||
    message.includes('ECONNREFUSED') ||
    message.includes('timeout')
  ) {
    return 'Could not connect to Supabase. Check the host, port, and network access on the database URL';
  }

  return message.replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***@');
}

function getPool() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  if (databaseUrl.includes('[YOUR-PASSWORD]')) {
    throw new Error('SUPABASE_DATABASE_URL still contains the [YOUR-PASSWORD] placeholder');
  }

  if (!global.__gamesPool || global.__gamesPoolUrl !== databaseUrl) {
    global.__gamesPool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    global.__gamesPoolUrl = databaseUrl;
  }

  return global.__gamesPool;
}

async function ensureDatabase() {
  const pool = getPool();
  if (!pool) {
    throw new Error('SUPABASE_DATABASE_URL is not configured');
  }

  if (!global.__gamesDbReadyPromise) {
    global.__gamesDbReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS games (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          tags JSONB NOT NULL DEFAULT '[]'::jsonb,
          sort_order INTEGER NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS games_sort_order_idx
        ON games (sort_order);
      `);
    })().catch((error) => {
      global.__gamesDbReadyPromise = null;
      throw error;
    });
  }

  await global.__gamesDbReadyPromise;
  return pool;
}

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
  const pool = getPool();

  if (!pool) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SUPABASE_DATABASE_URL is not configured');
    }

    return readLocalSeedGames();
  }

  await ensureDatabase();
  const result = await pool.query(
    `
      SELECT id, title, tags, sort_order
      FROM games
      ORDER BY sort_order ASC, created_at ASC
    `,
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    tags: Array.isArray(row.tags) ? row.tags : [],
    order: row.sort_order,
  }));
}

function normalizeTags(tags) {
  return Array.isArray(tags)
    ? tags
        .map((tag) => String(tag).trim().replace(/^#+/, ''))
        .filter((tag) => tag.length > 0)
    : [];
}

async function createGame({ id, title, tags }) {
  const pool = await ensureDatabase();
  const normalizedTags = normalizeTags(tags);
  const trimmedTitle = String(title || '').trim();

  const result = await pool.query(
    `
      INSERT INTO games (id, title, tags, sort_order)
      VALUES (
        $1,
        $2,
        $3::jsonb,
        COALESCE((SELECT MAX(sort_order) FROM games), 0) + 1
      )
      RETURNING id, title, tags, sort_order
    `,
    [id, trimmedTitle, JSON.stringify(normalizedTags)],
  );

  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    tags: Array.isArray(row.tags) ? row.tags : [],
    order: row.sort_order,
  };
}

async function updateGameById(id, { title, tags }) {
  const pool = await ensureDatabase();
  const normalizedTags = normalizeTags(tags);
  const trimmedTitle = String(title || '').trim();

  const result = await pool.query(
    `
      UPDATE games
      SET title = $2,
          tags = $3::jsonb,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, title, tags, sort_order
    `,
    [id, trimmedTitle, JSON.stringify(normalizedTags)],
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    tags: Array.isArray(row.tags) ? row.tags : [],
    order: row.sort_order,
  };
}

async function deleteGameById(id) {
  const pool = await ensureDatabase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const deleted = await client.query(
      `
        DELETE FROM games
        WHERE id = $1
        RETURNING sort_order
      `,
      [id],
    );

    if (deleted.rowCount === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    await client.query(
      `
        UPDATE games
        SET sort_order = sort_order - 1,
            updated_at = NOW()
        WHERE sort_order > $1
      `,
      [deleted.rows[0].sort_order],
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function reorderGamesInDatabase(ids) {
  const pool = await ensureDatabase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const current = await client.query(`
      SELECT id
      FROM games
      ORDER BY sort_order ASC, created_at ASC
    `);

    const currentIds = current.rows.map((row) => row.id);
    if (currentIds.length !== ids.length) {
      throw new Error('Mismatched ids length');
    }

    const requestedIds = new Set(ids);
    if (requestedIds.size !== ids.length) {
      throw new Error('Duplicate ids');
    }

    for (const id of ids) {
      if (!currentIds.includes(id)) {
        throw new Error(`Unknown id: ${id}`);
      }
    }

    await client.query(`
      UPDATE games
      SET sort_order = -sort_order
    `);

    for (let index = 0; index < ids.length; index += 1) {
      await client.query(
        `
          UPDATE games
          SET sort_order = $2,
              updated_at = NOW()
          WHERE id = $1
        `,
        [ids[index], index + 1],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createGame,
  deleteGameById,
  ensureDatabase,
  getDatabaseDiagnostics,
  getPublicDatabaseError,
  getDatabaseUrl,
  logDatabaseDiagnostics,
  normalizeTags,
  readBody,
  parseCookies,
  reorderGamesInDatabase,
  verifyAdmin,
  readGames,
  updateGameById,
};
