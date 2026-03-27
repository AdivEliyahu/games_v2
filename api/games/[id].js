const { deleteGameById, readBody, updateGameById, verifyAdmin } = require('./_utils');

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
    try {
      const updatedGame = await updateGameById(id, { title, tags });
      if (!updatedGame) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(updatedGame));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to update game' }));
    }
    return;
  }
  if (req.method === 'DELETE') {
    try {
      const deleted = await deleteGameById(id);
      if (!deleted) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
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
