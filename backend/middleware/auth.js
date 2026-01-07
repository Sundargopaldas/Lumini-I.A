const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.log('[Auth] No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // SECURITY CHECK: Fail in production if JWT_SECRET is missing
    if (!process.env.JWT_SECRET) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: JWT_SECRET is missing in production environment.');
        } else {
            console.warn('⚠️  [SECURITY WARNING] JWT_SECRET is not defined in .env! Using insecure default. Please fix this for production.');
        }
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
