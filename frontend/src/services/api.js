import axios from 'axios';
import { getToken, clearAuth } from '../utils/storage';

// ⚠️ API CONFIG - CAMINHO RELATIVO PARA FUNCIONAR EM QUALQUER DOMÍNIO - 2026-01-24-12:20
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const FORCED_LOCAL_URL = 'http://localhost:8080/api';
// ✅ USAR CAMINHO RELATIVO EM PRODUÇÃO (funciona com lumini-i-a.fly.dev E luminiiadigital.com.br)
const PROD_URL = import.meta.env.VITE_API_URL || '/api';

const baseURL = IS_DEV ? FORCED_LOCAL_URL : PROD_URL;

console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: cyan; font-weight: bold;');
console.log('%c🚀 LUMINI I.A - API CONFIG', 'color: cyan; font-weight: bold; font-size: 18px;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: cyan; font-weight: bold;');
console.log('%c📍 Hostname:', 'color: yellow; font-weight: bold;', window.location.hostname);
console.log('%c🏠 Ambiente:', 'color: yellow; font-weight: bold;', IS_DEV ? 'DESENVOLVIMENTO' : 'PRODUÇÃO');
console.log('%c🎯 Base URL:', 'color: lime; font-weight: bold; font-size: 16px;', baseURL);
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: cyan; font-weight: bold;');

const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const fullUrl = config.baseURL + config.url;
  console.log('%c📤 REQUEST:', 'color: cyan; font-weight: bold;', config.method?.toUpperCase(), fullUrl);
  
  // ALERTA: Se estiver tentando acessar produção em desenvolvimento
  if (IS_DEV && fullUrl.includes('luminiiadigital.com.br')) {
    console.error('%c⛔ ERRO: Tentando acessar PRODUÇÃO em ambiente LOCAL!', 'color: red; font-weight: bold; font-size: 20px; background: yellow; padding: 10px;');
    alert('ERRO: Código antigo detectado! Pressione Ctrl+Shift+R para atualizar!');
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detalhado de erros 400 para debug
    if (error.response && error.response.status === 400) {
      console.error('❌ [API] Erro 400 - Bad Request:', {
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
        requestData: error.config?.data
      });
    }

    // Don't redirect if it's a login attempt failure
    const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');

    // Only logout on 401 (Unauthorized), not 403 (Forbidden/Premium Locked)
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
