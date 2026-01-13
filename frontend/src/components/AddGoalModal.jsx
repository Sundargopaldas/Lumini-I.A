import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const COLORS = [
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

const AddGoalModal = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    color: COLORS[0],
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
    });
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      color: COLORS[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative transition-colors">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 transition-colors">{t('goals.add_goal_title')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">{t('goals.goal_name')}</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              required
              placeholder={t('goals.placeholder_name')}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">{t('goals.target_amount')}</label>
                <input 
                type="number" 
                name="targetAmount" 
                value={formData.targetAmount} 
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">{t('goals.current_amount')}</label>
                <input 
                type="number" 
                name="currentAmount" 
                value={formData.currentAmount} 
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 transition-colors">{t('goals.deadline')}</label>
            <input 
              type="date" 
              name="deadline" 
              value={formData.deadline} 
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 transition-colors">{t('goals.color')}</label>
            <div className="flex gap-2 flex-wrap">
                {COLORS.map(color => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({...formData, color})}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all mt-4"
          >
            {t('goals.create_btn')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;
