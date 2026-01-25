import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const ConsentModal = ({ isOpen, onClose, onAccept, accountantName }) => {
  const [hasConsented, setHasConsented] = useState(false);

  const handleAccept = () => {
    if (hasConsented) {
      onAccept();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-4"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🔒</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-white truncate">Autorização de Acesso</h2>
                  <p className="text-purple-100 text-xs sm:text-sm mt-1">
                    Leia atentamente antes de continuar
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-200px)]">
              {/* Accountant Info */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 mb-6">
                <p className="text-sm text-purple-900 dark:text-purple-100 font-medium">
                  Você está prestes a vincular <strong className="text-purple-700 dark:text-purple-300">{accountantName || 'seu contador'}</strong> à sua conta.
                </p>
              </div>

              {/* Authorization Details */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">📋</span>
                  O que o contador poderá acessar:
                </h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-green-600 dark:text-green-400 text-xl flex-shrink-0">✓</span>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">Todas as suas transações</p>
                      <p className="text-sm text-green-700 dark:text-green-300">Receitas, despesas, categorias e valores</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-green-600 dark:text-green-400 text-xl flex-shrink-0">✓</span>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">Relatórios financeiros completos</p>
                      <p className="text-sm text-green-700 dark:text-green-300">Gráficos, análises e histórico dos últimos 12 meses</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-green-600 dark:text-green-400 text-xl flex-shrink-0">✓</span>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">Exportação de documentos</p>
                      <p className="text-sm text-green-700 dark:text-green-300">Geração de PDFs e relatórios contábeis</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-green-600 dark:text-green-400 text-xl flex-shrink-0">✓</span>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">Documentos compartilhados</p>
                      <p className="text-sm text-green-700 dark:text-green-300">Visualização de documentos enviados entre vocês</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 mb-6 rounded-r-lg">
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <span>ℹ️</span>
                  Informações Importantes:
                </h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                    <span><strong>Sigilo Profissional:</strong> Seus dados são protegidos por sigilo profissional contábil</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                    <span><strong>Acesso Somente Leitura:</strong> O contador NÃO pode alterar, excluir ou modificar suas informações</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                    <span><strong>Você mantém o controle:</strong> Pode desvincular o contador a qualquer momento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                    <span><strong>Finalidade:</strong> Uso exclusivo para serviços contábeis, fiscais e tributários</span>
                  </li>
                </ul>
              </div>

              {/* LGPD Notice */}
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-700 dark:text-slate-300">⚖️ Conformidade com LGPD:</strong> De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), 
                  seus dados pessoais serão tratados exclusivamente para prestação de serviços contábeis. Você pode revogar 
                  esta autorização a qualquer momento através das configurações da sua conta.
                </p>
              </div>

              {/* Consent Checkbox */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={hasConsented}
                    onChange={(e) => setHasConsented(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-2 border-yellow-500 text-yellow-600 focus:ring-2 focus:ring-yellow-500 cursor-pointer"
                  />
                  <span className="text-sm text-yellow-900 dark:text-yellow-100 font-medium group-hover:text-yellow-700 dark:group-hover:text-yellow-200 transition-colors">
                    Li e compreendi todas as informações acima. Autorizo expressamente o acesso do contador aos meus dados 
                    financeiros para fins de prestação de serviços contábeis, fiscais e tributários.
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAccept}
                disabled={!hasConsented}
                className={`flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all ${
                  hasConsented
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className="hidden sm:inline">{hasConsented ? '✓ Confirmar e Vincular' : 'Marque a confirmação acima'}</span>
                <span className="inline sm:hidden">{hasConsented ? '✓ Confirmar' : 'Marque acima'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConsentModal;
