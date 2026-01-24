import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import CustomAlert from '../components/CustomAlert';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { trackSignup, trackError } from '../utils/analytics';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    
    // Validar username (apenas letras e números, sem espaços)
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(formData.username)) {
      showAlert('Erro', 'O nome de usuário deve conter apenas letras e números, sem espaços.', 'error');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      showAlert('Erro', 'As senhas não coincidem.', 'error');
      return;
    }

    try {
      console.log('🚀 [REGISTER] Iniciando cadastro...', {
        username: formData.username,
        email: formData.email
      });
      
      const response = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      console.log('✅ [REGISTER] Cadastro realizado com sucesso!', response.data);
      
      // Track signup success no GA4
      trackSignup('email');
      
      const emailSent = response.data.emailSent !== false;
      const emailError = response.data.emailError;
      
      if (emailSent) {
        showAlert('Sucesso', 'Cadastro realizado! Verifique seu email para confirmar sua conta.', 'success');
      } else {
        showAlert('Atenção', 'Cadastro realizado, mas não foi possível enviar o email. Use o botão "Reenviar Email" na próxima tela.', 'warning');
      }
      
      setTimeout(() => {
        navigate('/check-email', { 
          state: { 
            email: formData.email,
            emailSent: emailSent,
            emailError: emailError
          } 
        });
      }, 2000);
    } catch (error) {
      console.error('❌ [REGISTER] Registration failed:', error);
      console.error('❌ [REGISTER] Error response:', error.response?.data);
      console.error('❌ [REGISTER] Error details:', error.response?.data?.details);
      console.error('❌ [REGISTER] Error status:', error.response?.status);
      console.error('❌ [REGISTER] Full error object:', JSON.stringify(error, null, 2));
      
      // Track signup error no GA4
      trackError(`Registration Error: ${error.response?.data?.message || 'Unknown'}`, 'warning');
      
      // Se houver erros de validação de senha
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorTitle = error.response.data.message || 'Senha Insegura';
        // Garantir que todos os erros sejam strings
        const errorList = error.response.data.errors
          .map(err => typeof err === 'string' ? err : err.message || String(err))
          .join('\n• ');
        const fullMessage = `• ${errorList}\n\nForça da senha: ${error.response.data.strength || 0}%`;
        showAlert(errorTitle, fullMessage, 'error');
      } else if (error.response?.data?.message) {
        // Mostrar mensagem específica do backend
        const details = error.response.data.details ? `\n\nDetalhes: ${error.response.data.details}` : '';
        showAlert('Erro no Cadastro', `${error.response.data.message}${details}`, 'error');
      } else if (error.message === 'Network Error') {
        showAlert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua internet.', 'error');
      } else {
        showAlert('Erro no Cadastro', 'Falha ao cadastrar. Verifique os dados e tente novamente.', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-white/20 transition-colors">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 mt-6">
            <Logo className="w-10 h-10" />
            <h2 className="text-center text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
              Lumini I.A
            </h2>
          </div>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-gray-300 transition-colors">
            Clareza financeira para empreendedores.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">Nome de usuário</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-400 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-all duration-200"
                placeholder="Nome de usuário"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Endereço de email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
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
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-400 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-all duration-200"
                placeholder="Senha"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <PasswordStrengthIndicator password={formData.password} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirmar senha</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 placeholder-slate-400 dark:placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-all duration-200"
                placeholder="Confirmar senha"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-purple-200 dark:shadow-none"
            >
              Criar Conta
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
            <p className="text-sm text-slate-600 dark:text-gray-300 transition-colors">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-medium text-purple-600 dark:text-purple-300 hover:text-purple-500 dark:hover:text-purple-200 transition-colors">
                Fazer login
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

export default Register;
