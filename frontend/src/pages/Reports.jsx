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

  const generatePDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // Title
    doc.setFontSize(20);
    doc.text('Lumini I.A - Financial Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${date}`, 14, 28);

    // Summary Section
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
        if(t.type === 'income') totalIncome += parseFloat(t.amount);
        else totalExpense += Math.abs(parseFloat(t.amount));
    });

    doc.setFontSize(14);
    doc.text('Summary', 14, 40);
    doc.setFontSize(12);
    doc.text(`Total Income: R$ ${totalIncome.toFixed(2)}`, 14, 50);
    doc.text(`Total Expenses: R$ ${totalExpense.toFixed(2)}`, 14, 58);
    doc.text(`Net Balance: R$ ${(totalIncome - totalExpense).toFixed(2)}`, 14, 66);

    // Transactions Table
    doc.setFontSize(14);
    doc.text('Transaction History', 14, 80);

    const tableData = transactions.map(t => [
        t.date,
        t.description,
        t.source || '-',
        t.type === 'income' ? 'Income' : 'Expense',
        `R$ ${Math.abs(t.amount).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 85,
        head: [['Date', 'Description', 'Source', 'Type', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [147, 51, 234] }, // Purple header
    });

    doc.save(`Lumini_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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

  if (loading) return <div className="text-white text-center mt-10">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <h1 className="text-3xl font-bold text-white">Financial Reports</h1>
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
            onClick={generatePDF}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PDF
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
