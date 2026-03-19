const { readGames } = require('./_utils');

/**
 * Return a plain text representation of the current games list.  This
 * endpoint is public and does not require authentication.  The response
 * is served with a `text/plain` content type and includes a
 * `Content‑Disposition` header so browsers treat it as a downloadable
 * file named `games.txt`.
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end('Method Not Allowed');
    return;
  }
  try {
    const games = await readGames();
    // Sort by order ascending
    const sorted = games.slice().sort((a, b) => a.order - b.order);
    // Build lines like `#1 Title – #tag1 #tag2`
    const lines = sorted.map((g) => {
      const tags = Array.isArray(g.tags)
        ? g.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ')
        : '';
      const sep = tags ? ' – ' : '';
      return `#${g.order} ${g.title}${sep}${tags}`;
    });
    const content = lines.join('\n');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="games.txt"');
    res.end(content);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Failed to generate download');
  }
};