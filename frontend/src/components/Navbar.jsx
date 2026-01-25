import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Logo from './Logo';
import CustomAlert from './CustomAlert';
import { getUser, removeToken, removeUser, clearAuth } from '../utils/storage';

const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(getUser() || {});
  
  // Listen to storage changes to update user state
  useEffect(() => {
    const handleStorageChange = () => {
        const storedUser = getUser();
        if (storedUser) {
            setUser(storedUser);
        } else {
            setUser({});
        }
    };
    
    // Listen for storage events (triggered by other tabs or components)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from same tab
    window.addEventListener('userUpdated', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('userUpdated', handleStorageChange);
    };
  }, []); // Run only once on mount
  
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
    clearAuth();
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
        <div className="flex justify-between items-center h-16">
          {/* Logo - Esquerda */}
          <div className="flex-shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white transition-colors">
              <Logo className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="hidden xs:inline sm:inline">Lumini I.A</span>
              <span className="inline xs:hidden sm:hidden">Lumini</span>
            </Link>
          </div>

          {/* Links de Navegação - Centro */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex space-x-6">
            <Link to="/dashboard" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap text-base font-medium">
              {t('sidebar.dashboard')}
            </Link>
            <Link to="/transactions" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap text-base font-medium">
              {t('sidebar.transactions')}
            </Link>
            <Link to="/reports" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap text-base font-medium">
              {t('sidebar.reports')}
            </Link>
            <Link to="/marketplace" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap text-base font-medium">
              {t('sidebar.marketplace')}
            </Link>
            {(user.isAccountant || user.isAdmin) && (
              <Link to="/accountant-dashboard" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap text-base font-medium">
                {t('sidebar.accountant_area')}
              </Link>
            )}
            <Link to="/invoices" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap text-base font-medium">
              {t('sidebar.invoices')}
            </Link>
            <Link to="/integrations" className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap text-base font-medium">
              {t('sidebar.integrations')}
            </Link>
            {user.isAdmin && (
              <Link to="/admin" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 transition-colors whitespace-nowrap font-semibold text-base">
                {t('sidebar.admin')}
              </Link>
            )}
            </div>
          </div>
          
          {/* User Info & Actions - Direita */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {user.username}
            </span>

            <Link 
                to="/settings" 
                className="p-2 text-slate-400 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
                title="Configurações"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </Link>

            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Sair
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
              to="/marketplace" 
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('sidebar.marketplace')}
            </Link>
            {user.isAccountant && (
              <Link 
                to="/accountant-dashboard" 
                className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('sidebar.accountant_area')}
              </Link>
            )}
            <Link 
              to="/invoices" 
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('sidebar.invoices')}
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
                {t('sidebar.admin')}
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
                {t('settings.title')}
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
