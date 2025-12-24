import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Chart from '../components/Chart';
import TransactionCard from '../components/TransactionCard';
import TaxSimulatorModal from '../components/TaxSimulatorModal';
import api from '../services/api';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);

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

  // Prepare Chart Data (Monthly Income vs Expense)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const incomeData = new Array(12).fill(0);
    const expenseData = new Array(12).fill(0);

    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthIndex = date.getMonth();
      // Only for current year or last 12 months? Let's do current year for simplicity
      if (date.getFullYear() === new Date().getFullYear()) {
         if (t.type === 'income') incomeData[monthIndex] += parseFloat(t.amount);
         else expenseData[monthIndex] += Math.abs(parseFloat(t.amount));
      }
    });

    return {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(168, 85, 247, 0.6)', // Purple
          borderRadius: 4,
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.6)', // Red
          borderRadius: 4,
        },
      ],
    };
  }, [transactions]);

  const meiLimit = 81000;
  const meiPercentage = Math.min((metrics.annualRevenue / meiLimit) * 100, 100);

  if (loading) return <div className="text-white text-center mt-10">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <span className="text-xl">⚠️</span>
             <div>
                <p className="font-bold">Connection Issue</p>
                <p className="text-sm opacity-80">{error}</p>
             </div>
          </div>
          <button 
            onClick={fetchTransactions}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-semibold transition-colors border border-red-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* MEI Tracker Widget */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-white font-semibold text-lg">MEI Annual Limit Tracker</h2>
          <button 
            onClick={() => setIsTaxModalOpen(true)}
            className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full transition-colors"
          >
            Simulate Taxes
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
          You have used {meiPercentage.toFixed(1)}% of your annual MEI limit. 
          {meiPercentage > 80 && <span className="text-red-200 font-bold ml-1">Warning: Approaching limit!</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl">
          <h3 className="text-gray-300 text-sm font-medium">Total Balance</h3>
          <p className={`text-3xl font-bold break-all ${metrics.totalBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
            R$ {metrics.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl">
          <h3 className="text-gray-300 text-sm font-medium">Income (This Month)</h3>
          <p className="text-3xl font-bold text-green-400 break-all">+R$ {metrics.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1 break-words">Top source: {metrics.topSource}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl">
          <h3 className="text-gray-300 text-sm font-medium">Expenses (This Month)</h3>
          <p className="text-3xl font-bold text-red-400 break-all">-R$ {metrics.monthlyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1 break-words">Top expense: {metrics.topExpense}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Revenue Overview</h2>
          <div className="h-64">
             {chartData && chartData.datasets ? (
                 <Chart data={chartData} />
             ) : (
                 <p className="text-gray-400 text-center mt-10">No data for chart</p>
             )}
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
             <Link to="/transactions" className="text-sm text-purple-400 hover:text-purple-300">View All</Link>
          </div>
          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <p className="text-gray-400">No transactions yet.</p>
            )}
          </div>
        </div>
      </div>

      <TaxSimulatorModal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
