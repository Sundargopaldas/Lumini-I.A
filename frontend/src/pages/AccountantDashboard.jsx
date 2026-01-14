import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Logo from '../components/Logo';

const AccountantDashboard = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get('/accountants/me/clients');
        setClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Logo className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('accountant.title')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                {t('accountant.welcome')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Client List Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              {t('accountant.client_list')}
            </h2>
            
            {loading ? (
              <p className="text-slate-500">{t('common.loading')}</p>
            ) : clients.length > 0 ? (
              clients.map(client => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                    selectedClient?.id === client.id
                      ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-500'
                      : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {(client.name || client.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{client.name || client.username}</h3>
                      <p className="text-xs text-slate-500">{client.email}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-6 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <p className="text-slate-500 mb-2">{t('accountant.no_clients')}</p>
                <button className="text-blue-600 text-sm font-medium hover:underline">
                  {t('accountant.invite_clients')}
                </button>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {selectedClient && report ? (
              <div className="space-y-6">
                {/* Client Header */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {selectedClient.name || selectedClient.username}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {t('accountant.tax_regime')}: <span className="font-medium text-blue-600">{report.financials.taxSim.regime}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {t('reports.creator_mode')}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedClient(null);
                          setReport(null);
                        }}
                        className="group p-2 rounded-lg bg-slate-100 hover:bg-red-100 dark:bg-slate-700 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-110"
                        title="Fechar relatório"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600 group-hover:text-red-600 dark:text-slate-400 dark:group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tax Insights Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Domestic Income */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t('accountant.domestic_income')}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      R$ {(report.financials.incomeBySource.total - (report.financials.taxSim.exportExemptionSavings / 0.06)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">Publis Nacionais</p>
                  </div>

                  {/* Export Income */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t('accountant.international_income')}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      R$ {(report.financials.taxSim.exportExemptionSavings / 0.06).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-green-600/70 mt-2">AdSense / Twitch (Isento PIS/COFINS)</p>
                  </div>

                  {/* Estimated Savings */}
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-sm text-blue-100 mb-2">{t('accountant.export_savings')}</p>
                    <p className="text-3xl font-bold">
                      R$ {report.financials.taxSim.exportExemptionSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-blue-100 mt-2">Economia mensal estimada</p>
                  </div>
                </div>

                {/* Detailed Report */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                   <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {t('accountant.creator_insight')}
                   </h3>
                   <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div>
                          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                            {report.financials.taxSim.obs}
                          </p>
                        </div>
                      </div>
                   </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  {t('accountant.select_client')}
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  {t('accountant_dashboard.select_client_subtitle')}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountantDashboard;
