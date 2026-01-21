import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';

const AccountantDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats and clients on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Buscar estatísticas agregadas
        const statsRes = await api.get('/accountants/dashboard/stats');
        setStats(statsRes.data);

        // Buscar lista de clientes
        const clientsRes = await api.get('/accountants/me/clients');
        setClients(clientsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch report when a client is selected
  useEffect(() => {
    if (selectedClient) {
      const fetchReport = async () => {
        try {
          const response = await api.get(`/accountants/client/${selectedClient.id}/report`);
          setReport(response.data);
        } catch (error) {
          console.error('Error fetching report:', error);
        }
      };
      fetchReport();
    }
  }, [selectedClient]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  // Componente de Card de Métrica
  const MetricCard = ({ title, value, icon, color, subtitle }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-l-4 border-${color}-500`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600 dark:text-${color}-400 mb-1`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Se não tiver stats, não é contador
  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">👨‍💼</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Você não é um contador
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Para acessar esta área, você precisa criar um perfil de contador.
          </p>
          <Link
            to="/marketplace"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Tornar-me Contador
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Logo className="w-12 h-12" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Dashboard do Contador
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Visão completa de todos os seus clientes
              </p>
            </div>
          </div>
          <Link
            to="/help"
            className="hidden md:flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span>🆘</span>
            <span className="text-sm font-medium">Ajuda</span>
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <MetricCard
            title="Total de Clientes"
            value={stats.overview.totalClients}
            icon="👥"
            color="blue"
            subtitle={`${stats.overview.activeClients} ativos`}
          />
          <MetricCard
            title="Receita Total (30d)"
            value={`R$ ${parseFloat(stats.overview.totalRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon="💰"
            color="green"
          />
          <MetricCard
            title="Despesas (30d)"
            value={`R$ ${parseFloat(stats.overview.totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon="📊"
            color="orange"
          />
          <MetricCard
            title="Lucro Líquido"
            value={`R$ ${parseFloat(stats.overview.netIncome).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon="✅"
            color="purple"
            subtitle="Últimos 30 dias"
          />
        </div>

        {/* Alertas e Pendências */}
        {stats.alerts && stats.alerts.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm mb-8 border-l-4 border-yellow-500">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              ⚠️ Alertas e Pendências
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.alerts.length}
              </span>
            </h3>

            <div className="space-y-3">
              {stats.alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="text-2xl">
                    {alert.type === 'invoice_pending' && '📝'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Cliente: <strong>{alert.clientName}</strong> • {new Date(alert.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    alert.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content: Clients Grid/List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            📋 Seus Clientes
            <span className="text-sm font-normal text-gray-500">
              ({clients.length} {clients.length === 1 ? 'cliente' : 'clientes'})
            </span>
          </h3>

          {clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Você ainda não tem clientes vinculados.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Seus clientes podem vincular você pelo email ou você pode convidá-los.
              </p>
              <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                Convidar Clientes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map(client => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="p-5 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white dark:bg-slate-700 border-gray-200 dark:border-gray-600 hover:border-purple-400"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {(client.name || client.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {client.name || client.username}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {client.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      client.plan === 'premium' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                      client.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {client.plan.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      Desde {new Date(client.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Relatório do Cliente (se selecionado) */}
        {selectedClient && report && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header do Modal */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedClient.name || selectedClient.username}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {selectedClient.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setReport(null);
                  }}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Conteúdo do Modal */}
              <div className="p-6 space-y-6">
                {/* Métricas do Cliente */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Receita</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      R$ {(report.financials.incomeBySource?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Despesas</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      R$ {(report.financials.expensesByCategory?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tributos Estimados</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      R$ {(report.financials.taxSim?.estimatedTax || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Informações Fiscais */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="font-semibold mb-2 text-gray-900 dark:text-white">Regime Tributário</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {report.financials.taxSim?.regime || 'Não informado'}
                  </p>
                  {report.financials.taxSim?.obs && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      {report.financials.taxSim.obs}
                    </p>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3">
                  <button className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                    Ver Relatório Completo
                  </button>
                  <button className="px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    Exportar PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AccountantDashboard;
