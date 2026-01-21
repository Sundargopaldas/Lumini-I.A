import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CustomAlert from '../components/CustomAlert';

const Admin = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('accountants');
  const [accountants, setAccountants] = useState([]);
  const [smtpConfig, setSmtpConfig] = useState({
      SMTP_HOST: '',
      SMTP_PORT: '587',
      SMTP_USER: '',
      SMTP_PASS: '',
      SMTP_SECURE: 'false',
      SMTP_FROM: ''
  });
  const [emailStatus, setEmailStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [alert, setAlert] = useState({ 
    show: false, 
    message: '', 
    type: 'success',
    title: '',
    onConfirm: null 
  });

  // Define showAlert FIRST before using it
  const showAlert = (message, type = 'info', title = '', onConfirm = null) => {
    setAlert({ 
        show: true, 
        message, 
        type, 
        title: title || (type === 'error' ? 'Erro' : (type === 'success' ? 'Sucesso' : 'Atenção')),
        onConfirm 
    });
  };

  useEffect(() => {
    if (activeTab === 'accountants') {
        fetchAccountants();
    } else if (activeTab === 'settings') {
        fetchSmtpConfig();
    }
  }, [activeTab]);

  const fetchSmtpConfig = async () => {
    try {
        setLoading(true);
        const [configRes, statusRes] = await Promise.all([
          api.get('/admin/config/smtp'),
          api.get('/admin/email-status')
        ]);
        setSmtpConfig(configRes.data);
        setEmailStatus(statusRes.data);
        console.log('📧 Email Status:', statusRes.data);
    } catch (error) {
        console.error('Error loading SMTP config', error);
        showAlert(
            'Erro ao carregar configurações. Verifique se você é administrador e se o servidor está online.', 
            'error'
        );
    } finally {
        setLoading(false);
    }
  };

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

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setSmtpConfig(prev => {
        const newConfig = { ...prev, [name]: value };

        // Lógica para ajustar a segurança (SSL/TLS) com base na porta
        if (name === 'SMTP_PORT') {
            if (value.trim() === '465') {
                newConfig.SMTP_SECURE = 'true';
            } else if (value.trim() === '587') {
                newConfig.SMTP_SECURE = 'false';
            }
        }
        
        // Lógica inversa: se o usuário mudar a segurança, ajusta a porta
        if (name === 'SMTP_SECURE') {
            if (value === 'true' && prev.SMTP_PORT !== '465') {
                newConfig.SMTP_PORT = '465';
            } else if (value === 'false' && prev.SMTP_PORT !== '587') {
                newConfig.SMTP_PORT = '587';
            }
        }

        return newConfig;
    });
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
        await api.post('/admin/config/smtp', smtpConfig);
        showAlert('Configurações salvas com sucesso!', 'success');
    } catch (error) {
        console.error(error);
        showAlert('Erro ao salvar configurações', 'error');
    }
  };

  const handleTestConfig = async () => {
    try {
      setTesting(true);
      const res = await api.post('/admin/config/smtp/test', smtpConfig);
      showAlert(res.data.message, 'success');
    } catch (error) {
      console.error('Error testing SMTP config:', error);
      const msg = error.response?.data?.message || 'Falha ao testar conexão SMTP';
      showAlert(msg, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleClearSmtpDb = async () => {
    console.log('🧹 Iniciando limpeza de SMTP do banco...');
    
    const confirmMsg = '🧹 Limpar configurações SMTP do banco?\n\n' +
                      'Isso vai remover todas as configs SMTP salvas no banco de dados.\n\n' +
                      'O sistema passará a usar APENAS as variáveis de ambiente (Hostinger).\n\n' +
                      'Continuar?';
    
    if (!confirm(confirmMsg)) {
      console.log('⚠️ Usuário cancelou a limpeza');
      return;
    }

    try {
      setTesting(true);
      console.log('📤 Enviando requisição para /admin/clear-smtp-db...');
      
      const res = await api.post('/admin/clear-smtp-db');
      
      console.log('✅ Resposta recebida:', res.data);
      
      const successMsg = `✅ SMTP Limpo com Sucesso!\n\n` +
                        `Configurações removidas: ${res.data.deletedCount}\n\n` +
                        `🎯 Config ativa agora:\n` +
                        `Host: ${res.data.activeConfig.EMAIL_HOST}\n` +
                        `Port: ${res.data.activeConfig.EMAIL_PORT}\n` +
                        `User: ${res.data.activeConfig.EMAIL_USER}\n\n` +
                        `Agora teste o email de recuperação de senha!`;
      
      showAlert(successMsg, 'success', '✅ SMTP Limpo');
      alert(successMsg);
      
      // Recarregar status do email
      fetchSmtpConfig();
      
    } catch (error) {
      console.error('❌ ERRO ao limpar SMTP:', error);
      
      const errorMsg = error.response?.data?.message || error.message || 'Erro desconhecido';
      const fullErrorMsg = `❌ ERRO AO LIMPAR SMTP\n\n` +
                          `Mensagem: ${errorMsg}\n\n` +
                          `Status HTTP: ${error.response?.status || 'N/A'}`;
      
      showAlert(fullErrorMsg, 'error', '❌ Erro');
      alert(fullErrorMsg);
      
    } finally {
      setTesting(false);
      console.log('🏁 Limpeza finalizada');
    }
  };

  const handleQuickEmailTest = async () => {
    console.log('🚀 Botão de teste clicado!');
    
    let testEmail;
    try {
      const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      const defaultEmail = user?.email || '';
      console.log('📧 Email padrão:', defaultEmail);
      
      testEmail = prompt('Digite o email para receber o teste:', defaultEmail);
      console.log('📧 Email digitado:', testEmail);
    } catch (err) {
      console.error('❌ Erro ao obter email do usuário:', err);
      testEmail = prompt('Digite o email para receber o teste:');
    }
    
    if (!testEmail) {
      console.log('⚠️ Usuário cancelou ou não digitou email');
      alert('⚠️ Email não fornecido. Teste cancelado.');
      return;
    }

    console.log('🔄 Iniciando teste de email...');
    
    try {
      setTesting(true);
      console.log('📤 Enviando requisição para /admin/test-email...');
      
      const res = await api.post('/admin/test-email', { testEmail });
      
      console.log('✅ Resposta recebida:', res.data);
      
      const successMsg = `✅ Email enviado com sucesso!\n\n` +
                        `Para: ${testEmail}\n\n` +
                        `⚠️ IMPORTANTE: Verifique sua caixa de entrada E a pasta SPAM!\n\n` +
                        `Message ID: ${res.data.messageId || 'N/A'}`;
      
      showAlert(successMsg, 'success', '✅ Email Enviado');
      alert(successMsg); // Alert adicional para garantir que veja
      
    } catch (error) {
      console.error('❌ ERRO COMPLETO:', error);
      console.error('❌ Response:', error.response);
      console.error('❌ Response Data:', error.response?.data);
      
      const errorMsg = error.response?.data?.message || error.message || 'Erro desconhecido ao enviar email';
      const errorCode = error.response?.data?.code || 'N/A';
      const errorDetails = error.response?.data?.error || 'Sem detalhes adicionais';
      
      const fullErrorMsg = `❌ ERRO AO ENVIAR EMAIL\n\n` +
                          `Mensagem: ${errorMsg}\n\n` +
                          `Código: ${errorCode}\n\n` +
                          `Detalhes: ${errorDetails}\n\n` +
                          `Status HTTP: ${error.response?.status || 'N/A'}`;
      
      showAlert(fullErrorMsg, 'error', '❌ Erro no Envio');
      alert(fullErrorMsg); // Alert adicional para garantir que veja
      
    } finally {
      setTesting(false);
      console.log('🏁 Teste finalizado');
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

  const handleDelete = (id) => {
    showAlert(
        'Tem certeza que deseja remover este escritório?',
        'confirm',
        'Remover Escritório',
        async () => {
            try {
                await api.delete(`/accountants/${id}`);
                setAccountants(prev => prev.filter(acc => acc.id !== id));
                showAlert('Contador removido com sucesso!', 'success', 'Sucesso');
            } catch (error) {
                console.error('Error deleting accountant:', error);
                showAlert('Erro ao remover contador', 'error', 'Erro');
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
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">
          Painel Administrativo
        </h1>

        {/* Tabs */}
        <div className="flex space-x-6 mb-8 border-b border-slate-200 dark:border-slate-700">
            <button
                onClick={() => setActiveTab('accountants')}
                className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'accountants'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
                Contadores
            </button>
            <button
                onClick={() => setActiveTab('settings')}
                className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'settings'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
                Configurações do Sistema
            </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === 'accountants' ? (
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
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 max-w-3xl">
            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Configuração de E-mail (SMTP)</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Configure o servidor de e-mail que será utilizado para enviar convites, recuperações de senha e notificações do sistema.
                </p>
            </div>

            {/* Status das Configurações de Email */}
            {emailStatus && (
              <div className={`mb-6 p-6 rounded-lg border-2 ${emailStatus.ready ? 'bg-green-50 dark:bg-green-900/10 border-green-500' : 'bg-red-50 dark:bg-red-900/10 border-red-500'}`}>
                <div className="flex items-start gap-3 mb-4">
                  {emailStatus.ready ? (
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-2 ${emailStatus.ready ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                      {emailStatus.ready ? '✅ Sistema de Email Configurado' : '❌ Sistema de Email NÃO Configurado'}
                    </h3>
                    <p className={`text-sm mb-4 ${emailStatus.ready ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {emailStatus.ready 
                        ? `Usando configurações do ${emailStatus.source === 'database' ? 'banco de dados' : 'servidor'}`
                        : 'Configure as credenciais SMTP abaixo para ativar o envio de emails'
                      }
                    </p>

                    {emailStatus.errors && emailStatus.errors.length > 0 && (
                      <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded p-3 mb-4">
                        <p className="font-bold text-red-800 dark:text-red-300 mb-2">⚠️ Erros Encontrados:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400">
                          {emailStatus.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <details className="mt-4">
                      <summary className="cursor-pointer font-medium text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                        🔍 Ver Detalhes Técnicos
                      </summary>
                      <div className="mt-3 space-y-3 text-xs">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Variáveis de Ambiente:</p>
                          <pre className="bg-slate-100 dark:bg-slate-900 p-2 rounded overflow-x-auto text-slate-800 dark:text-slate-200">
                            {JSON.stringify(emailStatus.env, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Banco de Dados:</p>
                          <pre className="bg-slate-100 dark:bg-slate-900 p-2 rounded overflow-x-auto text-slate-800 dark:text-slate-200">
                            {JSON.stringify(emailStatus.db, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t('admin_smtp.host_label')}
                        </label>
                        <input 
                            type="text" 
                            name="SMTP_HOST" 
                            value={smtpConfig.SMTP_HOST || ''} 
                            onChange={handleConfigChange}
                            placeholder="ex: smtp.gmail.com"
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t('admin_smtp.port_label')}
                        </label>
                        <input 
                            type="text" 
                            name="SMTP_PORT" 
                            value={smtpConfig.SMTP_PORT || ''} 
                            onChange={handleConfigChange}
                            placeholder="ex: 587"
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t('admin_smtp.security_label')}
                        </label>
                        <select 
                            name="SMTP_SECURE" 
                            value={smtpConfig.SMTP_SECURE || 'false'} 
                            onChange={handleConfigChange}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="false">{t('admin_smtp.security_no')}</option>
                            <option value="true">{t('admin_smtp.security_yes')}</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t('admin_smtp.user_label')}
                        </label>
                        <input 
                            type="email" 
                            name="SMTP_USER" 
                            value={smtpConfig.SMTP_USER || ''} 
                            onChange={handleConfigChange}
                            placeholder="ex: contato@lumini.ai"
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t('admin_smtp.password_label')}
                        </label>
                        <input 
                            type="password" 
                            name="SMTP_PASS" 
                            value={smtpConfig.SMTP_PASS || ''} 
                            onChange={handleConfigChange}
                            placeholder="********"
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                        <p className="mt-1 text-xs text-slate-500">{t('admin_smtp.password_hint')}</p>
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t('admin_smtp.from_label')}
                        </label>
                        <input 
                            type="text" 
                            name="SMTP_FROM" 
                            value={smtpConfig.SMTP_FROM || ''} 
                            onChange={handleConfigChange}
                            placeholder='ex: "Equipe Lumini" <contato@lumini.ai>'
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-end gap-3">
                    <button 
                        type="button"
                        onClick={handleClearSmtpDb}
                        disabled={testing}
                        className={`w-full sm:w-auto px-6 py-2.5 border-2 border-orange-500 dark:border-orange-400 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 ${testing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {testing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 dark:border-orange-300"></div>
                                Limpando...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                🧹 Limpar SMTP do Banco
                            </>
                        )}
                    </button>
                    <button 
                        type="button"
                        onClick={handleQuickEmailTest}
                        disabled={testing}
                        className={`w-full sm:w-auto px-6 py-2.5 border-2 border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 ${testing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {testing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 dark:border-purple-300"></div>
                                Enviando...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                🚀 Teste Rápido de Email
                            </>
                        )}
                    </button>
                    <button 
                        type="button"
                        onClick={handleTestConfig}
                        disabled={testing}
                        className={`w-full sm:w-auto px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 ${testing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {testing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 dark:border-slate-300"></div>
                                Testando...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Testar Conexão
                            </>
                        )}
                    </button>
                    <button 
                        type="submit" 
                        className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('admin_smtp.save_button')}
                    </button>
                </div>
            </form>
          </div>
        )}
      </div>

      <CustomAlert 
        isOpen={alert.show} 
        message={alert.message} 
        type={alert.type} 
        onClose={() => setAlert(prev => ({ ...prev, show: false }))} 
        title={alert.title}
        onConfirm={alert.onConfirm}
      />
    </div>
  );
};

export default Admin;
