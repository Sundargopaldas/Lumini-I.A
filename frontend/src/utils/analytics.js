/**
 * 🎯 Google Analytics 4 - Tracking Service
 * Sistema profissional de analytics para o Lumini I.A
 * 
 * NOTA: GA4 está carregado diretamente no HTML.
 * Este arquivo apenas fornece funções auxiliares para tracking.
 */

// Verificar se GA4 está disponível
const isGA4Available = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Inicializar GA4 (não necessário, já está no HTML)
export const initGA = (measurementId) => {
  // GA4 já está inicializado no HTML, esta função é mantida para compatibilidade
  console.log('ℹ️ GA4 já está carregado via HTML');
};

// Rastrear pageview
export const trackPageView = (path, title) => {
  if (!isGA4Available() || !path) return;
  
  try {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || 'Lumini I.A',
      page_location: window.location.href
    });
    console.log('📊 GA4 PageView:', path);
  } catch (error) {
    console.error('Erro ao rastrear pageview:', error);
  }
};

// Rastrear eventos personalizados
export const trackEvent = (category, action, label = '', value = 0) => {
  if (!isGA4Available()) return;
  
  try {
    window.gtag('event', action, {
      event_category: category,
      event_label: label || '',
      value: value
    });
    console.log('📊 GA4 Event:', { category, action, label, value });
  } catch (error) {
    console.error('Erro ao rastrear evento:', error);
  }
};

// Rastrear conversões (upgrade de plano, etc)
export const trackConversion = (conversionName, value = 0, currency = 'BRL') => {
  if (!isGA4Available()) return;
  
  try {
    window.gtag('event', 'conversion', {
      send_to: conversionName,
      value: value,
      currency: currency
    });
    console.log('💰 GA4 Conversion:', { conversionName, value, currency });
  } catch (error) {
    console.error('Erro ao rastrear conversão:', error);
  }
};

// Rastrear login
export const trackLogin = (method = 'email') => {
  if (!isGA4Available()) return;
  
  try {
    window.gtag('event', 'login', {
      method: method
    });
    console.log('🔐 GA4 Login:', method);
  } catch (error) {
    console.error('Erro ao rastrear login:', error);
  }
};

// Rastrear registro
export const trackSignup = (method = 'email') => {
  if (!isGA4Available()) return;
  
  try {
    window.gtag('event', 'sign_up', {
      method: method
    });
    console.log('✍️ GA4 Signup:', method);
  } catch (error) {
    console.error('Erro ao rastrear signup:', error);
  }
};

// Rastrear upgrade de plano
export const trackPlanUpgrade = (planName, value) => {
  if (!isGA4Available()) return;
  
  try {
    trackEvent('Subscription', 'upgrade', planName, value);
    trackConversion('plan_upgrade', value);
  } catch (error) {
    console.error('Erro ao rastrear upgrade:', error);
  }
};

// Rastrear cancelamento
export const trackPlanCancel = (planName, reason = '') => {
  if (!isGA4Available()) return;
  
  try {
    trackEvent('Subscription', 'cancel', `${planName} - ${reason}`);
  } catch (error) {
    console.error('Erro ao rastrear cancelamento:', error);
  }
};

// Rastrear transações
export const trackTransaction = (transactionId, value, items = []) => {
  if (!isGA4Available()) return;
  
  try {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: 'BRL',
      items: items
    });
    console.log('💳 GA4 Transaction:', { transactionId, value });
  } catch (error) {
    console.error('Erro ao rastrear transação:', error);
  }
};

// Rastrear erros
export const trackError = (errorMessage, errorLevel = 'error') => {
  if (!isGA4Available()) return;
  
  try {
    trackEvent('Error', errorLevel, errorMessage || 'Unknown error');
  } catch (error) {
    console.error('Erro ao rastrear erro:', error);
  }
};

// Rastrear integração conectada
export const trackIntegration = (integrationName) => {
  if (!isGA4Available()) return;
  
  try {
    trackEvent('Integration', 'connect', integrationName);
  } catch (error) {
    console.error('Erro ao rastrear integração:', error);
  }
};

// Rastrear uso de IA
export const trackAIUsage = (feature, prompt = '') => {
  if (!isGA4Available()) return;
  
  try {
    trackEvent('AI', 'usage', feature);
  } catch (error) {
    console.error('Erro ao rastrear uso de IA:', error);
  }
};

// Rastrear exportação de relatórios
export const trackExport = (reportType, format = 'pdf') => {
  if (!isGA4Available()) return;
  
  try {
    trackEvent('Report', 'export', `${reportType} - ${format}`);
  } catch (error) {
    console.error('Erro ao rastrear exportação:', error);
  }
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackConversion,
  trackLogin,
  trackSignup,
  trackPlanUpgrade,
  trackPlanCancel,
  trackTransaction,
  trackError,
  trackIntegration,
  trackAIUsage,
  trackExport
};
