import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import CustomAlert from '../components/CustomAlert';

const AdminAccountants = () => {
  const [accountants, setAccountants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ 
    show: false, 
    message: '', 
    type: 'success',
    title: '',
    onConfirm: null 
  });

  useEffect(() => {
    fetchAccountants();
  }, []);

  const fetchAccountants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accountants/admin');
      setAccountants(response.data);
    } catch (error) {
      console.error('Error fetching accountants:', error);
      showAlert('Erro ao carregar contadores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'info', title = '', onConfirm = null) => {
    setAlert({ 
        show: true, 
        message, 
        type, 
        title: title || (type === 'error' ? 'Erro' : (type === 'success' ? 'Sucesso' : 'Atenção')),
        onConfirm 
    });
  };

  const handleDelete = (accountantId, accountantName) => {
    showAlert(
      `Tem certeza que deseja remover "${accountantName}"? Esta ação não pode ser desfeita.`,
      'confirm',
      'Remover Contador',
      async () => {
        try {
          await api.delete(`/accountants/${accountantId}`);
          showAlert('Contador removido com sucesso!', 'success');
          fetchAccountants();
        } catch (error) {
          console.error('Error deleting accountant:', error);
          showAlert('Erro ao remover contador', 'error');
        }
      }
    );
  };

  const handleToggleVerify = async (accountant) => {
    try {
      if (accountant.verified) {
        // Desverificar (ocultar do marketplace)
        await api.put(`/accountants/${accountant.id}/unverify`);
        showAlert('Contador ocultado do marketplace', 'success');
      } else {
        // Verificar (mostrar no marketplace)
        await api.put(`/accountants/${accountant.id}/verify`);
        showAlert('Contador exibido no marketplace', 'success');
      }
      fetchAccountants();
    } catch (error) {
      console.error('Error toggling verify:', error);
      showAlert('Erro ao atualizar status', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <CustomAlert 
        isOpen={alert.show}
        onClose={() => setAlert(prev => ({ ...prev, show: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={alert.onConfirm}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            🛡️ {t('admin_accountants.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('admin_accountants.subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">{t('admin_accountants.total')}</div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white mt-2">
              {accountants.length}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">{t('admin_accountants.verified')}</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {accountants.filter(a => a.verified).length}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">{t('admin_accountants.hidden')}</div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
              {accountants.filter(a => !a.verified).length}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : accountants.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400">
              {t('admin_accountants.no_accountants')}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      {t('admin_accountants.table_logo')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      {t('admin_accountants.table_name')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      {t('admin_accountants.table_email')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      {t('admin_accountants.table_crc')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      {t('admin_accountants.table_specialty')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      {t('admin_accountants.table_status')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      {t('admin_accountants.table_actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {accountants.map((acc) => (
                    <motion.tr
                      key={acc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                          {acc.image ? (
                            <img 
                              src={acc.image} 
                              alt={acc.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {acc.name}
                          </div>
                          {acc.verified && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {acc.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {acc.crc || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {acc.specialty || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          acc.verified 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {acc.verified ? 'Visível' : 'Oculto'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleToggleVerify(acc)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            acc.verified
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                          }`}
                        >
                          {acc.verified ? t('admin_accountants.hide') : t('admin_accountants.show')}
                        </button>
                        <button
                          onClick={() => handleDelete(acc.id, acc.name)}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                        >
                          Remover
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAccountants;
