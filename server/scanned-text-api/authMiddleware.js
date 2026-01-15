const admin = require('./firebaseAdmin');

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
};
