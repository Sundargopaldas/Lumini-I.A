import { useState, useEffect } from 'react';
import api from '../services/api';
import TransactionCard from '../components/TransactionCard';
import AddTransactionModal from '../components/AddTransactionModal';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

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
      alert('Failed to save transaction');
    }
  };

  const handleEditTransaction = (transaction) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/transactions/${id}`);
        setTransactions(transactions.filter(t => t.id !== id));
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(null);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          transaction.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <h1 className="text-3xl font-bold text-white">Transactions</h1>
        <button 
          onClick={() => {
            setTransactionToEdit(null);
            setIsModalOpen(true);
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 font-medium w-full sm:w-auto"
        >
          + Add Transaction
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[150px]"
        >
          <option value="all" className="bg-gray-900 text-white">All Types</option>
          <option value="income" className="bg-gray-900 text-white">Income</option>
          <option value="expense" className="bg-gray-900 text-white">Expense</option>
        </select>
      </div>

      <div className="bg-white/10 backdrop-blur-lg border border-white/20 sm:rounded-2xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-300 text-lg mb-2">No transactions found matching your criteria.</p>
            {transactions.length === 0 && (
                <p className="text-gray-500 text-sm">Start by adding your first income or expense.</p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className="p-4 hover:bg-white/5 transition-colors">
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
