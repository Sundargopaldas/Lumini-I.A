import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import EmailVerificationBanner from '../components/EmailVerificationBanner';

const CheckEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const emailSent = location.state?.emailSent !== false; // Default true
  const emailError = location.state?.emailError;

  // Se não tem email no state, redireciona para login
  if (!email) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Verifique seu Email
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Falta só mais um passo para começar!
          </p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-white/20"
        >
          {/* Aviso se email não foi enviado */}
          {!emailSent && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    ⚠️ Email não foi enviado automaticamente
                  </h3>
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    Não foi possível enviar o email de confirmação automaticamente.
                    {emailError && <span className="block mt-1">Erro: {emailError}</span>}
                    <br />
                    <strong>Use o botão "Reenviar Email" abaixo para tentar novamente.</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Email Banner */}
          <EmailVerificationBanner email={email} />

          {/* Instructions */}
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
              <span className="text-2xl">📧</span>
              <div>
                <h3 className="font-semibold">1. Abra seu email</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enviamos uma mensagem para <strong>{email}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
              <span className="text-2xl">🔗</span>
              <div>
                <h3 className="font-semibold">2. Clique no link de confirmação</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  O email contém um botão azul "Confirmar meu Email"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
              <span className="text-2xl">✅</span>
              <div>
                <h3 className="font-semibold">3. Faça login e aproveite!</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Após confirmar, você poderá acessar sua conta
                </p>
              </div>
            </div>
          </div>

          {/* Help Box */}
          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Não recebeu o email?</strong>
              <br />
              • Verifique sua pasta de SPAM
              <br />
              • Aguarde alguns minutos
              <br />
              • Use o botão "Reenviar Email" acima
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg shadow-purple-200 dark:shadow-none"
            >
              Ir para o Login
            </Link>
            
            <Link
              to="/register"
              className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200"
            >
              Voltar
            </Link>
          </div>
        </motion.div>

        {/* Footer Note */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          O link de confirmação expira em 24 horas
        </p>
      </div>
    </div>
  );
};

export default CheckEmail;
