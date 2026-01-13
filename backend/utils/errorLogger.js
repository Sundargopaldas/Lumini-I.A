/**
 * 🐛 Error Logging System
 * Sistema profissional de rastreamento de erros
 */

const fs = require('fs');
const path = require('path');

class ErrorLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.errorLogFile = path.join(this.logDir, 'errors.log');
    this.accessLogFile = path.join(this.logDir, 'access.log');
    this.initLogs();
  }

  initLogs() {
    // Criar diretório de logs se não existir
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}\n`;
  }

  log(level, message, meta = {}) {
    const logEntry = this.formatLog(level, message, meta);
    
    // Log no console (colorido)
    const colors = {
      error: '\x1b[31m', // vermelho
      warn: '\x1b[33m',  // amarelo
      info: '\x1b[36m',  // ciano
      success: '\x1b[32m' // verde
    };
    const color = colors[level] || '\x1b[0m';
    console.log(`${color}${logEntry}\x1b[0m`);

    // Log em arquivo
    const logFile = level === 'error' || level === 'warn' ? this.errorLogFile : this.accessLogFile;
    fs.appendFileSync(logFile, logEntry);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error && {
        stack: error.stack,
        name: error.name,
        message: error.message
      })
    };
    this.log('error', message, errorMeta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  success(message, meta = {}) {
    this.log('success', message, meta);
  }

  // Log de requisições HTTP
  logRequest(req, res, duration) {
    const logEntry = this.formatLog('info', 'HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous'
    });
    fs.appendFileSync(this.accessLogFile, logEntry);
  }

  // Cleanup de logs antigos (rodar periodicamente)
  cleanupOldLogs(daysToKeep = 30) {
    const files = [this.errorLogFile, this.accessLogFile];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    files.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        if (stats.mtime < cutoffDate) {
          // Arquivar log antigo
          const archiveFile = `${file}.${cutoffDate.toISOString().split('T')[0]}.archive`;
          fs.renameSync(file, archiveFile);
          this.info(`Log arquivado: ${archiveFile}`);
        }
      }
    });
  }
}

// Singleton instance
const logger = new ErrorLogger();

module.exports = logger;
