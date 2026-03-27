const crypto = require('crypto');
const {
  createGame,
  getDatabaseDiagnostics,
  getPublicDatabaseError,
  logDatabaseDiagnostics,
  readBody,
  readGames,
  verifyAdmin,
} = require('./_utils');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Public read: return the list of games sorted by order
    try {
      console.log('[games] GET /api/games start', {
        url: req.url,
        method: req.method,
        database: getDatabaseDiagnostics(),
      });
      const games = await readGames();
      games.sort((a, b) => a.order - b.order);
      console.log('[games] GET /api/games success', {
        count: games.length,
      });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(games));
    } catch (err) {
      logDatabaseDiagnostics('GET /api/games failed', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: getPublicDatabaseError(err) }));
    }
    return;
  }
  if (req.method === 'POST') {
    // Create a new game (admin only)
    if (!verifyAdmin(req)) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const body = await readBody(req);
    const { title, tags } = body;
    if (typeof title !== 'string' || !title.trim()) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid title' }));
      return;
    }
    try {
      console.log('[games] POST /api/games start', {
        url: req.url,
        method: req.method,
        titleLength: title.length,
        tagsCount: Array.isArray(tags) ? tags.length : 0,
        database: getDatabaseDiagnostics(),
      });
      const newGame = await createGame({
        id: crypto.randomUUID(),
        title,
        tags,
      });
      console.log('[games] POST /api/games success', {
        id: newGame.id,
        order: newGame.order,
      });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(newGame));
    } catch (err) {
      logDatabaseDiagnostics('POST /api/games failed', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: getPublicDatabaseError(err) }));
    }
    return;
  }
  // Unsupported method
  res.statusCode = 405;
  res.setHeader('Allow', 'GET, POST');
  res.end('Method Not Allowed');
};
