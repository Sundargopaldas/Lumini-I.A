import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const TransactionCard = ({ transaction, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [isEmitting, setIsEmitting] = useState(false);
  const [nfeStatus, setNfeStatus] = useState(transaction.nfeStatus || 'pending');
  const [nfeUrl, setNfeUrl] = useState(transaction.nfeUrl);
  const [nfeAccessKey, setNfeAccessKey] = useState(transaction.nfeAccessKey);
  const [copied, setCopied] = useState(false);

  const handleEmitNfe = async () => {
      setIsEmitting(true);
      try {
          const response = await api.post(`/transactions/${transaction.id}/emit-nfe`);
          setNfeStatus('emitted');
          setNfeUrl(response.data.nfeUrl);
          setNfeAccessKey(response.data.nfeAccessKey);
          // Optional: Notify parent or show toast
      } catch (error) {
          console.error('Failed to emit NF-e', error);
          setNfeStatus('error');
      } finally {
          setIsEmitting(false);
      }
  };

  const copyAccessKey = () => {
      if (nfeAccessKey) {
          navigator.clipboard.writeText(nfeAccessKey);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return (
    <div className="bg-slate-50 dark:bg-white/5 overflow-hidden rounded-lg p-4 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{transaction.date}</p>
            {transaction.source && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30">
                {transaction.source}
              </span>
            )}
            
            {/* NF-e Status Badge */}
            {transaction.type === 'income' && (
                <div className="flex items-center gap-1">
                    {nfeStatus === 'emitted' ? (
                        <>
                            <a href={nfeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:underline">
                                <span>📄</span> {t('transactions.nfe_emitted')}
                            </a>
                            {nfeAccessKey && (
                                <button 
                                    onClick={copyAccessKey}
                                    className="p-0.5 text-slate-400 hover:text-purple-600 dark:text-slate-500 dark:hover:text-purple-400 transition-colors"
                                    title={t('transactions.copy_key')}
                                >
                                    {copied ? (
                                        <span className="text-green-500 text-xs font-bold">✓</span>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 14.5V12m0 0V8.5m0 3.5l-3-3m3 3l3-3" /> {/* Barcode icon approximation */}
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </>
                    ) : (
                       onEdit && ( // Only show button if not in dashboard view (dashboard view usually doesn't pass onEdit)
                           <button 
                                onClick={handleEmitNfe}
                                disabled={isEmitting || nfeStatus === 'error'}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border transition-colors ${
                                    nfeStatus === 'error' 
                                    ? 'bg-red-100 text-red-700 border-red-200 cursor-not-allowed'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-300 dark:hover:bg-slate-600'
                                }`}
                           >
                                {isEmitting ? '...' : (nfeStatus === 'error' ? t('transactions.nfe_error') : t('transactions.emit_nfe'))}
                           </button>
                       )
                    )}
                </div>
            )}
          </div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white break-words">{transaction.description}</p>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          <div className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {transaction.type === 'income' ? '+' : '-'}R$ {Math.abs(transaction.amount).toFixed(2)}
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button 
                  onClick={() => onEdit(transaction)}
                  className="p-1.5 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors"
                  title="Editar"
                >
                  ✎
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={() => onDelete(transaction.id)}
                  className="p-1.5 text-slate-400 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded transition-colors"
                  title="Excluir"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
