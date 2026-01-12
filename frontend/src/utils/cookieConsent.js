/**
 * 🍪 HELPER DE CONSENTIMENTO DE COOKIES
 * Funções para verificar e gerenciar consentimento do usuário
 */

/**
 * Obtém o consentimento atual do usuário
 * @returns {Object|null}
 */
export const getCookieConsent = () => {
  try {
    const consent = localStorage.getItem('lumini_cookie_consent');
    return consent ? JSON.parse(consent) : null;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
};

/**
 * Verifica se o usuário consentiu com um tipo específico de cookie
 * @param {string} type - 'essential' | 'analytics' | 'marketing'
 * @returns {boolean}
 */
export const hasConsentFor = (type) => {
  const consent = getCookieConsent();
  
  // Cookies essenciais são sempre permitidos
  if (type === 'essential') return true;
  
  // Se não há consentimento ainda, assumir que não consentiu
  if (!consent) return false;
  
  return consent[type] === true;
};

/**
 * Atualiza o consentimento do usuário
 * @param {Object} preferences - { essential, analytics, marketing }
 */
export const updateCookieConsent = (preferences) => {
  try {
    localStorage.setItem('lumini_cookie_consent', JSON.stringify({
      ...preferences,
      timestamp: new Date().toISOString()
    }));
    
    // Recarregar página para aplicar mudanças
    window.location.reload();
  } catch (error) {
    console.error('Error updating cookie consent:', error);
  }
};

/**
 * Remove o consentimento (para testes)
 */
export const clearCookieConsent = () => {
  try {
    localStorage.removeItem('lumini_cookie_consent');
  } catch (error) {
    console.error('Error clearing cookie consent:', error);
  }
};

/**
 * Verifica se deve mostrar o banner
 * @returns {boolean}
 */
export const shouldShowCookieBanner = () => {
  return getCookieConsent() === null;
};

/**
 * Wrapper para Google Analytics (só carrega se houver consentimento)
 * @param {string} trackingId
 */
export const initAnalytics = (trackingId) => {
  if (!hasConsentFor('analytics')) {
    console.log('📊 Analytics disabled - no consent');
    return;
  }
  
  // Carregar Google Analytics
  console.log('📊 Analytics enabled - loading...');
  // TODO: Adicionar código do Google Analytics aqui
};

/**
 * Wrapper para Marketing/Pixels (só carrega se houver consentimento)
 */
export const initMarketing = () => {
  if (!hasConsentFor('marketing')) {
    console.log('📢 Marketing cookies disabled - no consent');
    return;
  }
  
  // Carregar Facebook Pixel, Google Ads, etc
  console.log('📢 Marketing cookies enabled - loading...');
  // TODO: Adicionar código de marketing aqui
};
