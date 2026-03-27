const { readBody, reorderGamesInDatabase, verifyAdmin } = require('./_utils');

/**
 * Reorder the list of games based on an array of IDs provided in the
 * request body.  Only admins may call this endpoint.  The body should
 * be JSON with a single property `ids` which is an array of game
 * identifiers in their desired order.  The server validates that the
 * array contains exactly the IDs of the current games and then
 * rewrites the `order` field for each game starting from 1.
 */
module.exports = async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }
  // Verify admin session from cookie
  if (!verifyAdmin(req)) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }
  try {
    const body = await readBody(req);
    const { ids } = body;
    // Validate input
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid ids' }));
      return;
    }
    await reorderGamesInDatabase(ids);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    console.error(err);
    res.statusCode =
      err.message === 'Mismatched ids length' ||
      err.message === 'Duplicate ids' ||
      err.message.startsWith('Unknown id:')
        ? 400
        : 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error:
          res.statusCode === 400 ? err.message : 'Failed to reorder games',
      }),
    );
  }
};
