import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 🍪 COMPONENTE DE CONSENTIMENTO DE COOKIES
 * Conformidade com LGPD e GDPR
 */
const CookieConsent = () => {
  const { isDark } = useTheme();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Verificar se o usuário já deu consentimento
    const consent = localStorage.getItem('lumini_cookie_consent');
    if (!consent) {
      // Mostrar banner após 1 segundo (melhor UX)
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('lumini_cookie_consent', JSON.stringify({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('lumini_cookie_consent', JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowDetails(!showDetails);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-auto ${
          showBanner ? 'bg-black/50 backdrop-blur-sm' : 'opacity-0'
        }`}
        onClick={() => setShowBanner(false)}
      />

      {/* Banner */}
      <div 
        className={`relative w-full max-w-4xl mx-4 mb-6 pointer-events-auto transform transition-all duration-500 ${
          showBanner ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className={`
          rounded-2xl shadow-2xl border backdrop-blur-lg
          ${isDark 
            ? 'bg-slate-900/95 border-slate-700 text-white' 
            : 'bg-white/95 border-slate-200 text-slate-900'
          }
        `}>
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-4xl">
                🍪
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">
                  Nós valorizamos sua privacidade
                </h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Usamos cookies para melhorar sua experiência, personalizar conteúdo e analisar nosso tráfego. 
                  Ao clicar em "Aceitar Todos", você concorda com o uso de todos os cookies. 
                  Para mais informações, consulte nossa{' '}
                  <a 
                    href="/terms" 
                    className="text-purple-500 hover:text-purple-600 underline"
                    target="_blank"
                  >
                    Política de Privacidade
                  </a>.
                </p>
              </div>
            </div>
          </div>

          {/* Details (expandable) */}
          {showDetails && (
            <div className={`px-6 pb-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="pt-4 space-y-4">
                {/* Essential Cookies */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">Cookies Essenciais</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                      }`}>
                        Sempre ativos
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Necessários para o funcionamento básico do site (login, autenticação, segurança).
                    </p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    id="analytics-cookies"
                  />
                  <div className="flex-1">
                    <label htmlFor="analytics-cookies" className="cursor-pointer">
                      <h4 className="font-semibold text-sm">Cookies de Análise</h4>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Nos ajudam a entender como você usa o site para melhorar sua experiência.
                      </p>
                    </label>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    id="marketing-cookies"
                  />
                  <div className="flex-1">
                    <label htmlFor="marketing-cookies" className="cursor-pointer">
                      <h4 className="font-semibold text-sm">Cookies de Marketing</h4>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Usados para personalizar anúncios e medir a eficácia de campanhas.
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={`p-6 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Aceitar Todos
              </button>
              
              <button
                onClick={handleAcceptEssential}
                className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all duration-200 border ${
                  isDark
                    ? 'border-slate-600 hover:bg-slate-800 text-white'
                    : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                Apenas Essenciais
              </button>

              <button
                onClick={handleCustomize}
                className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'text-purple-400 hover:text-purple-300'
                    : 'text-purple-600 hover:text-purple-700'
                }`}
              >
                {showDetails ? 'Ocultar' : 'Personalizar'}
              </button>
            </div>

            {/* LGPD compliance text */}
            <p className={`text-xs text-center mt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Em conformidade com a LGPD (Lei Geral de Proteção de Dados) e GDPR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
