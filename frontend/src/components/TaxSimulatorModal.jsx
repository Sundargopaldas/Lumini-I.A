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

  // Advanced Mode State
  const [mode, setMode] = useState('mei'); // 'mei' or 'simples'
  const [anexo, setAnexo] = useState('III'); // 'III' or 'V' for Simples Nacional

  const calculateDAS = () => {
    if (mode === 'mei') {
        let total = INSS;
        if (revenue.commerce > 0) total += ICMS;
        if (revenue.service > 0) total += ISS;
        return total;
    } else {
        // Simples Nacional Logic (Simplified)
        // Anexo III: ~6% starting
        // Anexo V: ~15.5% starting
        const totalRev = parseFloat(revenue.service) + parseFloat(revenue.commerce);
        const rate = anexo === 'III' ? 0.06 : 0.155;
        return totalRev * rate;
    }
  };

  const totalRevenue = parseFloat(revenue.service) + parseFloat(revenue.commerce);
  const annualProjection = totalRevenue * 12;
  const meiLimit = 81000;
  const simplesLimit = 4800000;
  
  const isOverLimit = mode === 'mei' ? annualProjection > meiLimit : annualProjection > simplesLimit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-6">Tax Simulator (Advanced)</h2>
        
        {/* Mode Toggle */}
        <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
            <button 
                onClick={() => setMode('mei')}
                className={`flex-1 py-1 rounded-md text-sm font-medium transition-colors ${mode === 'mei' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                MEI
            </button>
            <button 
                onClick={() => setMode('simples')}
                className={`flex-1 py-1 rounded-md text-sm font-medium transition-colors ${mode === 'simples' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Simples Nacional
            </button>
        </div>

        <div className="space-y-4">
          {mode === 'simples' && (
              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Anexo (Service Type)</label>
                  <select 
                    value={anexo}
                    onChange={(e) => setAnexo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                      <option value="III">Anexo III (General Services - 6%)</option>
                      <option value="V">Anexo V (Intellectual Services - 15.5%)</option>
                  </select>
              </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Service Revenue (R$)</label>
            <input 
              type="number" 
              value={revenue.service}
              onChange={(e) => setRevenue({...revenue, service: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Commerce Revenue (R$)</label>
            <input 
              type="number" 
              value={revenue.commerce}
              onChange={(e) => setRevenue({...revenue, commerce: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.00"
            />
          </div>

          <div className="bg-slate-800 p-4 rounded-lg space-y-3 mt-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <span className="text-gray-300">Estimated Monthly Tax:</span>
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
                    Warning: You might exceed the {mode === 'mei' ? 'MEI' : 'Simples Nacional'} annual limit.
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
