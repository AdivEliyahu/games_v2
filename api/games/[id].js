const { readBody, verifyAdmin, readGames, writeGames } = require('./_utils');

// Extract the id from the request URL.  Works even when deployed because
// req.url contains the path after the domain.
function extractId(req) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.split('/');
    return parts[parts.length - 1];
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  const id = extractId(req);
  if (!id) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid ID' }));
    return;
  }
  if (!verifyAdmin(req)) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }
  if (req.method === 'PUT') {
    const body = await readBody(req);
    const { title, tags } = body;
    if (typeof title !== 'string' || !title.trim()) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid title' }));
      return;
    }
    const tagArray = Array.isArray(tags)
      ? tags.map((t) => String(t).trim().replace(/^#+/, '')).filter((t) => t.length > 0)
      : [];
    try {
      const games = await readGames();
      const idx = games.findIndex((g) => g.id === id);
      if (idx === -1) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
      games[idx].title = title.trim();
      games[idx].tags = tagArray;
      await writeGames(games);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(games[idx]));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to update game' }));
    }
    return;
  }
  if (req.method === 'DELETE') {
    try {
      let games = await readGames();
      const idx = games.findIndex((g) => g.id === id);
      if (idx === -1) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
      games.splice(idx, 1);
      // Reassign order values sequentially starting at 1
      games = games
        .sort((a, b) => a.order - b.order)
        .map((g, index) => ({ ...g, order: index + 1 }));
      await writeGames(games);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to delete game' }));
    }
    return;
  }
  res.statusCode = 405;
  res.setHeader('Allow', 'PUT, DELETE');
  res.end('Method Not Allowed');
};