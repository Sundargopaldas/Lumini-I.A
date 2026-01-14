import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../components/CustomAlert';

const Marketplace = () => {
  const { t } = useTranslation();
  const [accountants, setAccountants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // New state to track current user
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    description: '',
    tags: '',
    crc: '',
    image: null // Changed to handle file object
  });
  const [crcError, setCrcError] = useState('');
  const [alert, setAlert] = useState({ 
    show: false, 
    message: '', 
    type: 'success',
    title: '',
    onConfirm: null 
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAccountants();
    fetchCurrentUser(); // Fetch user to know linking status
  }, []);

  const fetchCurrentUser = async () => {
    try {
        const response = await api.get('/auth/me');
        setCurrentUser(response.data);
    } catch (error) {
        console.error('Error fetching current user:', error);
    }
  };

  const fetchAccountants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accountants');
      setAccountants(response.data);
    } catch (error) {
      console.error('Error fetching accountants:', error);
      showAlert('Erro ao carregar contadores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateCRC = (crc) => {
    // Regex for CRC: UF-000000/O-0 (Example: SP-123456/O-8)
    // UF: 2 uppercase letters
    // Number: 6 digits
    // Type: O (Original), P (Provisional), S (Secondary), T (Transferido)
    // Digit: 1 digit (0-9)
    // Aceita também formato sem dígito verificador: UF-000000/O
    const crcRegex = /^[A-Z]{2}-\d{6}\/[A-Z](-\d)?$/;
    return crcRegex.test(crc.trim().toUpperCase());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'crc') {
      if (value && !validateCRC(value)) {
        setCrcError('Formato inválido. Ex: SP-123456/O-8 ou RJ-654321/P-5');
      } else {
        setCrcError('');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (file.size > maxSize) {
        showAlert(`Imagem muito grande! Tamanho máximo: 10MB. Sua imagem tem ${(file.size / 1024 / 1024).toFixed(2)}MB`, 'error', 'Arquivo muito grande');
        e.target.value = ''; // Limpar o input
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('specialty', formData.specialty);
      data.append('description', formData.description);
      data.append('tags', formData.tags); // Will be parsed by backend
      data.append('crc', formData.crc);
      if (formData.image) {
        data.append('image', formData.image);
      }

      const response = await api.post('/accountants', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Adicionar o novo contador à lista imediatamente (otimização otimista)
      const newAccountant = response.data;
      setAccountants(prev => [newAccountant, ...prev]);

      showAlert('Escritório cadastrado com sucesso! Seu perfil já está visível no Marketplace!', 'success');
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', specialty: '', description: '', tags: '', crc: '', image: null });
      
      // Atualizar dados do usuário
      fetchCurrentUser();
      
      // Fazer um fetch completo em background para garantir consistência
      setTimeout(() => fetchAccountants(), 1000);
    } catch (error) {
      console.error('Error registering accountant:', error);
      showAlert(error.response?.data?.message || 'Erro ao cadastrar escritório', 'error');
    } finally {
      setUploading(false);
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

  const handleContact = (email) => {
    if (!email) {
        showAlert('Email de contato não disponível.', 'error');
        return;
    }
    window.location.href = `mailto:${email}`;
  };

  const handleLink = (accountantId) => {
    if (!accountantId) {
        showAlert('Erro interno: ID do contador não encontrado.', 'error');
        return;
    }

    showAlert(
        'Deseja vincular seu perfil a este contador? Ele terá acesso de leitura aos seus dados.',
        'confirm',
        'Vincular Contador',
        async () => {
            try {
                console.log('Linking to accountant:', accountantId);
                // Optimistic Update
                setCurrentUser(prev => ({ ...prev, accountantId }));
                
                await api.post('/accountants/link', { accountantId });
                
                // Force a fresh fetch
                const response = await api.get('/auth/me');
                if (response.data) {
                    console.log('User state updated after link:', response.data);
                    setCurrentUser(response.data);
                    
                    // Also update localStorage to keep Navbar in sync
                    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                    localStorage.setItem('user', JSON.stringify({ ...localUser, ...response.data }));
                }

                showAlert('Contador vinculado com sucesso!', 'success', 'Sucesso');
            } catch (error) {
                console.error('Error linking accountant:', error);
                await fetchCurrentUser(); // Revert state
                showAlert('Erro ao vincular contador.', 'error', 'Erro');
            }
        }
    );
  };

  const handleUnlink = () => {
    showAlert(
        'Tem certeza que deseja desvincular seu contador atual? Ele perderá acesso aos seus dados.',
        'confirm',
        'Desvincular Contador',
        async () => {
            try {
                // Optimistic Update
                setCurrentUser(prev => ({ ...prev, accountantId: null }));

                await api.post('/accountants/unlink');
                
                // Force a fresh fetch
                const response = await api.get('/auth/me');
                if (response.data) {
                    console.log('User state updated after unlink:', response.data);
                    setCurrentUser(response.data);
                    
                    // Also update localStorage to keep Navbar in sync
                    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                    localStorage.setItem('user', JSON.stringify({ ...localUser, ...response.data }));
                }
                
                showAlert('Vínculo removido com sucesso!', 'success', 'Sucesso');
            } catch (error) {
                console.error('Error unlinking accountant:', error);
                await fetchCurrentUser(); // Revert state
                showAlert('Erro ao desvincular contador.', 'error', 'Erro');
            }
        }
    );
  };

  const handleDeleteMyAccountant = (accountantId, accountantName) => {
    showAlert(
        `Tem certeza que deseja deletar seu escritório "${accountantName}"? Esta ação não pode ser desfeita.`,
        'confirm',
        'Deletar Escritório',
        async () => {
            try {
                await api.delete(`/accountants/${accountantId}`);
                showAlert('Escritório deletado com sucesso!', 'success', 'Sucesso');
                fetchAccountants(); // Refresh list
            } catch (error) {
                console.error('Error deleting accountant:', error);
                showAlert(error.response?.data?.message || 'Erro ao deletar escritório.', 'error', 'Erro');
            }
        }
    );
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              Marketplace de Contadores
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Encontre o especialista ideal para o seu negócio
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105 font-medium flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Cadastrar meu Escritório
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accountants.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
                Nenhum escritório encontrado. Seja o primeiro a se cadastrar!
              </div>
            ) : (
              accountants.map((acc) => (
                <motion.div
                  key={acc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                        {acc.image ? (
                          <img 
                            src={acc.image} 
                            alt={acc.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-slate-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{acc.name}</h3>
                          {acc.verified && (
                            <div className="group relative">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-10">
                                Verificado
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full font-medium mt-1">
                          {acc.specialty}
                        </span>
                        {acc.crc && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            CRC: {acc.crc}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                      {acc.description || 'Sem descrição disponível.'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {acc.tags && (() => {
                          try {
                              const parsed = Array.isArray(acc.tags) ? acc.tags : JSON.parse(acc.tags);
                              return Array.isArray(parsed) ? parsed : [];
                          } catch (e) {
                              return typeof acc.tags === 'string' ? acc.tags.split(',').map(t => t.trim()) : [];
                          }
                      })().map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                      {/* Ações principais (Contato e Vincular) */}
                      <div className="flex justify-between items-center gap-2">
                        <button 
                          onClick={() => handleContact(acc.email)}
                          className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                          Entrar em Contato
                        </button>
                        
                        {/* Ensure types match for comparison */}
                        {String(currentUser?.accountantId) === String(acc.id) ? (
                          <button 
                              onClick={handleUnlink}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
                          >
                              Desvincular
                          </button>
                        ) : (
                          <button 
                              onClick={() => handleLink(acc.id)}
                              disabled={!!currentUser?.accountantId}
                              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm ${
                                  // Convert both to String/Number to avoid type mismatch
                                  String(currentUser?.accountantId) === String(acc.id)
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                              title={currentUser?.accountantId ? 'Você já possui um contador vinculado' : ''}
                          >
                              {/* Explicit check for already linked same ID */}
                              {String(currentUser?.accountantId) === String(acc.id) 
                                  ? 'Vinculado' 
                                  : (currentUser?.accountantId ? 'Indisponível' : 'Vincular Perfil')}
                          </button>
                        )}
                      </div>

                      {/* Botão de deletar (só aparece se for o dono do escritório) */}
                      {currentUser && String(currentUser.id) === String(acc.userId) && (
                          <button 
                            onClick={() => handleDeleteMyAccountant(acc.id, acc.name)}
                            className="w-full bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-600/20 hover:from-blue-500/30 hover:via-indigo-500/30 hover:to-blue-600/30 dark:from-blue-400/25 dark:via-indigo-400/25 dark:to-blue-500/25 dark:hover:from-blue-400/40 dark:hover:via-indigo-400/40 dark:hover:to-blue-500/40 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 border border-blue-300/60 dark:border-blue-400/40 hover:border-blue-400 dark:hover:border-blue-300/60 flex items-center justify-center gap-2 group shadow-md hover:shadow-xl hover:shadow-blue-500/20 dark:hover:shadow-blue-400/20 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="group-hover:tracking-wide transition-all duration-300">Remover Meu Cadastro</span>
                          </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Cadastro */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Cadastrar Escritório</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Escritório</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Silva Contabilidade"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número do CRC</label>
                  <input
                    type="text"
                    name="crc"
                    value={formData.crc}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${crcError ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'} bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="Ex: SP-123456/O-8"
                  />
                  {crcError && <p className="text-red-500 text-xs mt-1">{crcError}</p>}
                  <p className="text-xs text-slate-500 mt-1">Formato: UF-000000/T-D (Ex: SP-123456/O-8, RJ-654321/P-5)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Especialidade Principal</label>
                  <select
                    name="specialty"
                    required
                    value={formData.specialty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="MEI e Simples Nacional">MEI e Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Consultoria Financeira">Consultoria Financeira</option>
                    <option value="Auditoria">Auditoria</option>
                    <option value="Departamento Pessoal">Departamento Pessoal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Descreva seus serviços..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: imposto de renda, abertura de empresa, bpo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logo / Foto</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">Formatos: JPG, PNG, WEBP (Max 10MB)</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center"
                  >
                    {uploading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Cadastrar'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;
