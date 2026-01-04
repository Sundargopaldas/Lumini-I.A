import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import TransactionCard from '../components/TransactionCard';
import AddTransactionModal from '../components/AddTransactionModal';
import ImportModal from '../components/ImportModal';
import CustomAlert from '../components/CustomAlert';

const Transactions = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const showAlert = (title, message, type, onConfirm) => setAlertState({ isOpen: true, title, message, type, onConfirm });

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      if (Array.isArray(response.data)) {
        setTransactions(response.data);
      } else {
        console.error('Invalid transactions data:', response.data);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSaveTransaction = async (transactionData) => {
    try {
      if (transactionToEdit) {
        const response = await api.put(`/transactions/${transactionToEdit.id}`, transactionData);
        setTransactions(transactions.map(t => t.id === transactionToEdit.id ? response.data : t));
      } else {
        const response = await api.post('/transactions', transactionData);
        setTransactions([response.data, ...transactions]);
      }
      setIsModalOpen(false);
      setTransactionToEdit(null);
    } catch (error) {
      console.error('Error saving transaction:', error);
      showAlert(t('common.error'), t('transactions.save_error'), 'error');
    }
  };

  const handleEditTransaction = (transaction) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (id) => {
    showAlert(t('transactions.delete_title'), t('transactions.delete_confirm'), 'confirm', async () => {
      try {
        await api.delete(`/transactions/${id}`);
        setTransactions(transactions.filter(t => t.id !== id));
        showAlert(t('common.success'), t('transactions.delete_success'), 'success');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        showAlert(t('common.error'), t('transactions.delete_error'), 'error');
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(null);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const description = transaction.description || '';
    const source = transaction.source || '';
    const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm}
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('transactions.title')}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white dark:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600 flex items-center gap-2"
          >
            <span>📥</span>
            <span className="hidden sm:inline">{t('transactions.import')}</span>
          </button>
          <button
            onClick={() => {
              setTransactionToEdit(null);
              setIsModalOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            <span>+</span>
            {t('transactions.new_transaction')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder={t('transactions.search_placeholder')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 pl-10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 dark:text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[150px] transition-colors"
        >
          <option value="all" className="bg-white dark:bg-gray-900 text-slate-900 dark:text-white">{t('transactions.filter_all')}</option>
          <option value="income" className="bg-white dark:bg-gray-900 text-slate-900 dark:text-white">{t('transactions.filter_income')}</option>
          <option value="expense" className="bg-white dark:bg-gray-900 text-slate-900 dark:text-white">{t('transactions.filter_expense')}</option>
        </select>
      </div>

      <div className="bg-white dark:bg-white/10 backdrop-blur-lg border border-slate-200 dark:border-white/20 sm:rounded-2xl overflow-hidden min-h-[400px] transition-colors">
        {loading ? (
          <div className="p-8 text-center text-slate-400 dark:text-gray-400">{t('common.loading')}</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 dark:text-gray-300 text-lg mb-2">{t('transactions.no_transactions_found')}</p>
            {transactions.length === 0 && (
                <p className="text-slate-400 dark:text-gray-500 text-sm">{t('transactions.start_adding')}</p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                 <TransactionCard 
                    transaction={transaction} 
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                 />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          fetchTransactions();
          showAlert(t('common.success'), t('transactions.import_complete'), 'success');
        }}
      />
      
      <AddTransactionModal
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveTransaction}
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
};

export default Transactions;
