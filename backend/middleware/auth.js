const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.log('[Auth] No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // SECURITY CHECK: JWT_SECRET is required
    if (!process.env.JWT_SECRET) {
        console.error('[SECURITY] FATAL: JWT_SECRET is not defined!');
        return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('[Auth] Token invalid:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
