import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TrendChart from '../components/TrendChart';
import SourceChart from '../components/SourceChart';
import TransactionCard from '../components/TransactionCard';
import GoalsWidget from '../components/GoalsWidget';
import SubscriptionWidget from '../components/SubscriptionWidget';
import TaxSimulatorModal from '../components/TaxSimulatorModal';
import AIInsightsWidget from '../components/AIInsightsWidget';
import api from '../services/api';

const Dashboard = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Load initial user from LocalStorage
    const loadUser = () => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error('Error parsing user from storage', e);
        }
    };
    
    loadUser();

    // 2. Fetch fresh user data from API to ensure plan is up-to-date
    const refreshUserData = async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.data) {
                console.log('Refreshing user data from API:', response.data);
                setUser(response.data);
                localStorage.setItem('user', JSON.stringify(response.data));
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    };

    refreshUserData();

    // Listen for storage changes
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  const fetchTransactions = async () => {
    try {
      setError(null);
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
    <div className="space-y-6">
      
      {/* Subscription Status Widget */}
      <SubscriptionWidget user={user} />
      <h1 className="text-3xl font-bold text-white mb-8">{t('dashboard.title')}</h1>

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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-white font-semibold text-lg">{t('dashboard.mei_tracker')}</h2>
          <button 
            onClick={() => setIsTaxModalOpen(true)}
            className="text-sm bg-white text-purple-700 hover:bg-gray-100 font-bold px-4 py-2 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <span>📊</span>
            {t('dashboard.simulate_taxes')}
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

      {/* AI Insights Widget */}
      <AIInsightsWidget />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors">
          <h3 className="text-slate-600 dark:text-gray-300 text-sm font-medium">{t('dashboard.total_balance')}</h3>
          <p className={`text-3xl font-bold break-all ${metrics.totalBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500 dark:text-red-400'}`}>
            R$ {metrics.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors">
          <h3 className="text-slate-600 dark:text-gray-300 text-sm font-medium">{t('dashboard.income_month')}</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 break-all">+R$ {metrics.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 break-words">{t('dashboard.top_source')}: {metrics.topSource}</p>
        </div>
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors">
          <h3 className="text-slate-600 dark:text-gray-300 text-sm font-medium">{t('dashboard.expenses_month')}</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 break-all">-R$ {metrics.monthlyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 break-words">{t('dashboard.top_expense')}: {metrics.topExpense}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('dashboard.balance_evolution')}</h2>
          <div className="h-64">
             {trendData ? (
                 <TrendChart data={trendData} />
             ) : (
                 <p className="text-slate-500 dark:text-gray-400 text-center mt-10">{t('dashboard.no_chart_data')}</p>
             )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('dashboard.income_source')}</h2>
            <div className="h-64">
                {sourceData ? (
                    <SourceChart data={sourceData} />
                ) : (
                    <p className="text-slate-500 dark:text-gray-400 text-center mt-10">{t('dashboard.no_chart_data')}</p>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <GoalsWidget />
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-slate-200 dark:border-white/20 shadow-xl transition-colors">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('dashboard.recent_transactions')}</h2>
               <Link to="/transactions" className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300">{t('dashboard.view_all')}</Link>
            </div>
            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.slice(0, 3).map((transaction) => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
              ) : (
                <p className="text-slate-500 dark:text-gray-400">{t('dashboard.no_transactions')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaxSimulatorModal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
