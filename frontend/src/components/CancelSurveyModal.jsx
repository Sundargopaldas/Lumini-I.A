import React, { useState } from 'react';

const CancelSurveyModal = ({ isOpen, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const reasons = [
    "Preço muito alto",
    "Não estou usando o suficiente",
    "Encontrei outra solução",
    "Falta de recursos",
    "Outro motivo"
  ];

  const handleSubmit = () => {
    const finalReason = reason === 'Outro motivo' ? customReason : reason;
    if (!finalReason) {
        return;
    }
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-white/10 p-6 shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 bg-slate-900">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Poxa, que pena! 😢</h3>
            <p className="text-gray-400 text-sm">
              Conta pra gente o motivo do cancelamento? Sua opinião é muito importante para melhorarmos.
            </p>
          </div>

          <div className="space-y-2 mt-4">
            {reasons.map((r) => (
              <label key={r} className="flex items-center space-x-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="cancelReason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.target.value)}
                  className="form-radio text-purple-600 focus:ring-purple-500 bg-transparent border-gray-500"
                />
                <span className="text-gray-300 text-sm">{r}</span>
              </label>
            ))}
          </div>

          {reason === 'Outro motivo' && (
            <textarea
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none"
              rows="3"
              placeholder="Digite o motivo..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-semibold text-sm text-gray-300"
            >
              Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !reason || (reason === 'Outro motivo' && !customReason)}
              className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 transition-colors font-semibold text-sm text-white shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
              ) : (
                  'Confirmar Cancelamento'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelSurveyModal;
