import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const VerifyEmail = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        console.log('🔍 Verificando email com token:', token);
        const response = await api.get(`/auth/verify-email/${token}`);
        console.log('✅ Verificação bem-sucedida:', response.data);
        
        if (response.data.alreadyVerified) {
          setAlreadyVerified(true);
        } else {
          setSuccess(true);
        }
        
        // Redirecionar para login após 5 segundos
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } catch (err) {
        console.error('❌ Erro ao verificar email:', err);
        setError(err.response?.data?.message || 'Erro ao verificar email');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-white/20 transition-colors">
        <div className="text-center">
          {loading && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                Verificando seu email...
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-gray-300 transition-colors">
                Aguarde um momento enquanto confirmamos seu cadastro.
              </p>
            </>
          )}

          {success && (
            <>
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                Email Verificado! ✅
              </h2>
              <div className="mt-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-500/50 text-green-700 dark:text-green-300 px-4 py-3 rounded">
                <p className="font-medium">Seu email foi confirmado com sucesso!</p>
                <p className="mt-2 text-sm">Você já pode fazer login e aproveitar todos os recursos do Lumini I.A.</p>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-gray-300">
                Redirecionando para a página de login em 5 segundos...
              </p>
            </>
          )}

          {alreadyVerified && (
            <>
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                Email Já Verificado
              </h2>
              <div className="mt-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-500/50 text-blue-700 dark:text-blue-300 px-4 py-3 rounded">
                <p className="font-medium">Seu email já foi verificado anteriormente.</p>
                <p className="mt-2 text-sm">Você já pode fazer login normalmente.</p>
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-gray-300">
                Redirecionando para a página de login em 5 segundos...
              </p>
            </>
          )}

          {error && (
            <>
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                Erro na Verificação
              </h2>
              <div className="mt-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                <p className="font-medium">{error}</p>
                <p className="mt-2 text-sm">O link pode ter expirado ou já foi utilizado.</p>
              </div>
            </>
          )}
        </div>

        {!loading && (
          <div className="text-center mt-6">
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center w-full px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg shadow-purple-200 dark:shadow-none"
            >
              Ir para o Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
