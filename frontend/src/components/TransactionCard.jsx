import React from 'react';

const TransactionCard = ({ transaction, onEdit, onDelete }) => {
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
