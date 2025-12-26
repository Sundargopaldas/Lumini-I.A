import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import CustomAlert from './CustomAlert';

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPro = user.plan === 'pro';

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

  const handleTogglePlan = async () => {
    const newPlan = user.plan === 'pro' ? 'free' : 'pro';
    try {
      const response = await api.put('/auth/plan', { plan: newPlan });
      if (response.status === 200) {
        const updatedUser = { ...user, plan: newPlan };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
      showAlert('Error', 'Failed to toggle plan. Check console.', 'error');
    }
  };

  return (
    <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
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
            <Link to="/dashboard" className="flex-shrink-0 flex items-center text-xl font-bold text-white">
              ✨ Lumini I.A
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link to="/dashboard" className="text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-400 transition-colors">
                Dashboard
              </Link>
              <Link to="/transactions" className="text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-400 transition-colors">
                Transactions
              </Link>
              <Link to="/reports" className="text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-400 transition-colors">
                Reports
              </Link>
              <Link to="/integrations" className="text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-400 transition-colors">
                Integrations
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <button 
                onClick={() => {
                    if (isPro) {
                        showAlert('Priority Support', 'As a PRO user, you have direct access to our engineering team via WhatsApp.\n\nStart Chat: +55 (11) 99999-9999', 'success');
                    } else {
                        showAlert('Premium Feature', 'Priority WhatsApp Support is available for PRO users only. Upgrade to unlock!', 'locked');
                    }
                }}
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
                💬 Support {!isPro && '🔒'}
            </button>
            <button 
                onClick={handleTogglePlan}
                className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg transition-all ${
                  user.plan === 'pro' 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-purple-500/50' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Click to toggle plan (Debug)"
            >
              {user.plan === 'pro' ? 'PRO PLAN' : 'FREE PLAN'}
            </button>
            <span className="text-gray-300 text-sm">Hello, {user.username}</span>
            <button 
              onClick={handleLogout}
              className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors backdrop-blur-sm"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
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
        <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/10 absolute w-full">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/dashboard" 
              className="text-gray-300 hover:text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/transactions" 
              className="text-gray-300 hover:text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Transactions
            </Link>
            <Link 
              to="/reports" 
              className="text-gray-300 hover:text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Reports
            </Link>
            <Link 
              to="/integrations" 
              className="text-gray-300 hover:text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Integrações (PRO)
            </Link>
            <Link 
              to="/plans" 
              className="text-yellow-400 hover:text-yellow-300 hover:bg-white/10 block px-3 py-2 rounded-md text-base font-bold"
              onClick={() => setIsMenuOpen(false)}
            >
              UPGRADE PLAN
            </Link>
          </div>
          <div className="pt-4 pb-4 border-t border-white/10">
            <div className="flex items-center px-5">
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-white">{user.username}</div>
                <div className="text-sm font-medium leading-none text-gray-400 mt-1">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-red-300 hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
