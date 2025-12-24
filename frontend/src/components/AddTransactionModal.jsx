import React, { useState, useEffect } from 'react';

const incomeSources = ['Hotmart', 'YouTube', 'TikTok', 'Eduzz', 'Monetizze', 'Twitch', 'Patreon', 'Client', 'Other'];
const expenseSources = ['Equipment', 'Software', 'Ads', 'Freelancers', 'Office', 'Education', 'Travel', 'Other'];

const AddTransactionModal = ({ isOpen, onClose, onSave, transactionToEdit }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'income',
    source: ''
  });
  const [customSource, setCustomSource] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        const isIncome = transactionToEdit.type === 'income';
        const sources = isIncome ? incomeSources : expenseSources;
        const isCustom = !sources.includes(transactionToEdit.source);

        setFormData({
          description: transactionToEdit.description,
          amount: transactionToEdit.amount,
          date: transactionToEdit.date ? transactionToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0],
          type: transactionToEdit.type,
          source: isCustom ? 'Other' : transactionToEdit.source
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
          source: ''
        });
        setCustomSource('');
      }
    }
  }, [isOpen, transactionToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    onSave({ ...formData, source: finalSource });
    
    // Reset form is handled by useEffect when modal opens/closes or by parent, 
    // but good to clear here if we want to add multiple? No, modal closes.
    // We can just close.
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-6">
            {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="income" 
                  checked={formData.type === 'income'} 
                  onChange={handleChange}
                  className="form-radio text-purple-600 focus:ring-purple-600 bg-white/10 border-white/20"
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
                  className="form-radio text-red-500 focus:ring-red-500 bg-white/10 border-white/20"
                />
                <span className="text-white">Expense</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <input 
              type="text" 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-500"
              placeholder="e.g. AdSense Payment"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Amount (R$)</label>
              <input 
                type="number" 
                name="amount" 
                value={formData.amount} 
                onChange={handleChange}
                required
                step="0.01"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
                {formData.type === 'income' ? 'Income Source' : 'Expense Category'}
            </label>
            <select 
              name="source" 
              value={formData.source} 
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all mb-2"
            >
              <option value="" disabled className="bg-slate-800">
                  Select {formData.type === 'income' ? 'Source' : 'Category'}
              </option>
              {formData.type === 'income' ? (
                incomeSources.map(source => (
                  <option key={source} value={source} className="bg-slate-800">{source}</option>
                ))
              ) : (
                expenseSources.map(source => (
                  <option key={source} value={source} className="bg-slate-800">{source}</option>
                ))
              )}
            </select>
            
            {formData.source === 'Other' && (
                <input 
                  type="text" 
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder={formData.type === 'income' ? "Enter custom source..." : "Enter custom category..."}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-500 animate-fadeIn"
                  required
                />
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/30 mt-4"
          >
            {transactionToEdit ? 'Update Transaction' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
