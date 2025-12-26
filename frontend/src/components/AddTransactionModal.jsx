import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CustomAlert from './CustomAlert';

const incomeSources = ['Hotmart', 'YouTube', 'TikTok', 'Eduzz', 'Monetizze', 'Twitch', 'Patreon', 'Client', 'Other'];
const expenseSources = ['Equipment', 'Software', 'Ads', 'Freelancers', 'Office', 'Education', 'Travel', 'Other'];

const AddTransactionModal = ({ isOpen, onClose, onSave, transactionToEdit }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'income',
    source: '',
    goalId: '',
    isRecurring: false
  });
  const [customSource, setCustomSource] = useState('');
  const [goals, setGoals] = useState([]);
  
  // Custom Alert State
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title, message, type = 'info') => {
    setAlertState({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  // User Plan Check
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPro = user.plan === 'pro';

  useEffect(() => {
    if (isOpen) {
      // Fetch goals to populate dropdown
      api.get('/goals').then(res => setGoals(res.data)).catch(console.error);

      if (transactionToEdit) {
        const isIncome = transactionToEdit.type === 'income';
        const sources = isIncome ? incomeSources : expenseSources;
        const isCustom = !sources.includes(transactionToEdit.source);

        setFormData({
          description: transactionToEdit.description,
          amount: transactionToEdit.amount,
          date: transactionToEdit.date ? transactionToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0],
          type: transactionToEdit.type,
          source: isCustom ? 'Other' : transactionToEdit.source,
          goalId: transactionToEdit.goalId || '',
          isRecurring: transactionToEdit.isRecurring || false
        });
        
        if (isCustom) {
          setCustomSource(transactionToEdit.source);
        } else {
          setCustomSource('');
        }
      } else {
        setFormData({
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          type: 'income',
          source: '',
          goalId: '',
          isRecurring: false
        });
        setCustomSource('');
      }
    }
  }, [isOpen, transactionToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    // Check Pro features
    if (e.target.name === 'isRecurring' && !isPro) {
        showAlert('Premium Feature', 'Recurring transactions are available for PRO users only. Upgrade to unlock!', 'locked');
        return;
    }

    setFormData({ ...formData, [e.target.name]: value });
    
    if (e.target.name === 'type') {
      setCustomSource(''); // Reset custom source when switching types
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const finalSource = formData.source === 'Other' ? customSource : formData.source;
    
    if (formData.source === 'Other' && !customSource.trim()) {
        alert('Please enter a custom source/category');
        return;
    }

    onSave({ 
      ...formData, 
      source: finalSource,
      goalId: formData.goalId || null
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header - Fixed at top */}
        <div className="p-6 pb-2 flex justify-between items-center shrink-0">
            <h2 className="text-2xl font-bold text-white">
                {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors bg-white/10 rounded-full p-2"
            >
              ✕
            </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 pt-2 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="income" 
                  checked={formData.type === 'income'} 
                  onChange={handleChange}
                  className="form-radio text-purple-600 focus:ring-purple-500"
                />
                <span className="text-white">Income</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="expense" 
                  checked={formData.type === 'expense'} 
                  onChange={handleChange}
                  className="form-radio text-red-500 focus:ring-red-500"
                />
                <span className="text-white">Expense</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Description</label>
            <input 
              type="text" 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Amount (R$)</label>
            <input 
              type="number" 
              name="amount" 
              value={formData.amount} 
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Date</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              {formData.type === 'income' ? 'Source' : 'Category'}
            </label>
            <select 
              name="source" 
              value={formData.source} 
              onChange={handleChange}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select...</option>
              {(formData.type === 'income' ? incomeSources : expenseSources).map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
              <option value="Other">Other (Custom)</option>
            </select>
          </div>

          {formData.source === 'Other' && (
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-1">Custom Name</label>
               <input 
                  type="text" 
                  value={customSource} 
                  onChange={(e) => setCustomSource(e.target.value)}
                  required
                  placeholder="e.g. Dividendos, Uber, etc."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>
          )}

          {goals.length > 0 && (
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Link to Goal (Optional)
                </label>
                <select 
                    name="goalId" 
                    value={formData.goalId} 
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">None</option>
                    {goals.map(goal => (
                        <option key={goal.id} value={goal.id}>
                            {goal.name} (Current: R$ {parseFloat(goal.currentAmount).toLocaleString()})
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                    If selected, this amount will be added to the goal's progress.
                </p>
            </div>
          )}

          <div>
            <label className={`flex items-center space-x-2 cursor-pointer bg-slate-800 p-3 rounded-lg border transition-colors ${!isPro ? 'border-slate-700 opacity-75' : 'border-slate-700 hover:border-purple-500'}`}>
              <input 
                type="checkbox" 
                name="isRecurring" 
                checked={formData.isRecurring} 
                onChange={handleChange}
                className="form-checkbox text-purple-600 focus:ring-purple-500 w-5 h-5 rounded"
              />
              <div className="flex-1">
                 <span className="text-white font-medium block">Monthly Recurring</span>
                 {!isPro && <span className="text-xs text-purple-400 font-bold flex items-center gap-1">🔒 PRO Feature</span>}
                 {isPro && <span className="text-xs text-green-400 font-bold">Enabled</span>}
              </div>
            </label>
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all mt-4"
          >
            Save Transaction
          </button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
