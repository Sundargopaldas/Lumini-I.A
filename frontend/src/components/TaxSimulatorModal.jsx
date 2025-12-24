import React, { useState } from 'react';

const TaxSimulatorModal = ({ isOpen, onClose }) => {
  const [revenue, setRevenue] = useState({ service: 0, commerce: 0 });
  
  if (!isOpen) return null;

  // 2025 MEI Values (Estimated)
  // INSS (5% of min wage R$ 1502) = 75.10
  // ICMS (Commerce) = 1.00
  // ISS (Service) = 5.00
  const INSS = 75.10;
  const ICMS = 1.00;
  const ISS = 5.00;

  const calculateDAS = () => {
    let total = INSS;
    if (revenue.commerce > 0) total += ICMS;
    if (revenue.service > 0) total += ISS;
    return total;
  };

  const totalRevenue = parseFloat(revenue.service) + parseFloat(revenue.commerce);
  const annualProjection = totalRevenue * 12;
  const meiLimit = 81000;
  const isOverLimit = annualProjection > meiLimit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-6">MEI Tax Simulator</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Service Revenue (R$)</label>
            <input 
              type="number" 
              value={revenue.service}
              onChange={(e) => setRevenue({...revenue, service: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Commerce Revenue (R$)</label>
            <input 
              type="number" 
              value={revenue.commerce}
              onChange={(e) => setRevenue({...revenue, commerce: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.00"
            />
          </div>

          <div className="bg-white/5 p-4 rounded-lg space-y-3 mt-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-gray-300">Estimated Monthly DAS:</span>
                <span className="text-xl font-bold text-white">R$ {calculateDAS().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-gray-300">Annual Projection:</span>
                <span className={`font-bold ${isOverLimit ? 'text-red-400' : 'text-green-400'}`}>
                    R$ {annualProjection.toLocaleString()}
                </span>
            </div>
            {isOverLimit && (
                <p className="text-xs text-red-400 mt-2">
                    Warning: You might exceed the MEI annual limit of R$ 81,000. Consider upgrading to ME.
                </p>
            )}
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-all mt-4"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxSimulatorModal;
