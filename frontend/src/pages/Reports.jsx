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
  const { incomeData, expenseData, monthlyData } = useMemo(() => {
    const incomeMap = {};
    const expenseMap = {};
    const monthlyMap = {};

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      const date = new Date(t.date);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      // Monthly totals
      if (!monthlyMap[monthYear]) monthlyMap[monthYear] = { income: 0, expense: 0 };
      if (t.type === 'income') {
        monthlyMap[monthYear].income += amount;
      } else {
        monthlyMap[monthYear].expense += Math.abs(amount);
      }

      // Source totals
      const source = t.source || 'Uncategorized';
      if (t.type === 'income') {
        incomeMap[source] = (incomeMap[source] || 0) + amount;
      } else {
        expenseMap[source] = (expenseMap[source] || 0) + Math.abs(amount);
      }
    });

    return {
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
  }, [transactions]);

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
        <button 
          onClick={generatePDF}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </button>
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
