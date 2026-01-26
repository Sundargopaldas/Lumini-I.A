import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import CustomAlert from '../components/CustomAlert';
import ConsentModal from '../components/ConsentModal';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { trackSignup, trackError } from '../utils/analytics';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [inviteToken, setInviteToken] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [hasGivenConsent, setHasGivenConsent] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Extrair token de convite da URL e validar
  useEffect(() => {
    const token = searchParams.get('invite');
    if (token) {
      setInviteToken(token);
      
      // Buscar informações do convite
      const validateInvite = async () => {
        try {
          const response = await api.get(`/accountants/validate-invite/${token}`);
          
          if (response.data.valid) {
            setInviteInfo({
              message: '🎉 Você foi convidado por seu contador! Complete o cadastro para começar.',
              accountantName: response.data.accountantName
            });
            
            // Preencher email automaticamente
            if (response.data.email) {
              setFormData(prev => ({ ...prev, email: response.data.email }));
            }
            
            console.log(`✅ [REGISTER] Convite válido de: ${response.data.accountantName}`);
          } else {
            showAlert('Aviso', response.data.message || 'Convite inválido', 'warning');
            setInviteToken(null);
          }
        } catch (error) {
          console.error('❌ [REGISTER] Erro ao validar convite:', error);
          showAlert('Erro', 'Não foi possível validar o convite', 'error');
          setInviteToken(null);
        }
      };
      
      validateInvite();
    }
  }, [searchParams]);

  const showAlert = (title, message, type = 'info') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleConsentAccept = () => {
    setHasGivenConsent(true);
    setShowConsentModal(false);
    // Trigger o submit do formulário novamente
    const form = document.getElementById('register-form');
    if (form) {
      form.requestSubmit();
    }
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

    // Se há convite e usuário ainda não deu consentimento, mostrar modal
    if (inviteToken && !hasGivenConsent) {
      setShowConsentModal(true);
      return;
    }

    try {
      console.log('🚀 [REGISTER] Iniciando cadastro...', {
        username: formData.username,
        email: formData.email
      });
      
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };
      
      // Incluir token de convite se existir
      if (inviteToken) {
        payload.inviteToken = inviteToken;
        console.log('📧 [REGISTER] Registrando com convite de contador');
      }
      
      const response = await api.post('/auth/register', payload);
      
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

        {/* Banner de Convite */}
        {inviteInfo && (
          <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-purple-900/30 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  Convite Especial
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  {inviteInfo.message}
                </p>
                {inviteInfo.accountantName && (
                  <p className="text-xs text-purple-600 dark:text-purple-200 mt-1 font-medium">
                    Contador: {inviteInfo.accountantName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form id="register-form" className="mt-8 space-y-6" onSubmit={handleSubmit}>
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

          {/* Checkbox de Aceitação de Termos */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="accept-terms"
                name="accept-terms"
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-300 rounded cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="accept-terms" className="text-slate-600 dark:text-gray-300 cursor-pointer">
                Eu li e aceito os{' '}
                <Link 
                  to="/terms" 
                  target="_blank"
                  className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 hover:underline"
                >
                  Termos de Uso
                </Link>
                {' '}e a{' '}
                <Link 
                  to="/privacy" 
                  target="_blank"
                  className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 hover:underline"
                >
                  Política de Privacidade
                </Link>
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!acceptedTerms}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 transform shadow-lg ${
                acceptedTerms 
                  ? 'bg-purple-600 hover:bg-purple-700 hover:scale-[1.02] shadow-purple-200 dark:shadow-none cursor-pointer' 
                  : 'bg-slate-400 cursor-not-allowed opacity-60'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
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

      {/* Consent Modal for Accountant Link */}
      <ConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onAccept={handleConsentAccept}
        accountantName={inviteInfo?.accountantName || 'seu contador'}
      />
    </div>
  );
};

export default Register;
