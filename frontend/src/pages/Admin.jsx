import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CustomAlert from '../components/CustomAlert';

const Admin = () => {
  const [accountants, setAccountants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

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
      // If 403, redirect to home or show error
      if (error.response && error.response.status === 403) {
          window.location.href = '/dashboard';
      }
      showAlert('Erro ao carregar lista de contadores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/accountants/${id}/verify`);
      setAccountants(prev => prev.map(acc => acc.id === id ? { ...acc, verified: true } : acc));
      showAlert('Contador aprovado com sucesso!', 'success');
    } catch (error) {
      console.error('Error approving accountant:', error);
      showAlert('Erro ao aprovar contador', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este escritório?')) return;
    
    try {
      await api.delete(`/accountants/${id}`);
      setAccountants(prev => prev.filter(acc => acc.id !== id));
      showAlert('Contador removido com sucesso!', 'success');
    } catch (error) {
      console.error('Error deleting accountant:', error);
      showAlert('Erro ao remover contador', 'error');
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">
          Painel Administrativo
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Nome</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Email</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Especialidade</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {accountants.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {acc.image && (
                            <img 
                                src={acc.image.startsWith('http') ? acc.image : `http://localhost:5000${acc.image}`} 
                                alt="" 
                                className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium text-slate-800 dark:text-white">{acc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{acc.email}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{acc.specialty}</td>
                      <td className="px-6 py-4">
                        {acc.verified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Verificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!acc.verified && (
                            <button
                              onClick={() => handleApprove(acc.id)}
                              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                              title="Aprovar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(acc.id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Remover"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {accountants.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        Nenhum escritório cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CustomAlert 
        isOpen={alert.show} 
        message={alert.message} 
        type={alert.type} 
        onClose={() => setAlert({ ...alert, show: false })} 
      />
    </div>
  );
};

export default Admin;
