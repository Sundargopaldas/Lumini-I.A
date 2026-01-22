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
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import CustomAlert from '../components/CustomAlert';
import FinancialPlanningModal from '../components/FinancialPlanningModal';

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
  const { t, i18n } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);

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
  const isPremium = ['premium', 'agency'].includes(user.plan);

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
      const monthYearKey = date.toLocaleString(i18n.language, { month: 'short', year: 'numeric' });

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
            label: t('reports.total_income'),
            data: Object.values(monthlyMap).map(d => d.income),
            backgroundColor: '#a855f7',
            borderRadius: 4,
          },
          {
            label: t('reports.total_expenses'),
            data: Object.values(monthlyMap).map(d => d.expense),
            backgroundColor: '#ef4444',
            borderRadius: 4,
          }
        ]
      }
    };
  }, [transactions, selectedMonth, selectedYear, i18n.language, t]);

  const exportPDF = () => {
    if (!isPro) {
        showAlert(t('reports.feature_locked'), t('reports.pdf_locked_msg'), 'locked');
        return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // === HEADER COM DESIGN PROFISSIONAL ===
    // Background roxo no topo
    doc.setFillColor(139, 92, 246); // Purple-500
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo e título (branco sobre roxo)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('✨ Lumini I.A', 14, 15);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(t('reports.title'), 14, 23);
    doc.text(`${new Date().toLocaleDateString(i18n.language, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth - 14, 15, { align: 'right' });
    
    // Linha decorativa
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(14, 28, pageWidth - 14, 28);
    
    // === PERÍODO DO RELATÓRIO ===
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const monthName = selectedMonth === 'all' ? t('reports.all_months') : new Date(0, selectedMonth).toLocaleString(i18n.language, { month: 'long' });
    doc.text(`📊 Período: ${monthName} ${selectedYear}`, 14, 45);
    
    // === CARDS DE RESUMO (3 colunas) ===
    const cardY = 52;
    const cardHeight = 22;
    const cardWidth = (pageWidth - 42) / 3;
    
    // Card 1 - Receitas (Verde)
    doc.setFillColor(34, 197, 94); // Green-500
    doc.roundedRect(14, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('💰 ' + t('reports.total_income'), 18, cardY + 8);
    doc.setFontSize(14);
    doc.text(`R$ ${summary.income.toFixed(2)}`, 18, cardY + 17);
    
    // Card 2 - Despesas (Vermelho)
    const card2X = 14 + cardWidth + 7;
    doc.setFillColor(239, 68, 68); // Red-500
    doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('💸 ' + t('reports.total_expenses'), card2X + 4, cardY + 8);
    doc.setFontSize(14);
    doc.text(`R$ ${summary.expense.toFixed(2)}`, card2X + 4, cardY + 17);
    
    // Card 3 - Saldo (Azul ou Vermelho dependendo)
    const card3X = 14 + (cardWidth * 2) + 14;
    const balanceColor = summary.balance >= 0 ? [59, 130, 246] : [239, 68, 68]; // Blue-500 or Red-500
    doc.setFillColor(...balanceColor);
    doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('📈 ' + t('reports.net_balance'), card3X + 4, cardY + 8);
    doc.setFontSize(14);
    doc.text(`R$ ${summary.balance.toFixed(2)}`, card3X + 4, cardY + 17);
    
    // === TABELA DE TRANSAÇÕES ===
    const tableStartY = cardY + cardHeight + 15;
    
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 ' + t('transactions.title'), 14, tableStartY);
    
    const tableData = filteredTransactions.map(t => {
      const isIncome = t.type === 'income';
      return [
        new Date(t.date).toLocaleDateString(i18n.language),
        t.description,
        t.source || '-',
        {
          content: isIncome ? `+ R$ ${parseFloat(t.amount).toFixed(2)}` : `- R$ ${Math.abs(parseFloat(t.amount)).toFixed(2)}`,
          styles: { 
            textColor: isIncome ? [34, 197, 94] : [239, 68, 68],
            fontStyle: 'bold'
          }
        }
      ];
    });

    autoTable(doc, {
        startY: tableStartY + 5,
        head: [[
          t('common.date'), 
          t('common.description'), 
          t('reports.income_sources') + '/' + t('reports.expense_breakdown'), 
          t('plans.amount')
        ]], 
        body: tableData,
        theme: 'grid',
        styles: { 
          fontSize: 9,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [99, 102, 241], // Indigo-500
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // Gray-50
        },
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },
          1: { cellWidth: 70 },
          2: { cellWidth: 45 },
          3: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
    });
    
    // === FOOTER PROFISSIONAL ===
    const finalY = doc.lastAutoTable.finalY;
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
    
    // Texto do footer
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Lumini I.A - Gestão Financeira Inteligente', pageWidth / 2, pageHeight - 14, { align: 'center' });
    doc.text('www.luminiiadigital.com.br', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Selo de segurança
    doc.setTextColor(139, 92, 246);
    doc.setFontSize(7);
    doc.text(`🔒 Documento gerado em ${new Date().toLocaleString(i18n.language)}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

    // Salvar PDF
    const fileName = `Lumini_Relatorio_${monthName}_${selectedYear}.pdf`;
    doc.save(fileName);
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
        showAlert(t('reports.feature_locked'), t('reports.csv_locked_msg'), 'locked');
        return;
    }
    // CSV Header
    const headers = [`${t('common.date')},${t('common.description')},${t('reports.type')},${t('reports.source')},${t('plans.amount')},${t('reports.goal')}`];
    
    // CSV Rows
    const rows = filteredTransactions.map(t => {
        const date = new Date(t.date).toLocaleDateString(i18n.language);
        const amount = t.type === 'expense' ? -Math.abs(t.amount) : t.amount;
        // Escape commas in description to prevent CSV breakage
        const safeDesc = `"${t.description.replace(/"/g, '""')}"`; 
        const safeSource = t.source || t('common.uncategorized') || 'Uncategorized';
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
      <FinancialPlanningModal
        isOpen={isPlanningModalOpen}
        onClose={() => setIsPlanningModalOpen(false)}
        transactions={transactions}
      />
      <div className="flex flex-col gap-4 px-2 sm:px-0">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">{t('reports.title')}</h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-gray-400">{t('reports.subtitle')}</p>
        </div>
        
        {/* Filtros de Mês/Ano */}
        <div className="flex flex-col sm:flex-row gap-2">
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-auto bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
            >
                <option value="all">{t('reports.all_months')}</option>
                {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                        {new Date(0, i).toLocaleString(i18n.language, { month: 'long' })}
                    </option>
                ))}
            </select>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full sm:w-auto bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
            >
                {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return <option key={year} value={year}>{year}</option>;
                })}
            </select>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <button 
                onClick={() => {
                    if (isPremium) {
                        setIsPlanningModalOpen(true);
                    } else {
                        showAlert(t('reports.feature_locked'), t('reports.planning_locked_msg'), 'locked');
                    }
                }}
                className={`w-full px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${isPremium ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <span>📈</span> <span className="truncate">{t('reports.planning_btn')} {!isPremium && '🔒'}</span>
            </button>
            <button 
                onClick={exportCSV}
                className={`w-full px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${isPro ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <span>📊</span> <span className="truncate">{t('reports.export_csv')} {!isPro && '🔒'}</span>
            </button>
            <button 
                onClick={exportPDF}
                className={`w-full px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${isPro ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <span>📄</span> <span className="truncate">{t('reports.export_pdf')} {!isPro && '🔒'}</span>
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 px-2 sm:px-0">
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl transition-colors">
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">{t('reports.total_income')}</h3>
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 break-all">R$ {summary.income.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl transition-colors">
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">{t('reports.total_expenses')}</h3>
            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 break-all">R$ {summary.expense.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl transition-colors sm:col-span-2 md:col-span-1">
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">{t('reports.net_balance')}</h3>
            <p className={`text-xl sm:text-2xl font-bold break-all ${summary.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                R$ {summary.balance.toFixed(2)}
            </p>
        </div>
      </div>
      
      {/* Monthly Overview */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden transition-colors mx-2 sm:mx-0">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 transition-colors">{t('reports.monthly_overview')}</h2>
        <div className="h-48 sm:h-64 relative">
          <Bar options={chartOptions} data={monthlyData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-2 sm:px-0">
        {/* Income Breakdown */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden transition-colors">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 transition-colors">{t('reports.income_sources')}</h2>
          <div className="h-48 sm:h-64 flex justify-center relative">
             {incomeData.labels.length > 0 ? (
                <Doughnut options={doughnutOptions} data={incomeData} />
             ) : (
                <p className="text-slate-400 dark:text-gray-400 self-center">{t('reports.no_income_data')}</p>
             )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden transition-colors">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 transition-colors">{t('reports.expense_breakdown')}</h2>
          <div className="h-48 sm:h-64 flex justify-center relative">
            {expenseData.labels.length > 0 ? (
                <Doughnut options={doughnutOptions} data={expenseData} />
             ) : (
                <p className="text-slate-400 dark:text-gray-400 self-center">{t('reports.no_expense_data')}</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
