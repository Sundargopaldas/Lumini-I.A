/**
 * 🗄️ UTILITÁRIO DE STORAGE SEGURO
 * Gerencia localStorage com tratamento de erros para Tracking Prevention e modo privado
 */

/**
 * Verifica se o storage está disponível
 */
const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Obtém um item do localStorage com tratamento de erros
 * @param {string} key - Chave do item
 * @param {*} defaultValue - Valor padrão se não encontrar ou erro
 * @returns {*} Valor ou defaultValue
 */
export const getStorageItem = (key, defaultValue = null) => {
  if (!isStorageAvailable()) {
    console.warn(`⚠️ Storage não disponível (Tracking Prevention ou modo privado). Chave: ${key}`);
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    // Tentar fazer parse JSON, se falhar retorna string
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (error) {
    console.warn(`⚠️ Erro ao ler storage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Salva um item no localStorage com tratamento de erros
 * @param {string} key - Chave do item
 * @param {*} value - Valor a salvar (será convertido para JSON se objeto)
 * @returns {boolean} true se salvou com sucesso, false caso contrário
 */
export const setStorageItem = (key, value) => {
  if (!isStorageAvailable()) {
    console.warn(`⚠️ Storage não disponível (Tracking Prevention ou modo privado). Chave: ${key}`);
    return false;
  }

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    // Pode ser erro de quota excedida ou bloqueio
    if (error.name === 'QuotaExceededError') {
      console.error(`❌ Quota de storage excedida ao salvar: ${key}`);
    } else {
      console.warn(`⚠️ Erro ao salvar storage (${key}):`, error);
    }
    return false;
  }
};

/**
 * Remove um item do localStorage
 * @param {string} key - Chave do item
 * @returns {boolean} true se removeu com sucesso
 */
export const removeStorageItem = (key) => {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`⚠️ Erro ao remover storage (${key}):`, error);
    return false;
  }
};

/**
 * Limpa todo o localStorage
 * @returns {boolean} true se limpou com sucesso
 */
export const clearStorage = () => {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn('⚠️ Erro ao limpar storage:', error);
    return false;
  }
};

/**
 * Obtém o token de autenticação
 */
export const getToken = () => {
  return getStorageItem('token', null);
};

/**
 * Salva o token de autenticação
 */
export const setToken = (token) => {
  return setStorageItem('token', token);
};

/**
 * Remove o token de autenticação
 */
export const removeToken = () => {
  return removeStorageItem('token');
};

/**
 * Obtém dados do usuário
 */
export const getUser = () => {
  return getStorageItem('user', null);
};

/**
 * Salva dados do usuário
 */
export const setUser = (user) => {
  return setStorageItem('user', user);
};

/**
 * Remove dados do usuário
 */
export const removeUser = () => {
  return removeStorageItem('user');
};

/**
 * Verifica se o usuário está autenticado
 */
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && user && user.id);
};

/**
 * Limpa dados de autenticação
 */
export const clearAuth = () => {
  removeToken();
  removeUser();
};
