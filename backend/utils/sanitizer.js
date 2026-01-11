/**
 * Sanitizador de HTML e Inputs
 * 
 * Protege contra XSS e injeção de código
 * Versão simplificada sem dependências problemáticas
 */

/**
 * Sanitiza HTML removendo scripts e tags perigosas
 * Usa regex para remover tags HTML perigosas
 */
const sanitizeHTML = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return dirty;
  
  // Remove scripts, iframes, e outras tags perigosas
  let clean = dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/on\w+\s*=\s*[^\s>]*/gi, ''); // Remove inline events
  
  return clean;
};

/**
 * Remove completamente qualquer HTML
 */
const stripHTML = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return dirty;
  
  // Remove todas as tags HTML
  return dirty.replace(/<[^>]*>/g, '');
};

/**
 * Sanitiza objeto recursivamente
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = stripHTML(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
};

/**
 * Escapa caracteres SQL perigosos (Sequelize já faz isso, mas é extra proteção)
 */
const escapeSQLWildcards = (str) => {
  if (!str || typeof str !== 'string') return str;
  
  return str.replace(/[%_]/g, '\\$&');
};

/**
 * Sanitiza filename para evitar path traversal
 */
const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return 'file';
  
  // Remove path separators e caracteres perigosos
  return filename
    .replace(/[/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
};

/**
 * Middleware para sanitizar req.body automaticamente
 */
const sanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

module.exports = {
  sanitizeHTML,
  stripHTML,
  sanitizeObject,
  escapeSQLWildcards,
  sanitizeFilename,
  sanitizeMiddleware
};
