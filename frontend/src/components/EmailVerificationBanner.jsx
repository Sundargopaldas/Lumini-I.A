import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

const EmailVerificationBanner = ({ email, onResend }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await api.post('/auth/resend-verification', { email });
      setSuccess(true);
      setMessage('✅ Email reenviado! Verifique sua caixa de entrada.');
      if (onResend) onResend();
    } catch (error) {
      setSuccess(false);
      setMessage(error.response?.data?.message || '❌ Erro ao reenviar email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 rounded-lg shadow-md mb-6"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            📧 Confirme seu Email
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              Enviamos um email de confirmação para <strong>{email}</strong>.
              <br />
              Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
            </p>
          </div>
          
          {message && (
            <div className={`mt-3 text-sm ${success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {message}
            </div>
          )}
          
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleResend}
              disabled={loading}
              className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 underline disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Reenviar Email'}
            </button>
            
            <a
              href={`https://${email.split('@')[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 underline"
            >
              Abrir Email →
            </a>
          </div>
        </div>
        
        <div className="ml-auto pl-3">
          <div className="text-yellow-500 dark:text-yellow-400">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmailVerificationBanner;
