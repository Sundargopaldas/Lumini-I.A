/**
 * Sistema de Cache com Redis
 * 
 * Cache opcional que funciona mesmo sem Redis
 * Se Redis não estiver disponível, usa cache em memória
 */

let redis = null;
let memoryCache = {};

/**
 * Inicializa conexão Redis (opcional)
 */
const initRedis = () => {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.log('[CACHE] Redis not configured - using memory cache');
    return null;
  }

  try {
    const Redis = require('redis');
    
    const client = Redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });

    client.on('error', (err) => {
      console.warn('[CACHE] Redis error, falling back to memory:', err.message);
      redis = null;
    });

    client.on('connect', () => {
      console.log('[CACHE] Redis connected successfully');
    });

    client.connect();
    redis = client;
    return client;
  } catch (error) {
    console.warn('[CACHE] Redis initialization failed, using memory cache:', error.message);
    return null;
  }
};

/**
 * Get value from cache
 */
const get = async (key) => {
  try {
    if (redis && redis.isOpen) {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    }
    
    // Fallback: memory cache
    return memoryCache[key] || null;
  } catch (error) {
    console.error('[CACHE] Get error:', error.message);
    return null;
  }
};

/**
 * Set value in cache
 * @param {string} key
 * @param {any} value
 * @param {number} ttl - Time to live in seconds (default: 3600 = 1h)
 */
const set = async (key, value, ttl = 3600) => {
  try {
    const serialized = JSON.stringify(value);
    
    if (redis && redis.isOpen) {
      await redis.setEx(key, ttl, serialized);
    } else {
      // Fallback: memory cache with expiration
      memoryCache[key] = value;
      setTimeout(() => delete memoryCache[key], ttl * 1000);
    }
  } catch (error) {
    console.error('[CACHE] Set error:', error.message);
  }
};

/**
 * Delete value from cache
 */
const del = async (key) => {
  try {
    if (redis && redis.isOpen) {
      await redis.del(key);
    }
    delete memoryCache[key];
  } catch (error) {
    console.error('[CACHE] Delete error:', error.message);
  }
};

/**
 * Clear all cache
 */
const clear = async () => {
  try {
    if (redis && redis.isOpen) {
      await redis.flushAll();
    }
    memoryCache = {};
  } catch (error) {
    console.error('[CACHE] Clear error:', error.message);
  }
};

/**
 * Middleware de cache
 * Cacheia responses GET automaticamente
 */
const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    // Só cacheia GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}:user:${req.user?.id || 'anonymous'}`;

    try {
      const cached = await get(key);
      if (cached) {
        console.log(`[CACHE] HIT: ${key}`);
        return res.json(cached);
      }

      // Interceptar res.json para cachear
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        set(key, body, ttl).catch(console.error);
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('[CACHE] Middleware error:', error);
      next();
    }
  };
};

// Inicializar (não quebra se Redis não estiver disponível)
initRedis();

module.exports = {
  get,
  set,
  del,
  clear,
  cacheMiddleware,
  redis: () => redis
};
