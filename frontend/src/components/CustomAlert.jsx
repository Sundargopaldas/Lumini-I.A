import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CustomAlert = ({ isOpen, onClose, title, message, type = 'info', onConfirm, confirmText, cancelText }) => {
  const { t } = useTranslation();

  const finalConfirmText = confirmText || t('common.confirm');
  const finalCancelText = cancelText || t('common.cancel');
  
  useEffect(() => {
    if (isOpen && !onConfirm) {
      // Auto-close after 3 seconds for success messages only if it's not a confirmation dialog
      if (type === 'success') {
        const timer = setTimeout(() => {
          onClose();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, type, onClose, onConfirm]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'locked': return '🔒';
      case 'confirm': return '❓';
      default: return 'ℹ️';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-200';
      case 'error': return 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-200';
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-200';
      case 'locked': return 'border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-200';
      case 'confirm': return 'border-blue-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-white';
      default: return 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-sm rounded-xl border p-6 shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 ${getColors()}`}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="text-4xl">{getIcon()}</div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold">{title}</h3>
            <div className="text-sm opacity-90 whitespace-pre-line break-words">{message}</div>
          </div>

          <div className="flex gap-3 w-full mt-4">
            {onConfirm ? (
                <>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors font-semibold text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white"
                    >
                        {finalCancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors font-semibold text-sm text-white shadow-lg shadow-purple-500/20"
                    >
                        {finalConfirmText}
                    </button>
                </>
            ) : (
                <button
                    onClick={onClose}
                    className="w-full py-2 px-4 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors font-semibold text-sm text-slate-700 dark:text-white"
                >
                    {type === 'locked' ? t('common.understood') : t('common.close')}
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
