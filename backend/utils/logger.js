/**
 * Sistema de Logs Estruturados
 * 
 * Substitui console.log por logs estruturados e coloridos
 * Facilita debugging e monitoramento
 */

const fs = require('fs');
const path = require('path');

// Cores ANSI para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Níveis de log
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

// Nível mínimo para exibir logs
const currentLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] 
  : (process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);

/**
 * Formata timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Escreve log em arquivo (opcional em produção)
 */
const writeToFile = (level, message, meta) => {
  if (process.env.NODE_ENV !== 'production') return;
  
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `${level.toLowerCase()}.log`);
  const logEntry = JSON.stringify({
    timestamp: getTimestamp(),
    level,
    message,
    ...meta
  }) + '\n';
  
  fs.appendFileSync(logFile, logEntry);
};

/**
 * Logger principal
 */
class Logger {
  constructor(module = 'APP') {
    this.module = module;
  }

  _log(level, levelName, color, message, meta = {}) {
    if (level < currentLevel) return;

    const timestamp = getTimestamp();
    const prefix = `${colors[color]}[${levelName}]${colors.reset}`;
    const moduleStr = `${colors.dim}[${this.module}]${colors.reset}`;
    const timeStr = `${colors.dim}${timestamp}${colors.reset}`;

    // Console output (colorido)
    console.log(`${timeStr} ${prefix} ${moduleStr} ${message}`);
    
    // Se há metadata, exibir
    if (Object.keys(meta).length > 0) {
      console.log(`${colors.dim}${JSON.stringify(meta, null, 2)}${colors.reset}`);
    }

    // Escrever em arquivo (produção)
    writeToFile(levelName, message, { module: this.module, ...meta });
  }

  debug(message, meta = {}) {
    this._log(LOG_LEVELS.DEBUG, 'DEBUG', 'cyan', message, meta);
  }

  info(message, meta = {}) {
    this._log(LOG_LEVELS.INFO, 'INFO', 'green', message, meta);
  }

  warn(message, meta = {}) {
    this._log(LOG_LEVELS.WARN, 'WARN', 'yellow', message, meta);
  }

  error(message, meta = {}) {
    this._log(LOG_LEVELS.ERROR, 'ERROR', 'red', message, meta);
    
    // Se é um Error object, exibir stack
    if (meta.error && meta.error.stack) {
      console.log(`${colors.dim}${meta.error.stack}${colors.reset}`);
    }
  }

  fatal(message, meta = {}) {
    this._log(LOG_LEVELS.FATAL, 'FATAL', 'bgRed', message, meta);
  }

  // Helpers específicos
  http(method, path, statusCode, duration) {
    const color = statusCode >= 500 ? 'red' : statusCode >= 400 ? 'yellow' : 'green';
    this._log(
      LOG_LEVELS.INFO,
      'HTTP',
      color,
      `${method} ${path} ${statusCode} - ${duration}ms`
    );
  }

  db(query, duration) {
    this.debug(`DB Query: ${query}`, { duration: `${duration}ms` });
  }

  auth(action, userId, success = true) {
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
    const levelName = success ? 'AUTH' : 'AUTH_FAIL';
    const color = success ? 'blue' : 'yellow';
    
    this._log(level, levelName, color, `${action} - User: ${userId}`);
  }
}

/**
 * Criar instâncias de logger por módulo
 */
const createLogger = (module) => new Logger(module);

// Logger padrão
const logger = new Logger('APP');

module.exports = {
  logger,
  createLogger,
  Logger
};
