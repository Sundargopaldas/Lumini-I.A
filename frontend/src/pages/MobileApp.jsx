import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const MobileApp = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Capture install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
        // Fallback or instructions
        alert("Para instalar, use o menu do seu navegador e selecione 'Adicionar à Tela Inicial' ou 'Instalar Aplicativo'.");
    }
  };

  const features = [
    {
        title: 'Scanner de Recibos',
        desc: 'Digitalize suas despesas em segundos com a câmera.',
        icon: '📸'
    },
    {
        title: 'Acesso Biométrico',
        desc: 'Segurança total com FaceID e TouchID (quando disponível).',
        icon: '🔒'
    },
    {
        title: 'Modo Offline',
        desc: 'Registre gastos mesmo sem internet.',
        icon: '📡'
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <span className="inline-block py-1 px-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-sm font-bold mb-6">
                📱 Web App Instalável (PWA)
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
              O seu escritório,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                no seu bolso.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Instale o Lumini I.A diretamente no seu celular sem ocupar espaço. Funciona como um app nativo, offline e com notificações.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              {!isIOS && (
                  <button 
                    onClick={handleInstallClick}
                    className="flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl hover:opacity-90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs opacity-80">Instalar no</div>
                      <div className="text-lg font-bold leading-none">Android / PC</div>
                    </div>
                  </button>
              )}

              {isIOS && (
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <p className="font-bold text-slate-900 dark:text-white mb-2">Como instalar no iOS:</p>
                      <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                          <li>Toque no botão <strong>Compartilhar</strong> <span className="inline-block px-1 bg-slate-200 rounded">⎋</span></li>
                          <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></li>
                          <li>Confirme tocando em <strong>Adicionar</strong></li>
                      </ol>
                  </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {features.map((feature, idx) => (
                    <div key={idx} className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm hover:border-purple-500/30 transition-colors">
                        <div className="text-3xl mb-2">{feature.icon}</div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{feature.desc}</p>
                    </div>
                ))}
            </div>

          </div>

          <div className="relative order-1 lg:order-2 flex justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
            <img 
              src="https://cdn.dribbble.com/users/1615584/screenshots/15710334/media/3c23075252873d611849d479374092b7.jpg?resize=1000x750&vertical=center" 
              alt="App Mobile Mockup" 
              className="relative z-10 rounded-[2.5rem] shadow-2xl border-8 border-slate-900 dark:border-slate-800 mx-auto max-w-sm w-full transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500"
            />
            {/* Floating Badge */}
            <div className="absolute -bottom-10 -left-10 z-20 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hidden md:block animate-bounce" style={{animationDuration: '3s'}}>
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Notificação</p>
                        <p className="font-bold text-slate-900 dark:text-white">Nota Fiscal Emitida!</p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 py-12">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-10">Perguntas Frequentes</h2>
            <div className="max-w-3xl mx-auto space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">O que é um PWA?</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">PWA (Progressive Web App) é uma tecnologia que permite instalar o site como um aplicativo, sem precisar baixar na loja. Ele ocupa menos espaço e atualiza automaticamente.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Funciona offline?</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Sim! Graças à tecnologia PWA, você pode acessar dados em cache mesmo sem conexão.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MobileApp;
