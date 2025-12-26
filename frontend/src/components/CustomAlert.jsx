import React, { useEffect } from 'react';

const CustomAlert = ({ isOpen, onClose, title, message, type = 'info' }) => {
  useEffect(() => {
    if (isOpen) {
      // Auto-close after 3 seconds for success messages
      if (type === 'success') {
        const timer = setTimeout(() => {
          onClose();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, type, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'locked': return '🔒';
      default: return 'ℹ️';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'border-green-500/50 bg-green-500/10 text-green-200';
      case 'error': return 'border-red-500/50 bg-red-500/10 text-red-200';
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200';
      case 'locked': return 'border-purple-500/50 bg-purple-500/10 text-purple-200';
      default: return 'border-blue-500/50 bg-blue-500/10 text-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-sm rounded-xl border p-6 shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 bg-slate-900 ${getColors()}`}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="text-4xl">{getIcon()}</div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-sm opacity-90">{message}</p>
          </div>

          <button
            onClick={onClose}
            className="mt-2 w-full py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-semibold text-sm"
          >
            {type === 'locked' ? 'Understand' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
