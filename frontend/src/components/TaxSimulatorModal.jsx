import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CustomAlert from './CustomAlert';

const TaxSimulatorModal = ({ isOpen, onClose }) => {
  const [revenue, setRevenue] = useState({ service: 0, commerce: 0 });
  
  // Advanced Mode State
  const [mode, setMode] = useState('mei'); // 'mei' or 'simples'
  const [anexo, setAnexo] = useState('III'); // 'III' or 'V' for Simples Nacional

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
  const isPro = ['pro', 'premium', 'agency'].includes(user.plan);

  if (!isOpen) return null;

  // 2025 MEI Values (Estimated)
  // INSS (5% of min wage R$ 1502) = 75.10
  // ICMS (Commerce) = 1.00
  // ISS (Service) = 5.00
  const INSS = 75.10;
  const ICMS = 1.00;
  const ISS = 5.00;

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

  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(112, 26, 117); // Purple
    doc.text('Lumini I.A', 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text('Relatório de Simulação Fiscal', 14, 30);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 36);

    // Section: Input Data
    doc.autoTable({
        startY: 45,
        head: [['Parâmetro', 'Valor']],
        body: [
            ['Regime Tributário', mode === 'mei' ? 'MEI (Microempreendedor Individual)' : 'Simples Nacional'],
            ['Anexo (Se Simples)', mode === 'simples' ? (anexo === 'III' ? 'Anexo III (Serviços Gerais)' : 'Anexo V (Intelectual)') : 'N/A'],
            ['Faturamento Mensal (Serviço)', `R$ ${parseFloat(revenue.service).toFixed(2)}`],
            ['Faturamento Mensal (Comércio)', `R$ ${parseFloat(revenue.commerce).toFixed(2)}`],
            ['Projeção Anual', `R$ ${annualProjection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [112, 26, 117] }, // Purple
    });

    // Section: Results
    const monthlyTax = calculateDAS();
    const annualTax = monthlyTax * 12;

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Resultado Estimado', 'Valor']],
        body: [
            ['Imposto Mensal (Estimado)', `R$ ${monthlyTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
            ['Custo Anual de Impostos', `R$ ${annualTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
            ['Status do Limite Anual', isOverLimit ? '⚠️ ACIMA DO LIMITE' : '✅ DENTRO DO LIMITE'],
            ['Aliquota Efetiva (Aprox.)', `${((monthlyTax / (totalRevenue || 1)) * 100).toFixed(2)}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40] }, // Dark Gray
    });

    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
        'Aviso: Esta simulação é apenas para fins informativos e não substitui o cálculo oficial de um contador.',
        14,
        doc.lastAutoTable.finalY + 15
    );

    doc.save('simulacao-fiscal-lumini.pdf');
    showAlert('Sucesso', 'Relatório PDF gerado com sucesso!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
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
                onClick={() => {
                    if (isPro) {
                        setMode('simples');
                    } else {
                        showAlert('Premium Feature', 'Simples Nacional simulation is a PRO feature. Upgrade to unlock!', 'locked');
                    }
                }}
                className={`flex-1 py-1 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'simples' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'} ${!isPro ? 'opacity-75' : ''}`}
            >
                Simples Nacional
                {!isPro && <span>🔒</span>}
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
            onClick={() => {
                if (isPro) {
                    generatePDF();
                } else {
                    showAlert('Premium Feature', 'PDF Reports are available for PRO users only.', 'locked');
                }
            }}
            className={`w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition-all mt-4 border border-slate-700 flex justify-center items-center gap-2 ${!isPro ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            Export PDF Report
            {!isPro && <span>🔒</span>}
          </button>

          <button 
            onClick={onClose}
            className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-all mt-2"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxSimulatorModal;
