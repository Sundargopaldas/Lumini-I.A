const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.log('[Auth] No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // SECURITY WARNING: Using default secret if env var is missing
    if (!process.env.JWT_SECRET) {
        console.warn('⚠️  [SECURITY WARNING] JWT_SECRET is not defined in .env! Using insecure default. Please fix this for production.');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('[Auth] Token invalid:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
