import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AccountantDashboard = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accountants/clients');
      setClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err.response?.data?.message || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (clientId) => {
    try {
        setReportLoading(true);
        setReportModalOpen(true);
        setSelectedReport(null); // Clear previous

        const response = await api.get(`/accountants/clients/${clientId}/report`);
        setSelectedReport(response.data);
    } catch (err) {
        console.error('Error fetching report:', err);
        alert('Erro ao carregar relatório do cliente.');
        setReportModalOpen(false);
    } finally {
        setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Painel do Contador</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Gerencie seus clientes e visualize seus dados financeiros.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-slate-800 dark:text-white mb-2">Nenhum cliente vinculado</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Seus clientes precisam vincular o perfil deles ao seu escritório através do Marketplace.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => (
              <div key={client.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    client.plan === 'premium' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                    client.plan === 'pro' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {client.plan.toUpperCase()}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{client.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{client.email}</p>
                
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                  Cliente desde: {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                </div>

                <button 
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  onClick={() => handleViewReport(client.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Ver Relatórios
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Report Modal */}
        {reportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Resumo Financeiro do Cliente</h2>
                        <button 
                            onClick={() => setReportModalOpen(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {reportLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : selectedReport ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Cliente</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">{selectedReport.client.name}</p>
                                        <p className="text-xs text-slate-400">{selectedReport.client.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Período</p>
                                        <p className="font-semibold text-slate-800 dark:text-white capitalize">{selectedReport.period.month} {selectedReport.period.year}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                                        <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase mb-1">Receita</p>
                                        <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                            {selectedReport.financials.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                                        <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase mb-1">Despesas</p>
                                        <p className="text-lg font-bold text-red-700 dark:text-red-300">
                                            {selectedReport.financials.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase mb-1">Lucro Líquido</p>
                                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                            {selectedReport.financials.netIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800 flex items-start gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Nota de Acesso</p>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                            Este é um resumo somente leitura. Você não pode editar transações ou configurações deste cliente.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-slate-500">Nenhum dado disponível.</p>
                        )}
                    </div>
                    
                    <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                        <button 
                            onClick={() => setReportModalOpen(false)}
                            className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AccountantDashboard;