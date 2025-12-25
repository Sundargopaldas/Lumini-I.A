import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AddGoalModal from './AddGoalModal';

const GoalsWidget = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchGoals = async () => {
    try {
      const response = await api.get('/goals');
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async (goalData) => {
    try {
      await api.post('/goals', goalData);
      fetchGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Failed to add goal');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  if (loading) return <div className="animate-pulse bg-white/5 h-40 rounded-2xl"></div>;

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Financial Goals</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
        >
          <span>+</span> Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="mb-2">No goals set yet.</p>
          <p className="text-sm">Start saving for your dreams!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
          {goals.map((goal) => {
            const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            return (
              <div key={goal.id} className="bg-black/20 p-4 rounded-xl border border-white/5 group relative">
                 <button 
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Goal"
                 >
                    ✕
                 </button>

                 <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }}></div>
                        <h3 className="font-semibold text-white">{goal.name}</h3>
                    </div>
                    <span className="text-sm text-gray-300">
                        R$ {parseFloat(goal.currentAmount).toLocaleString()} / {parseFloat(goal.targetAmount).toLocaleString()}
                    </span>
                 </div>
                 
                 <div className="w-full bg-slate-700/50 rounded-full h-2.5 mb-2 overflow-hidden">
                    <div 
                        className="h-2.5 rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%`, backgroundColor: goal.color }}
                    ></div>
                 </div>
                 
                 <div className="flex justify-between text-xs text-gray-400">
                    <span>{percentage.toFixed(1)}% achieved</span>
                    {goal.deadline && (
                        <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                    )}
                 </div>
              </div>
            );
          })}
        </div>
      )}

      <AddGoalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddGoal} 
      />
    </div>
  );
};

export default GoalsWidget;
