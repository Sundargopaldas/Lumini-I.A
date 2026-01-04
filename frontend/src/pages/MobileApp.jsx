import React from 'react';
import { useTranslation } from 'react-i18next';

const MobileApp = () => {
  const { t } = useTranslation();

  const features = [
    {
        title: 'Scanner de Recibos',
        desc: 'Digitalize suas despesas em segundos com a câmera.',
        icon: '📸'
    },
    {
        title: 'Acesso Biométrico',
        desc: 'Segurança total com FaceID e TouchID.',
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
                🚀 Disponível em Beta
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
              O seu escritório,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                no seu bolso.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Tenha o poder do Lumini I.A sempre com você. Gerencie finanças, emita notas e converse com seu contador inteligente de qualquer lugar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button className="flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl hover:opacity-90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                <svg viewBox="0 0 384 512" fill="currentColor" className="w-8 h-8">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 46.9 126.7 98 126.7 32.3 0 52.8-21.8 82.4-21.8 28.2 0 52.7 21.8 89.6 21.8 36.4 0 65.6-79.5 83.5-127.1 9.9-25.2 21.3-53.8 21.3-53.8-38.3-26.6-64-70.2-64.5-113.8zM240 76.9c16.3-25.3 16.8-57.3 5.4-80.9-28.7 5.2-60.8 26.8-77.9 55.4-15.5 25.4-21.1 57.1-8.5 78.4 29.8 4.7 63.8-22.1 81-52.9z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">Baixar na</div>
                  <div className="text-lg font-bold leading-none">App Store</div>
                </div>
              </button>

              <button className="flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl hover:opacity-90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                <svg viewBox="0 0 512 512" fill="currentColor" className="w-8 h-8">
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">DISPONÍVEL NO</div>
                  <div className="text-lg font-bold leading-none">Google Play</div>
                </div>
              </button>
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

        {/* Testimonials Section */}
        <div className="mt-20 py-12 border-t border-slate-200 dark:border-white/10">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-10">O que dizem nossos usuários</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl">👩‍💼</div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">Ana Silva</p>
                            <p className="text-xs text-slate-500">Empreendedora</p>
                        </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">"O scanner de recibos mudou minha vida! Não perco mais tempo digitando despesas."</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl">👨‍💻</div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">Carlos Mendes</p>
                            <p className="text-xs text-slate-500">Freelancer</p>
                        </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">"Consigo emitir notas fiscais direto do celular enquanto estou no cliente. Incrível!"</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl">🚀</div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">Startup X</p>
                            <p className="text-xs text-slate-500">Tech Company</p>
                        </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">"A integração com o banco é perfeita. O Lumini I.A Mobile é essencial para nós."</p>
                </div>
            </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 py-12">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-10">Perguntas Frequentes</h2>
            <div className="max-w-3xl mx-auto space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">O aplicativo é gratuito?</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Sim! O download é gratuito. Algumas funcionalidades avançadas requerem uma assinatura Premium.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Funciona offline?</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Sim, você pode registrar despesas e visualizar dados em cache mesmo sem internet. A sincronização ocorre quando você se reconectar.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">É seguro?</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Totalmente. Utilizamos criptografia de ponta a ponta e autenticação biométrica para proteger seus dados.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MobileApp;
