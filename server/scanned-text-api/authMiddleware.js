/*const admin = require('./firebaseAdmin');

const ALLOWED_EMAIL = 'armando_eg13@hotmail.com'; 

module.exports = async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 🔐 Email restriction
    if (decodedToken.email !== ALLOWED_EMAIL) {
      return res.status(403).json({ error: 'Email not allowed' });
    }

    // 🔐 Leader check (custom claim)
    if (!decodedToken.leader) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('❌ Auth error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};*/

/*const admin = require('./firebaseAdmin');

module.exports = async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 🔒 EMAIL LOCK
    const allowedEmail = process.env.ALLOWED_EMAIL;

    if (!allowedEmail) {
      console.error('❌ ALLOWED_EMAIL not configured');
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    if (decodedToken.email !== allowedEmail) {
      console.warn(`🚫 Unauthorized email: ${decodedToken.email}`);
      return res.status(403).json({ error: 'Email not allowed' });
    }

    // Optional leader check (if you already use it)
    if (!decodedToken.leader) {
      return res.status(403).json({ error: 'Leader access required' });
    }

    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('❌ Token verification failed', err);
    res.status(401).json({ error: 'Invalid token' });
  }
};*/

const admin = require('./firebaseAdmin');

module.exports = function requireAuth(options = {}) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = await admin.auth().verifyIdToken(token);

      // Email lock (web only)
      if (options.requireLeader) {
        if (decoded.email !== process.env.ALLOWED_EMAIL) {
          return res.status(403).json({ error: 'Email not allowed' });
        }

        if (!decoded.leader) {
          return res.status(403).json({ error: 'Leader role required' });
        }
      }

      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};


