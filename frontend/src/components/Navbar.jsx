import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Logo from './Logo';
import CustomAlert from './CustomAlert';

const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  
  // Fetch latest user data on mount and route change to ensure plan is up to date
  useEffect(() => {
    // Proteção: verificar se location e pathname existem antes de usar
    if (!location || !location.pathname) {
      console.warn('Navbar: location ou pathname undefined, pulando fetchUser');
      return;
    }
    
    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me');
            const freshUser = response.data;
            
            // Check for plan changes or accountant status updates
            const planChanged = freshUser.plan !== user.plan;
            const accountantStatusChanged = freshUser.isAccountant !== user.isAccountant;

            if (planChanged || accountantStatusChanged) {
                // PROTECTION: Don't downgrade UI if local says Premium/Pro but server says Free (likely server lag/error)
                const localIsPaid = ['pro', 'premium', 'agency'].includes(user.plan?.toLowerCase());
                const serverIsFree = freshUser.plan === 'free';

                if (planChanged && localIsPaid && serverIsFree) {
                    console.warn('Backend returned Free but Local is Paid. Ignoring backend to preserve UX.');
                    return; 
                }

                console.log('Syncing user data:', { plan: freshUser.plan, isAccountant: freshUser.isAccountant });
                setUser(prev => ({ ...prev, ...freshUser }));
                
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...currentUser, ...freshUser }));
            }
        } catch (error) {
            console.error('Failed to sync user data:', error);
        }
    };
    fetchUser();
  }, [location?.pathname]); // Run on mount and route change (com optional chaining)
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
            <Link to="/dashboard" className="flex-shrink-0 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white transition-colors">
          <Logo className="w-8 h-8" />
          <span>Lumini I.A</span>
        </Link>
            <div className="hidden xl:ml-6 xl:flex xl:space-x-6">
            <Link to="/dashboard" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap">
              {t('sidebar.dashboard')}
            </Link>
            <Link to="/transactions" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap">
              {t('sidebar.transactions')}
            </Link>
            <Link to="/reports" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap">
              {t('sidebar.reports')}
            </Link>
            <Link to="/marketplace" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap">
              Marketplace
            </Link>
            {user.isAccountant && (
              <Link to="/accountant-dashboard" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap">
                Área do Contador
              </Link>
            )}
            <Link to="/invoices" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap">
              Notas Fiscais
            </Link>
            <Link to="/integrations" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap">
              {t('sidebar.integrations')}
            </Link>
            {user.isAdmin && (
              <Link to="/admin" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap font-medium">
                Admin
              </Link>
            )}
          </div>
          </div>
          
          <div className="hidden xl:flex items-center gap-4">
            {/* Plan Badge removed to reduce clutter as requested */}
            
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {user.username}
            </span>

            <Link 
                to="/settings" 
                className="p-2 text-slate-400 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
                title={t('settings.title') || 'Configurações'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </Link>

            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center xl:hidden">
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
        <div className="xl:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 absolute w-full transition-colors shadow-lg">
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
              to="/marketplace" 
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Marketplace
            </Link>
            <Link 
              to="/accountant-dashboard" 
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Área do Contador
            </Link>
            <Link 
              to="/invoices" 
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Notas Fiscais
            </Link>
            <Link 
              to="/integrations" 
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('sidebar.integrations')}
            </Link>
            {user.isAdmin && (
              <Link 
                to="/admin" 
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Painel Admin
              </Link>
            )}
          </div>
          <div className="pt-4 pb-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center px-5">
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-slate-900 dark:text-white">{user.username}</div>
                <div className="text-sm font-medium leading-none text-slate-500 dark:text-gray-400 mt-1">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                to="/settings"
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Configurações
              </Link>
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
