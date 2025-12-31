import React from 'react';

const MobileApp = () => {
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
              Leve o Lumini I.A no seu bolso
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Gerencie suas finanças, emita notas fiscais e acompanhe seus ganhos de onde estiver. 
              Disponível para iOS e Android.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 384 512" fill="currentColor" className="w-6 h-6">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 46.9 126.7 98 126.7 32.3 0 52.8-21.8 82.4-21.8 28.2 0 52.7 21.8 89.6 21.8 36.4 0 65.6-79.5 83.5-127.1 9.9-25.2 21.3-53.8 21.3-53.8-38.3-26.6-64-70.2-64.5-113.8zM240 76.9c16.3-25.3 16.8-57.3 5.4-80.9-28.7 5.2-60.8 26.8-77.9 55.4-15.5 25.4-21.1 57.1-8.5 78.4 29.8 4.7 63.8-22.1 81-52.9z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs">Baixar na</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </button>

              <button className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 512 512" fill="currentColor" className="w-6 h-6">
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs">DISPONÍVEL NO</div>
                  <div className="text-sm font-bold">Google Play</div>
                </div>
              </button>
            </div>

            <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Breve: Notificações em Tempo Real</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Seja notificado instantaneamente quando receber um pagamento ou quando uma nota fiscal for emitida.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <img 
              src="https://cdn.dribbble.com/users/1615584/screenshots/15710334/media/3c23075252873d611849d479374092b7.jpg?resize=1000x750&vertical=center" 
              alt="App Mobile Mockup" 
              className="relative z-10 rounded-3xl shadow-2xl border-4 border-white dark:border-slate-800 mx-auto max-w-sm w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileApp;
