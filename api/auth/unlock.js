const crypto = require('crypto');

// Helper to read JSON body from a Node.js incoming message.  Returns an
// empty object if parsing fails.
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

// Create an HMAC‑signed session token.  The token is a base64 encoded
// payload containing a timestamp and authorised flag followed by a
// hexadecimal signature.  The ADMIN_SECRET is used as the HMAC key so the
// signature cannot be forged by the client.
function createToken(secret) {
  const payload = {
    authorized: true,
    iat: Date.now(),
  };
  const payloadStr = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('hex');
  const token = `${Buffer.from(payloadStr).toString('base64')}.${signature}`;
  return token;
}

module.exports = async (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'ADMIN_SECRET is not configured' }));
    return;
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }
  const body = await readBody(req);
  // If the client requests lock, expire the cookie immediately and return
  if (body.action === 'lock') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Set-Cookie',
      `admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
    );
    res.end(JSON.stringify({ success: true }));
    return;
  }
  const { password } = body;
  if (typeof password !== 'string') {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Invalid input' }));
    return;
  }
  if (password === secret) {
    const token = createToken(secret);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    // Issue cookie for one day
    res.setHeader(
      'Set-Cookie',
      `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
    );
    res.end(JSON.stringify({ success: true }));
  } else {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false }));
  }
};