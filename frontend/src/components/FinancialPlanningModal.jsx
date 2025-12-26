import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const FinancialPlanningModal = ({ isOpen, onClose }) => {
  const [revenueGoal, setRevenueGoal] = useState('50000');
  const [expenseLimit, setExpenseLimit] = useState('20000');

  if (!isOpen) return null;

  // Mock Projection Data
  const data = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        fill: true,
        label: 'Projeção de Faturamento',
        data: [12000, 19000, 25000, 32000, 42000, 55000],
        borderColor: 'rgb(147, 51, 234)', // Purple-600
        backgroundColor: 'rgba(147, 51, 234, 0.2)',
        tension: 0.4
      },
      {
        fill: true,
        label: 'Projeção de Custos',
        data: [5000, 7000, 8500, 9000, 11000, 14000],
        borderColor: 'rgb(239, 68, 68)', // Red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#9ca3af' }
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: { color: '#ffffff10' },
        ticks: { color: '#9ca3af' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af' }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-center shrink-0 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-purple-400">📈</span> Planejamento Financeiro
            </h2>
            <p className="text-gray-400 text-sm">Projeção de Fluxo de Caixa e Metas (Premium)</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors bg-white/10 rounded-full p-2"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Meta de Faturamento (Mensal)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">R$</span>
                <input
                  type="number"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-lg"
                  value={revenueGoal}
                  onChange={(e) => setRevenueGoal(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Teto de Gastos (Mensal)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">R$</span>
                <input
                  type="number"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-lg"
                  value={expenseLimit}
                  onChange={(e) => setExpenseLimit(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5 h-[400px]">
             <Line options={options} data={data} />
          </div>

          {/* Analysis */}
          <div className="mt-6 bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
            <h3 className="text-purple-300 font-bold mb-2">💡 Análise da I.A.</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Com base no seu crescimento atual de <strong>15% ao mês</strong>, você deve atingir a meta de 
              R$ {parseInt(revenueGoal).toLocaleString()} em <strong>Junho</strong>. 
              Recomendamos manter os custos abaixo de R$ {parseInt(expenseLimit).toLocaleString()} para maximizar a margem de lucro.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FinancialPlanningModal;
