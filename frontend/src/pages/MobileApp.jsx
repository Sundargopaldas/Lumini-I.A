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
        title: 'Acesso Instantâneo',
        desc: 'Abra o app direto da tela inicial, sem abrir navegador.',
        icon: '⚡'
    },
    {
        title: 'Modo Offline',
        desc: 'Registre gastos mesmo sem internet, sincroniza depois.',
        icon: '📡'
    },
    {
        title: 'Notificações Push',
        desc: 'Receba alertas de vencimento e novas transações.',
        icon: '🔔'
    },
    {
        title: 'Tela Cheia',
        desc: 'Funciona em fullscreen, como um app nativo.',
        icon: '📱'
    },
    {
        title: 'Atualizações Automáticas',
        desc: 'Sempre a última versão, sem download manual.',
        icon: '🔄'
    },
    {
        title: 'Ocupa Pouco Espaço',
        desc: 'Menos de 2MB vs 50-100MB de apps tradicionais.',
        icon: '💾'
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, idx) => (
                    <div key={idx} className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm hover:border-purple-500/30 hover:shadow-md transition-all">
                        <div className="text-3xl mb-2">{feature.icon}</div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{feature.title}</h3>
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

        {/* Comparison Section */}
        <div className="mt-20 py-12 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-4">Por que instalar?</h2>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
                Veja a diferença entre usar no navegador vs. instalar como aplicativo
            </p>
            
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Navegador */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl">
                                🌐
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Navegador</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Acesso tradicional</p>
                            </div>
                        </div>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-slate-400">✓</span>
                                <span className="text-slate-600 dark:text-slate-400">Funciona em qualquer dispositivo</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-slate-400">✓</span>
                                <span className="text-slate-600 dark:text-slate-400">Não precisa instalar nada</span>
                            </li>
                            <li className="flex items-start gap-2 opacity-50">
                                <span className="text-red-500">✗</span>
                                <span className="text-slate-600 dark:text-slate-400">Precisa abrir o navegador</span>
                            </li>
                            <li className="flex items-start gap-2 opacity-50">
                                <span className="text-red-500">✗</span>
                                <span className="text-slate-600 dark:text-slate-400">Barra de endereço ocupa espaço</span>
                            </li>
                            <li className="flex items-start gap-2 opacity-50">
                                <span className="text-red-500">✗</span>
                                <span className="text-slate-600 dark:text-slate-400">Sem notificações push</span>
                            </li>
                            <li className="flex items-start gap-2 opacity-50">
                                <span className="text-red-500">✗</span>
                                <span className="text-slate-600 dark:text-slate-400">Modo offline limitado</span>
                            </li>
                        </ul>
                    </div>

                    {/* App Instalado */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border-2 border-purple-500/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                            RECOMENDADO
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-2xl shadow-lg">
                                📱
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">App Instalado (PWA)</h3>
                                <p className="text-xs text-purple-600 dark:text-purple-400">Experiência completa</p>
                            </div>
                        </div>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                <span className="text-slate-900 dark:text-white font-medium">Ícone na tela inicial</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                <span className="text-slate-900 dark:text-white font-medium">Abre instantaneamente</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                <span className="text-slate-900 dark:text-white font-medium">Tela cheia (sem barra)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                <span className="text-slate-900 dark:text-white font-medium">Notificações push</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                <span className="text-slate-900 dark:text-white font-medium">Funciona offline completo</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                <span className="text-slate-900 dark:text-white font-medium">Ocupa menos de 2MB</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div>
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Dica Profissional</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-200">
                                Você pode usar os dois! Instale o app no celular para uso diário e acesse pelo navegador no computador do escritório. Tudo sincroniza automaticamente na nuvem.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 py-12 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-10">Perguntas Frequentes</h2>
            <div className="max-w-3xl mx-auto space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <span className="text-purple-600">📱</span>
                        O que é um PWA?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        PWA (Progressive Web App) é uma tecnologia moderna que permite instalar o Lumini como se fosse um app nativo, sem precisar baixar na Play Store ou App Store. Ele ocupa menos de 2MB (vs 50-100MB de apps tradicionais) e atualiza automaticamente sempre que você abre.
                    </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <span className="text-blue-600">📡</span>
                        Funciona offline?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Sim! Você pode visualizar suas transações, adicionar novas despesas e criar relatórios mesmo sem internet. Tudo será sincronizado automaticamente quando você voltar a ter conexão.
                    </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <span className="text-green-600">💾</span>
                        Quanto espaço ocupa no celular?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Menos de 2MB! Muito menos que apps tradicionais que ocupam 50-100MB. E você não precisa se preocupar com atualizações manuais - tudo acontece automaticamente.
                    </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <span className="text-orange-600">🔐</span>
                        É seguro?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Totalmente! O PWA usa HTTPS (conexão criptografada), exatamente como o site no navegador. Seus dados bancários e financeiros ficam protegidos com a mesma segurança de um banco digital.
                    </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <span className="text-red-600">🗑️</span>
                        Como desinstalar?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        <strong>Android:</strong> Mantenha pressionado o ícone → "Desinstalar" ou vá em Configurações → Apps → Lumini → Desinstalar.<br/>
                        <strong>iOS:</strong> Mantenha pressionado o ícone → "Remover App".
                    </p>
                </div>
            </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 py-12 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-3xl border border-purple-200 dark:border-purple-800">
            <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-8">Números que Impressionam</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto px-4">
                <div className="text-center">
                    <div className="text-4xl md:text-5xl font-extrabold text-purple-600 dark:text-purple-400 mb-2">
                        &lt;2MB
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Tamanho do app</p>
                </div>
                <div className="text-center">
                    <div className="text-4xl md:text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-2">
                        100%
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Funciona offline</p>
                </div>
                <div className="text-center">
                    <div className="text-4xl md:text-5xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">
                        0s
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Tempo de abertura</p>
                </div>
                <div className="text-center">
                    <div className="text-4xl md:text-5xl font-extrabold text-green-600 dark:text-green-400 mb-2">
                        AUTO
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Atualização</p>
                </div>
            </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center py-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Pronto para levar o Lumini<br className="hidden md:block"/>
                para o seu bolso?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
                Instale agora e tenha seu escritório financeiro sempre à mão. Leva menos de 30 segundos!
            </p>
            
            {!isIOS ? (
                <button 
                    onClick={handleInstallClick}
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Instalar Lumini Agora
                </button>
            ) : (
                <div className="inline-block bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl shadow-2xl max-w-md">
                    <p className="font-bold mb-3 text-lg">📲 No Safari:</p>
                    <p className="text-sm text-left">
                        Toque em <strong>Compartilhar</strong> → <strong>"Adicionar à Tela de Início"</strong> → <strong>Adicionar</strong>
                    </p>
                </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
                ✓ Gratuito  •  ✓ Sem Anúncios  •  ✓ Sempre Atualizado
            </p>
        </div>
      </div>
    </div>
  );
};

export default MobileApp;
