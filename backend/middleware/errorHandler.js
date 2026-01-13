/**
 * 🛡️ Global Error Handler
 * Middleware centralizado para tratamento de erros
 */

const logger = require('../utils/errorLogger');

const errorHandler = (err, req, res, next) => {
  // Log do erro
  logger.error('Unhandled Error', err, {
    method: req.method,
    path: req.path,
    body: req.body,
    userId: req.user?.id
  });

  // Resposta ao cliente
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
