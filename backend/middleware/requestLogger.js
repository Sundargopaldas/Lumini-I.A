/**
 * 📊 Request Logger Middleware
 * Middleware para logar todas as requisições HTTP
 */

const logger = require('../utils/errorLogger');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log quando a resposta terminar
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });

  next();
};

module.exports = requestLogger;
