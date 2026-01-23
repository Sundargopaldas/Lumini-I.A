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

  // Tratamento especial para erros de validação do Sequelize
  if (err.name === 'SequelizeValidationError') {
    const validationErrors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      message: 'Erro de validação',
      errors: validationErrors
    });
  }

  // Tratamento para erros de constraint do Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'campo';
    return res.status(400).json({
      message: `${field} já está em uso`,
      errors: [{ field, message: `Este ${field} já está cadastrado` }]
    });
  }

  // Tratamento para erros 400 (Bad Request)
  if (err.statusCode === 400 || err.status === 400) {
    return res.status(400).json({
      message: err.message || 'Requisição inválida',
      ...(err.errors && { errors: err.errors })
    });
  }

  // Resposta ao cliente
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode >= 500
    ? 'Erro interno do servidor' 
    : err.message || 'Erro desconhecido';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      name: err.name
    })
  });
};

module.exports = errorHandler;
