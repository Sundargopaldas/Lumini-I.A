import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TrendChart from '../components/TrendChart';
import SourceChart from '../components/SourceChart';
import TransactionCard from '../components/TransactionCard';
import GoalsWidget from '../components/GoalsWidget';
import SubscriptionWidget from '../components/SubscriptionWidget';
import TaxSimulatorModal from '../components/TaxSimulatorModal';
import AIInsightsWidget from '../components/AIInsightsWidget';
import CustomAlert from '../components/CustomAlert';
import Logo from '../components/Logo';
// import OnboardingChecklist from '../components/OnboardingChecklist';
import api from '../services/api';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const showAlert = (title, message, type, onConfirm) => setAlertState({ isOpen: true, title, message, type, onConfirm });

  useEffect(() => {
    // Load user from LocalStorage only
    const loadUser = () => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                
                // ✅ REMOVIDO: Contadores podem acessar suas finanças pessoais (/dashboard)
                // Eles têm acesso a AMBOS: /dashboard (pessoal) E /accountant-dashboard (clientes)
            }
        } catch (e) {
            console.error('Error parsing user from storage', e);
        }
    };
    
    loadUser();

    // Listen for storage changes
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, [navigate]);

  const fetchTransactions = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get('/transactions');
      console.log('Dashboard received transactions:', response.data);
      if (Array.isArray(response.data)) {
        setTransactions(response.data);
      } else {
        console.error('Invalid transactions data:', response.data);
        setTransactions([]);
        setError('Received invalid data format from server.');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      setError('Unable to load your latest transactions. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDeleteTransaction = (id) => {
    showAlert(
      t('transactions.delete_title'), 
      t('transactions.delete_confirm'), 
      'confirm', 
      async () => {
        try {
          await api.delete(`/transactions/${id}`);
          setTransactions(transactions.filter(t => t.id !== id));
          showAlert(t('common.success'), t('transactions.delete_success'), 'success');
        } catch (error) {
          console.error('Error deleting transaction:', error);
          showAlert(t('common.error'), t('transactions.delete_error'), 'error');
        }
      }
    );
  };

  const metrics = useMemo(() => {
    if (!Array.isArray(transactions)) return {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        annualRevenue: 0,
        topSource: 'N/A',
        topExpense: 'N/A'
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let annualRevenue = 0;
    const incomeBySource = {};
    const expenseByCategory = {};

    transactions.forEach(t => {
      const amount = parseFloat(t.amount) || 0;
      
      // Safe Date Parsing
      let date;
      if (typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
          const [year, month, day] = t.date.split('-').map(Number);
          date = new Date(year, month - 1, day);
      } else {
          date = new Date(t.date);
      }
      
      // Total Balance
      if (t.type === 'income') totalBalance += amount;
      else totalBalance -= Math.abs(amount);

      // Monthly Metrics
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        if (t.type === 'income') monthlyIncome += amount;
        else monthlyExpense += Math.abs(amount);
      }

      // Annual Revenue (for MEI)
      if (t.type === 'income' && date.getFullYear() === currentYear) {
        annualRevenue += amount;
      }

      // Top Sources/Categories
      if (t.type === 'income') {
        const source = t.source || 'Unknown';
        incomeBySource[source] = (incomeBySource[source] || 0) + amount;
      } else {
        const source = t.source || 'Unknown';
        expenseByCategory[source] = (expenseByCategory[source] || 0) + Math.abs(amount);
      }
    });

    // Find top source/expense
    const topSource = Object.entries(incomeBySource).sort((a, b) => b[1] - a[1])[0];
    const topExpense = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      annualRevenue,
      topSource: topSource ? topSource[0] : 'N/A',
      topExpense: topExpense ? topExpense[0] : 'N/A'
    };
  }, [transactions]);

  // Balance Trend Data (Last 6 Months)
  const trendData = useMemo(() => {
    if (!transactions.length) return null;

    // 1. Generate last 6 month labels and range
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
            date: d,
            label: d.toLocaleString('default', { month: 'short' }),
        });
    }

    // 2. Calculate initial balance (transactions before the 6-month window)
    const startOfPeriod = months[0].date;
    let runningBalance = 0;

    // First pass: Calculate pre-period balance
    transactions.forEach(t => {
        const amount = parseFloat(t.amount) || 0;
        let tDate;
        if (typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
            const [y, m, d] = t.date.split('-').map(Number);
            tDate = new Date(y, m - 1, d);
        } else {
            tDate = new Date(t.date);
        }

        if (tDate < startOfPeriod) {
            if (t.type === 'income') runningBalance += amount;
            else runningBalance -= Math.abs(amount);
        }
    });

    // 3. Calculate month-end balances
    const dataPoints = months.map(month => {
        const nextMonth = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 1);
        
        // Sum transactions within this month
        transactions.forEach(t => {
            const amount = parseFloat(t.amount) || 0;
            let tDate;
            if (typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
                const [y, m, d] = t.date.split('-').map(Number);
                tDate = new Date(y, m - 1, d);
            } else {
                tDate = new Date(t.date);
            }

            if (tDate >= month.date && tDate < nextMonth) {
                 if (t.type === 'income') runningBalance += amount;
                 else runningBalance -= Math.abs(amount);
            }
        });

        return runningBalance;
    });

    return {
        labels: months.map(m => m.label),
        datasets: [
            {
                label: 'Balance Evolution',
                data: dataPoints,
                borderColor: '#8b5cf6', // Violet-500
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ]
    };
  }, [transactions]);

  // Source Chart Data
  const sourceData = useMemo(() => {
      if (!transactions.length) return null;

      const incomeBySource = {};
      transactions.forEach(t => {
          if (t.type === 'income') {
              const source = t.source || 'Manual';
              incomeBySource[source] = (incomeBySource[source] || 0) + parseFloat(t.amount);
          }
      });

      const labels = Object.keys(incomeBySource);
      const data = Object.values(incomeBySource);
      
      // Colors for different sources
      const backgroundColors = [
          '#8b5cf6', // Violet
          '#3b82f6', // Blue
          '#10b981', // Emerald
          '#f59e0b', // Amber
          '#ef4444', // Red
          '#ec4899', // Pink
      ];

      return {
          labels,
          datasets: [
              {
                  data,
                  backgroundColor: backgroundColors.slice(0, labels.length),
                  borderWidth: 0,
              },
          ],
      };
  }, [transactions]);

  const meiLimit = 81000;
  const meiPercentage = Math.min((metrics.annualRevenue / meiLimit) * 100, 100);

  if (loading) return <div className="text-center py-10">{t('plans.processing')}</div>;

  return (
    <>
      {/* Alert Modal - Renderizado fora do container principal */}
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm}
      />
      
      <div className="space-y-5 lg:space-y-6 px-3 md:px-4 lg:px-0">
        {/* Subscription Status Widget */}
        <SubscriptionWidget user={user} />
      
      <h1 className="text-2xl md:text-3xl ipad-air:text-4xl font-bold text-white mb-4 md:mb-6 ipad-air:mb-8">{t('dashboard.title')}</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <span className="text-xl">⚠️</span>
             <div>
                <p className="font-bold">{t('dashboard.connection_issue')}</p>
                <p className="text-sm opacity-80">{error}</p>
             </div>
          </div>
          <button 
            onClick={fetchTransactions}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-semibold transition-colors border border-red-500/30"
          >
            {t('dashboard.retry')}
          </button>
        </div>
      )}

      {/* MEI Tracker Widget */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 md:p-6 ipad-air:p-7 shadow-xl border border-white/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
          <h2 className="text-white font-semibold text-base md:text-lg ipad-air:text-xl">{t('dashboard.mei_tracker')}</h2>
          <button 
            onClick={() => setIsTaxModalOpen(true)}
            className="text-xs md:text-sm ipad-air:text-base bg-white text-purple-700 hover:bg-gray-100 font-bold px-3 md:px-4 ipad-air:px-5 py-1.5 md:py-2 ipad-air:py-2.5 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-1 md:gap-2 whitespace-nowrap"
          >
            <span>📊</span>
            <span className="hidden sm:inline">{t('dashboard.simulate_taxes')}</span>
            <span className="sm:hidden">Simular</span>
          </button>
        </div>
        <div className="flex justify-between items-center mb-2">
           <span className="text-white/80 text-sm">R$ {metrics.annualRevenue.toLocaleString()} / R$ {meiLimit.toLocaleString()}</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-4">
          <div 
            className={`h-4 rounded-full transition-all duration-1000 ${meiPercentage > 80 ? 'bg-red-400' : 'bg-green-400'}`}
            style={{ width: `${Math.max(0, Math.min(meiPercentage, 100))}%` }}
          ></div>
        </div>
        <p className="text-white/70 text-sm mt-2">
          {t('dashboard.limit_used', { percent: meiPercentage.toFixed(1) })} 
          {meiPercentage > 80 && <span className="text-red-200 font-bold ml-1">{t('dashboard.limit_warning')}</span>}
        </p>
      </div>

      {/* Guide Banner - Novo por aqui? */}
      <Link 
        to="/guide"
        className="block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-6 ipad-air:p-7 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-white/20"
      >
        <div className="flex items-center gap-4 ipad-air:gap-5">
          <div className="flex-shrink-0 w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <Logo className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg md:text-xl mb-1">
              Novo por aqui? Comece pelo Guia Rápido!
            </h3>
            <p className="text-white/90 text-sm md:text-base">
              Aprenda passo a passo como usar todas as funcionalidades do Lumini I.A
            </p>
          </div>
          <div className="flex-shrink-0 hidden md:flex items-center justify-center w-12 h-12 bg-white/20 rounded-full">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </Link>

      {/* AI Insights Widget */}
      <div className="ai-insights">
        <AIInsightsWidget />
      </div>

      {/* Onboarding Checklist - TEMPORARILY DISABLED */}
      {/* <div className="mb-6">
        <OnboardingChecklist />
      </div> */}

      <div className="grid grid-cols-1 sm:grid-cols-2 ipad-air:grid-cols-3 lg:grid-cols-3 gap-4 ipad-air:gap-5 lg:gap-6 dashboard-metrics">
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg p-5 ipad-air:p-6 lg:p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors">
          <h3 className="text-slate-600 dark:text-gray-300 text-sm ipad-air:text-base font-medium mb-1">{t('dashboard.total_balance')}</h3>
          <p className={`text-xl md:text-2xl ipad-air:text-3xl font-bold break-all ${metrics.totalBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500 dark:text-red-400'}`}>
            R$ {metrics.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors">
          <h3 className="text-slate-600 dark:text-gray-300 text-sm font-medium mb-1">{t('dashboard.income_month')}</h3>
          <p className="text-xl md:text-3xl font-bold text-green-600 dark:text-green-400 break-all">+R$ {metrics.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-gray-400 mt-1 break-words truncate" title={`${t('dashboard.top_source')}: ${metrics.topSource}`}>
            {t('dashboard.top_source')}: {metrics.topSource}
          </p>
        </div>
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors sm:col-span-2 lg:col-span-1">
          <h3 className="text-slate-600 dark:text-gray-300 text-sm font-medium mb-1">{t('dashboard.expenses_month')}</h3>
          <p className="text-xl md:text-3xl font-bold text-red-600 dark:text-red-400 break-all">-R$ {metrics.monthlyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-gray-400 mt-1 break-words truncate" title={`${t('dashboard.top_expense')}: ${metrics.topExpense}`}>
            {t('dashboard.top_expense')}: {metrics.topExpense}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-white/10 backdrop-blur-lg p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('dashboard.balance_evolution')}</h2>
          <div className="h-48 md:h-64">
             {trendData ? (
                 <TrendChart data={trendData} />
             ) : (
                 <p className="text-slate-500 dark:text-gray-400 text-center mt-8 md:mt-10 text-sm">{t('dashboard.no_chart_data')}</p>
             )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('dashboard.income_source')}</h2>
            <div className="h-48 md:h-64">
                {sourceData ? (
                    <SourceChart data={sourceData} />
                ) : (
                    <p className="text-slate-500 dark:text-gray-400 text-center mt-8 md:mt-10 text-sm">{t('dashboard.no_chart_data')}</p>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        <div className="lg:col-span-2 space-y-5 lg:space-y-6">
            <GoalsWidget />
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-white dark:bg-white/10 backdrop-blur-lg p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{t('dashboard.recent_transactions')}</h2>
               <Link to="/transactions" className="text-xs md:text-sm text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 whitespace-nowrap">{t('dashboard.view_all')}</Link>
            </div>
            <div className="space-y-3 md:space-y-4">
              {transactions.length > 0 ? (
                transactions.slice(0, 3).map((transaction) => (
                  <TransactionCard 
                    key={transaction.id} 
                    transaction={transaction}
                    onDelete={handleDeleteTransaction}
                  />
                ))
              ) : (
                <p className="text-slate-500 dark:text-gray-400 text-sm">{t('dashboard.no_transactions')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaxSimulatorModal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} />
      </div>
    </>
  );
};

export default Dashboard;
