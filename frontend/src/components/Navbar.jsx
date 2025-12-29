import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import CustomAlert from './CustomAlert';

const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  
  // Fetch latest user data on mount and route change to ensure plan is up to date
  useEffect(() => {
    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me');
            const freshUser = response.data;
            
            // If plan changed, update state and localStorage
            if (freshUser.plan !== user.plan) {
                // PROTECTION: Don't downgrade UI if local says Premium/Pro but server says Free (likely server lag/error)
                const localIsPaid = ['pro', 'premium', 'agency'].includes(user.plan?.toLowerCase());
                const serverIsFree = freshUser.plan === 'free';

                if (localIsPaid && serverIsFree) {
                    console.warn('Backend returned Free but Local is Paid. Ignoring backend to preserve UX.');
                    return; 
                }

                console.log('Syncing user plan:', freshUser.plan);
                setUser(freshUser);
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...currentUser, ...freshUser }));
            }
        } catch (error) {
            console.error('Failed to sync user data:', error);
        }
    };
    fetchUser();
  }, [location.pathname]); // Run on mount and route change
  const userPlan = user.plan?.toLowerCase() || 'free';
  const isPro = ['pro', 'premium', 'agency'].includes(userPlan);
  const isPremium = ['premium', 'agency'].includes(userPlan);

  // Custom Alert State
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title, message, type = 'info') => {
    setAlertState({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-white/10 sticky top-0 z-50 transition-colors">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center text-xl font-bold text-slate-900 dark:text-white transition-colors">
              ✨ Lumini I.A
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link to="/dashboard" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors">
                {t('sidebar.dashboard')}
              </Link>
              <Link to="/transactions" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors">
                {t('sidebar.transactions')}
              </Link>
              <Link to="/reports" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors">
                {t('sidebar.reports')}
              </Link>
              <Link to="/invoices" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors">
                {t('sidebar.invoices')}
              </Link>
              <Link to="/integrations" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors">
                {t('sidebar.integrations')}
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Switcher moved to Settings */}
            <button 
                onClick={() => {
                    if (isPremium) {
                        showAlert(
                            '🌟 Atendimento Premium',
                            'Seu Gerente Dedicado: **Sofia Martins**\n\n' +
                            '📞 WhatsApp Direto: (11) 99999-8888\n' +
                            '📧 Email: sofia.martins@luminia.com\n\n' +
                            '📅 Consultoria Mensal: Sua próxima reunião está disponível para agendamento.',
                            'success'
                        );
                    } else if (isPro) {
                        showAlert('Suporte Prioritário', 'Como assinante PRO, você tem acesso direto ao nosso time via WhatsApp.\n\nIniciar Chat: +55 (11) 99999-9999', 'success');
                    } else {
                        showAlert('Recurso Premium', 'O Gerente de Conta Dedicado e Consultoria Mensal são exclusivos do plano Premium. Faça o upgrade!', 'locked');
                    }
                }}
                className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
            >
                💬 Support {!isPro && '🔒'}
            </button>
            <Link 
                to="/plans"
                className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg transition-all ${
                  isPro 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/30 hover:shadow-purple-500/50' 
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30 hover:shadow-pink-500/50'
                }`}
            >
                {isPro ? (isPremium ? 'PREMIUM' : 'PRO') : 'UPGRADE'}
            </Link>
            
            <Link to="/settings" className="flex items-center gap-2 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors group">
                <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 group-hover:border-purple-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <span className="text-sm font-medium">{user.username}</span>
            </Link>

            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 absolute w-full transition-colors shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/dashboard" 
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('sidebar.dashboard')}
            </Link>
            <Link 
              to="/transactions" 
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('sidebar.transactions')}
            </Link>
            <Link 
              to="/reports" 
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('sidebar.reports')}
            </Link>
            <Link 
              to="/integrations" 
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('sidebar.integrations')}
            </Link>
            <Link 
              to="/plans" 
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-bold transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              UPGRADE PLAN
            </Link>
          </div>
          <div className="pt-4 pb-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center px-5">
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-slate-900 dark:text-white">{user.username}</div>
                <div className="text-sm font-medium leading-none text-slate-500 dark:text-gray-400 mt-1">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
              >
                {t('sidebar.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
