const crypto = require('crypto');
const { createGame, readBody, readGames, verifyAdmin } = require('./_utils');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Public read: return the list of games sorted by order
    try {
      const games = await readGames();
      games.sort((a, b) => a.order - b.order);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(games));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to read games' }));
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
      const newGame = await createGame({
        id: crypto.randomUUID(),
        title,
        tags,
      });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(newGame));
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to save game' }));
    }
    return;
  }
  // Unsupported method
  res.statusCode = 405;
  res.setHeader('Allow', 'GET, POST');
  res.end('Method Not Allowed');
};
