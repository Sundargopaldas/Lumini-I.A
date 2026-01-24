import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import CustomAlert from '../components/CustomAlert';
import { trackLogin, trackError } from '../utils/analytics';
import { setToken, setUser } from '../utils/storage';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title, message, type = 'info') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log('Tentando logar...', formData.email);
    
    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      // Save token and user to storage (com tratamento de erros)
      const tokenSaved = setToken(response.data.token);
      const userSaved = setUser(response.data.user);
      
      if (!tokenSaved || !userSaved) {
        console.warn('⚠️ Não foi possível salvar dados no storage (Tracking Prevention pode estar ativo)');
        // Continua mesmo assim, pois o token está na resposta
      }

      // Track login success no GA4
      trackLogin('email');

      // Redirect baseado no tipo de usuário
      if (response.data.user.isAccountant) {
        navigate('/accountant-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      // Check if it's email not verified error
      if (error.response?.data?.error === 'EMAIL_NOT_VERIFIED') {
        const email = error.response.data.email;
        showAlert(
          'Confirme seu email!',
          `Enviamos um email de confirmação para ${email}.\n\nPor favor, verifique sua caixa de entrada e clique no link de confirmação.\n\nNão recebeu? Verifique sua pasta de SPAM ou clique em "Reenviar Email".`,
          'warning'
        );
        
        // Redirecionar para página de check email
        setTimeout(() => {
          navigate('/check-email', { state: { email } });
        }, 3000);
        
        trackError('Login Error: Email not verified', 'warning');
        setLoading(false);
        return;
      }
      
      let msg = error.response?.data?.message || 'Falha no login.';
      if (error.message === 'Network Error') {
          msg = 'Erro de conexão com o servidor. Verifique sua internet ou tente novamente mais tarde.';
      }
      
      // Track login error no GA4
      trackError(`Login Error: ${msg}`, 'warning');
      
      showAlert('Erro no Login', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-white/20 transition-colors">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mt-6 flex items-center justify-center gap-3">
            <Logo className="w-12 h-12" />
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
              Lumini I.A
            </h2>
          </div>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-gray-300 transition-colors">
            Clareza financeira para empreendedores.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="sr-only">Endereço de email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="off"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-400 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-all duration-200"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="off"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-400 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-all duration-200"
                placeholder="Senha"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-gray-300 transition-colors">
                Lembrar-me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-purple-600 dark:text-purple-300 hover:text-purple-500 dark:hover:text-purple-200 transition-colors">
                Esqueceu a senha?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading ? 'bg-purple-800 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-purple-200 dark:shadow-none`}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {!loading && (
                  <svg className="h-5 w-5 text-purple-300 group-hover:text-purple-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
                {loading && (
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
              </span>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-slate-600 dark:text-gray-300 transition-colors">
            Ainda não tem conta?{' '}
            <Link to="/register" className="font-medium text-purple-600 dark:text-purple-300 hover:text-purple-500 dark:hover:text-purple-200 transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
      <CustomAlert 
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
};

export default Login;
