import { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import CustomAlert from '../components/CustomAlert';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
  const isPro = user.plan === 'pro';

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get('/transactions');
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Process data for charts
  const { incomeData, expenseData, monthlyData, summary, filteredTransactions } = useMemo(() => {
    const incomeMap = {};
    const expenseMap = {};
    const monthlyMap = {};
    const filteredList = [];
    
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      
      // Safe Date Parsing
      let date;
      if (typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
          const [year, month, day] = t.date.split('-').map(Number);
          date = new Date(year, month - 1, day);
      } else {
          date = new Date(t.date);
      }

      const tMonth = date.getMonth();
      const tYear = date.getFullYear();
      const monthYearKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      // Monthly totals (Filter by Selected Year for the trend chart)
      if (tYear === parseInt(selectedYear)) {
        if (!monthlyMap[monthYearKey]) monthlyMap[monthYearKey] = { income: 0, expense: 0 };
        if (t.type === 'income') {
            monthlyMap[monthYearKey].income += amount;
        } else {
            monthlyMap[monthYearKey].expense += Math.abs(amount);
        }
      }

      // Filter for specific breakdown charts and summary
      const isMonthMatch = selectedMonth === 'all' || tMonth === parseInt(selectedMonth);
      const isYearMatch = tYear === parseInt(selectedYear);

      if (isYearMatch && isMonthMatch) {
          filteredList.push(t);
          // Summary Totals
          if (t.type === 'income') totalIncome += amount;
          else totalExpense += Math.abs(amount);

          // Source/Category totals
          const source = t.source || 'Uncategorized';
          if (t.type === 'income') {
            incomeMap[source] = (incomeMap[source] || 0) + amount;
          } else {
            expenseMap[source] = (expenseMap[source] || 0) + Math.abs(amount);
          }
      }
    });

    return {
      filteredTransactions: filteredList,
      summary: {
          income: totalIncome,
          expense: totalExpense,
          balance: totalIncome - totalExpense
      },
      incomeData: {
        labels: Object.keys(incomeMap),
        datasets: [{
          data: Object.values(incomeMap),
          backgroundColor: [
            '#a855f7', '#ec4899', '#8b5cf6', '#6366f1', '#3b82f6', '#14b8a6'
          ],
          borderColor: '#ffffff10',
          borderWidth: 1,
        }]
      },
      expenseData: {
        labels: Object.keys(expenseMap),
        datasets: [{
          data: Object.values(expenseMap),
          backgroundColor: [
             '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#64748b'
          ],
          borderColor: '#ffffff10',
          borderWidth: 1,
        }]
      },
      monthlyData: {
        labels: Object.keys(monthlyMap),
        datasets: [
          {
            label: 'Income',
            data: Object.values(monthlyMap).map(d => d.income),
            backgroundColor: '#a855f7',
            borderRadius: 4,
          },
          {
            label: 'Expense',
            data: Object.values(monthlyMap).map(d => d.expense),
            backgroundColor: '#ef4444',
            borderRadius: 4,
          }
        ]
      }
    };
  }, [transactions, selectedMonth, selectedYear]);

  const exportPDF = () => {
    if (!isPro) {
        showAlert('Premium Feature', 'PDF Reports are available for PRO users only. Upgrade to unlock!', 'locked');
        return;
    }
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(128, 90, 213); // Purple
    doc.text('Lumini I.A - Financial Report', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    doc.text(`Period: ${selectedMonth === 'all' ? 'All Months' : new Date(0, selectedMonth).toLocaleString('default', { month: 'long' })} ${selectedYear}`, 14, 38);

    // Summary Section
    doc.autoTable({
        startY: 45,
        head: [['Total Income', 'Total Expenses', 'Net Balance']],
        body: [[
            `R$ ${summary.income.toFixed(2)}`,
            `R$ ${summary.expense.toFixed(2)}`,
            `R$ ${summary.balance.toFixed(2)}`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [128, 90, 213] }
    });

    // Transactions Table
    doc.text('Detailed Transactions', 14, doc.lastAutoTable.finalY + 15);
    
    const tableData = filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.source || '-',
        t.type === 'income' ? `+ R$ ${parseFloat(t.amount).toFixed(2)}` : `- R$ ${Math.abs(parseFloat(t.amount)).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Date', 'Description', 'Source/Category', 'Amount']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [75, 85, 99] }
    });

    doc.save('lumini-report.pdf');
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#e5e7eb' }
      },
      title: { display: false }
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#e5e7eb', boxWidth: 12 }
      }
    },
    cutout: '70%',
    borderWidth: 0
  };

  const exportCSV = () => {
    if (!isPro) {
        showAlert('Premium Feature', 'CSV Export is available for PRO users only. Upgrade to unlock!', 'locked');
        return;
    }
    // CSV Header
    const headers = ['Date,Description,Type,Source,Amount,Goal'];
    
    // CSV Rows
    const rows = filteredTransactions.map(t => {
        const date = new Date(t.date).toLocaleDateString();
        const amount = t.type === 'expense' ? -Math.abs(t.amount) : t.amount;
        // Escape commas in description to prevent CSV breakage
        const safeDesc = `"${t.description.replace(/"/g, '""')}"`; 
        const safeSource = t.source || 'Uncategorized';
        const safeGoal = t.Goal ? t.Goal.name : '';
        
        return `${date},${safeDesc},${t.type},${safeSource},${amount},${safeGoal}`;
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `lumini_report_${selectedYear}_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Advanced Reports</h1>
            <p className="text-gray-400">Deep dive into your financial analytics.</p>
        </div>
        <div className="flex gap-2">
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none"
            >
                <option value="all">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                ))}
            </select>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none"
            >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
            </select>
            <button 
                onClick={exportCSV}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isPro ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-700 text-gray-400 hover:text-white'}`}
            >
                <span>📊</span> Export CSV {!isPro && '🔒'}
            </button>
            <button 
                onClick={exportPDF}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isPro ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-700 text-gray-400 hover:text-white'}`}
            >
                <span>📄</span> Export PDF {!isPro && '🔒'}
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
            <h3 className="text-slate-400 text-sm font-medium mb-1">Total Income</h3>
            <p className="text-2xl font-bold text-green-400">R$ {summary.income.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
            <h3 className="text-slate-400 text-sm font-medium mb-1">Total Expenses</h3>
            <p className="text-2xl font-bold text-red-400">R$ {summary.expense.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
            <h3 className="text-slate-400 text-sm font-medium mb-1">Net Balance</h3>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                R$ {summary.balance.toFixed(2)}
            </p>
        </div>
      </div>
      
      {/* Monthly Overview */}
      <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-6">Monthly Overview</h2>
        <div className="h-64 relative">
          <Bar options={chartOptions} data={monthlyData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-6">Income Sources</h2>
          <div className="h-64 flex justify-center relative">
             {incomeData.labels.length > 0 ? (
                <Doughnut options={doughnutOptions} data={incomeData} />
             ) : (
                <p className="text-gray-400 self-center">No income data yet</p>
             )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-6">Expense Breakdown</h2>
          <div className="h-64 flex justify-center relative">
            {expenseData.labels.length > 0 ? (
                <Doughnut options={doughnutOptions} data={expenseData} />
             ) : (
                <p className="text-gray-400 self-center">No expense data yet</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
