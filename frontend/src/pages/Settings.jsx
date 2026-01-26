import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from '../contexts/ThemeContext';
import { extractErrorMessage } from '../utils/errorHandler';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'fiscal' | 'preferences'
  
  // Set active tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'accountant', 'fiscal', 'preferences', 'legal'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Limpar cache antigo da logo (fix temporário)
  const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
  if (cachedUser.logo && typeof cachedUser.logo === 'string' && cachedUser.logo.includes('luminiiadigital.com.br')) {
    console.log('🔧 [FIX] Limpando URL antiga da logo do cache');
    // Extrair apenas o filename
    cachedUser.logo = cachedUser.logo.split('/').pop();
    localStorage.setItem('user', JSON.stringify(cachedUser));
  }
  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  
  // Certificate State
  const [certPassword, setCertPassword] = useState('');
  const [certFile, setCertFile] = useState(null);
  const [certStatus, setCertStatus] = useState(null); // { configured: bool, expirationDate: string }

  // Accountant Invite State
  const [accountantEmail, setAccountantEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  const [formData, setFormData] = useState({
    name: '',
    cpfCnpj: '',
    address: '',
    municipalRegistration: '',
    taxRegime: 'simples' // Valores válidos: 'mei', 'simples', 'presumido', 'real'
  });

  // Load user data on mount
  useEffect(() => {
    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            console.log('📥 [SETTINGS] User data carregado:', res.data);
            console.log('🖼️ [SETTINGS] Logo do user:', res.data.logo);
            
            setUser(res.data);
            // Atualizar localStorage com dados mais recentes
            localStorage.setItem('user', JSON.stringify(res.data));
            
            // Mapear taxRegime do backend para valores válidos do schema
            const taxRegimeMap = {
                'MEI': 'mei',
                'Simples Nacional': 'simples',
                'Lucro Presumido': 'presumido',
                'Lucro Real': 'real'
            };
            const backendTaxRegime = res.data.taxRegime || 'Simples Nacional';
            const mappedTaxRegime = taxRegimeMap[backendTaxRegime] || 'simples';
            
            setFormData({
                name: res.data.name || '',
                cpfCnpj: res.data.cpfCnpj || '',
                address: res.data.address || '',
                municipalRegistration: res.data.municipalRegistration || '',
                taxRegime: mappedTaxRegime
            });
            
            if (res.data.logo) {
                // Usar a URL atual do navegador para construir o caminho da logo
                const logoUrl = `${window.location.origin}/uploads/logos/${res.data.logo}`;
                setLogoPreview(logoUrl);
                console.log('✅ [SETTINGS] Logo preview definida:', logoUrl);
            } else {
                console.log('⚠️ [SETTINGS] Nenhuma logo encontrada no perfil');
            }

            // Fetch Certificate Status
            try {
                const certRes = await api.get('/certificates/status');
                setCertStatus(certRes.data);
            } catch (err) {
                console.error('Error fetching cert status', err);
            }

        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };
    fetchUser();
  }, []);

  const handleFillTestData = () => {
    setFormData({
        ...formData,
        municipalRegistration: '12345678',
        taxRegime: 'mei' // Valor válido do schema
    });
    setAlertState({
        isOpen: true,
        title: 'Dados Preenchidos',
        message: 'Dados de exemplo preenchidos. Clique em "Salvar Dados" para confirmar.',
        type: 'success'
    });
  };

  const handleInviteAccountant = async (e) => {
    e.preventDefault();
    if (!accountantEmail) return;

    setInviteStatus('loading');
    
    try {
        const res = await api.post('/accountants/invite', { email: accountantEmail });
        
        setInviteStatus('success');
        setAlertState({
            isOpen: true,
            title: res.data.status === 'linked' ? 'Contador Vinculado' : 'Convite Enviado',
            message: res.data.message,
            type: 'success'
        });
        setAccountantEmail('');
    } catch (error) {
        console.error('Invite error:', error);
        setInviteStatus('error');
        setAlertState({
            isOpen: true,
            title: 'Erro',
            message: error.response?.data?.message || 'Erro ao enviar convite.',
            type: 'error'
        });
    }
  };

  const handleCertUpload = async (e) => {
    e.preventDefault();
    if (!certFile || !certPassword) {
        setAlertState({
            isOpen: true,
            title: 'Erro',
            message: 'Selecione o arquivo e digite a senha.',
            type: 'error'
        });
        return;
    }

    const formDataCert = new FormData();
    formDataCert.append('certificate', certFile);
    formDataCert.append('password', certPassword);

    setLoading(true);
    try {
        const res = await api.post('/certificates/upload', formDataCert, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setCertStatus({
            configured: true,
            expirationDate: res.data.expiration,
            status: 'active'
        });
        setAlertState({
            isOpen: true,
            title: 'Sucesso',
            message: 'Certificado Digital configurado com sucesso!',
            type: 'success'
        });
        setCertFile(null);
        setCertPassword('');
    } catch (error) {
        setAlertState({
            isOpen: true,
            title: 'Erro',
            message: error.response?.data?.message || 'Erro ao enviar certificado.',
            type: 'error'
        });
    } finally {
        setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        // Validar taxRegime antes de enviar
        const validTaxRegimes = ['mei', 'simples', 'presumido', 'real'];
        const taxRegimeToSend = validTaxRegimes.includes(formData.taxRegime) 
          ? formData.taxRegime 
          : 'simples'; // Fallback para valor válido
        
        const dataToSend = {
          ...formData,
          taxRegime: taxRegimeToSend
        };
        
        const res = await api.put('/auth/profile', dataToSend);
        
        // Update local user state
        const updatedUser = { ...user, ...res.data.user || formData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setAlertState({
            isOpen: true,
            title: t('common.success'),
            message: t('settings.success_update'),
            type: 'success'
        });
    } catch (error) {
        console.error('Update error:', error);
        const { title, message } = extractErrorMessage(error);
        setAlertState({
            isOpen: true,
            title: title || t('common.error'),
            message: message || t('settings.update_error') || 'Falha ao atualizar perfil.',
            type: 'error'
        });
    } finally {
        setLoading(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate File Size (10MB para alta qualidade)
    if (file.size > 10 * 1024 * 1024) {
        setAlertState({
            isOpen: true,
            title: t('common.error'),
            message: 'O arquivo é muito grande. O tamanho máximo permitido é 10MB.',
            type: 'error'
        });
        e.target.value = ''; // Reset input
        return;
    }

    // Validate File Type (incluindo SVG para logos vetoriais)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
        setAlertState({
             isOpen: true,
             title: t('common.error'),
             message: 'Formato inválido. Apenas imagens (JPG, PNG, WEBP, SVG) são permitidas.',
             type: 'error'
        });
        e.target.value = ''; // Reset input
        return;
    }

    const previousPreview = logoPreview; // Capture current state for reversion

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
        setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('logo', file);

    setLoading(true);
    try {
        const res = await api.post('/auth/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Construir URL completa da logo usando origem atual
        const fullLogoUrl = `${window.location.origin}/uploads/logos/${res.data.logo}`;
        
        // Update local user state com a logo salva
        const updatedUser = { ...user, logo: res.data.logo };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update preview
        setLogoPreview(fullLogoUrl);
        
        console.log('✅ [LOGO UPLOAD] Logo salva:', res.data.logo);
        console.log('✅ [LOGO UPLOAD] URL completa:', fullLogoUrl);
        console.log('✅ [LOGO UPLOAD] User atualizado no localStorage');

        setAlertState({
            isOpen: true,
            title: t('common.success'),
            message: t('settings.success_update'),
            type: 'success'
        });
    } catch (error) {
        console.error('Upload error:', error);
        
        // Revert preview on error
        setLogoPreview(previousPreview);

        let errorMessage = t('settings.upload_error');
        if (error.response && error.response.data && error.response.data.message) {
             errorMessage = error.response.data.message;
        } else if (error.message) {
             errorMessage = error.message;
        }

        setAlertState({
            isOpen: true,
            title: t('common.error'),
            message: errorMessage,
            type: 'error'
        });
    } finally {
        setLoading(false);
        e.target.value = ''; // Reset input to allow re-selection
    }
  };

  const handleRemoveLogo = () => {
    setAlertState({
        isOpen: true,
        title: t('settings.remove_logo_title'),
        message: t('settings.remove_logo_confirm'),
        type: 'confirm',
        onConfirm: async () => {
            setLoading(true);
            try {
                await api.delete('/auth/logo');
                
                const updatedUser = { ...user, logo: null };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setLogoPreview(null);

                setAlertState({
                    isOpen: true,
                    title: t('common.success'),
                    message: t('settings.logo_removed'),
                    type: 'success'
                });
            } catch (error) {
                console.error('Delete error:', error);
                setAlertState({
                    isOpen: true,
                    title: t('common.error'),
                    message: error.response?.data?.message || t('settings.remove_error'),
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        }
    });
  };

  const isPremium = ['premium', 'agency'].includes(user.plan);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 px-4 sm:px-6 ipad-air:px-8">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm}
      />

      <div>
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{t('settings.title')}</h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm transition-colors">{t('settings.subtitle')}</p>
            </div>
            <a 
                href="/dashboard" 
                className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Fechar Configurações"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-1 scrollbar-hide">
        <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'profile' 
                ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
            }`}
        >
            {t('settings.company_data')}
        </button>
        <button
            onClick={() => setActiveTab('accountant')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'accountant' 
                ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
            }`}
        >
            Convidar Contador
        </button>
        <button
            onClick={() => setActiveTab('fiscal')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'fiscal' 
                ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
            }`}
        >
            Dados Fiscais & Certificado
        </button>
        <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'preferences' 
                ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
            }`}
        >
            {t('settings.appearance')}
        </button>
        <button
            onClick={() => setActiveTab('legal')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'legal' 
                ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
            }`}
        >
            Privacidade
        </button>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6 sm:p-8 ipad-air:p-10 space-y-8 backdrop-blur-md transition-colors shadow-sm dark:shadow-none">
        
        {activeTab === 'profile' && (
            <div className="space-y-8 animate-fadeIn">
                {/* Personal/Company Data Form */}
                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 ipad-air:grid-cols-2 md:grid-cols-2 gap-6 ipad-air:gap-7">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('settings.company_name')}
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder={t('settings.company_name_placeholder')}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('settings.address')}
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder={t('settings.address_placeholder')}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? t('settings.saving') : t('settings.save')}
                        </button>
                    </div>
                </form>

                <div className="border-t border-slate-200 dark:border-white/10 pt-8">
                    {/* Logo Section */}
                    <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">{t('settings.company_logo')}</h3>
                            <p className="text-slate-500 dark:text-gray-400 text-sm transition-colors">
                                {t('settings.logo_description')}
                                {!isPremium && <span className="text-yellow-600 dark:text-yellow-500 block mt-1">{t('settings.premium_exclusive')}</span>}
                            </p>
                        </div>
                        {isPremium && (
                            <div className="relative group">
                                <label className={`cursor-pointer inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {loading ? t('settings.saving') : t('settings.change_logo')}
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                                        onChange={handleLogoChange}
                                        disabled={loading}
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Preview Box */}
                    <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 min-h-[200px] transition-colors">
                        {logoPreview ? (
                            <div className="relative group">
                                <img 
                                    src={logoPreview} 
                                    alt="Logo Preview" 
                                    className="max-h-48 max-w-full object-contain" 
                                    style={{ imageRendering: 'auto', maxWidth: '300px' }}
                                    onError={(e) => {e.target.src = 'https://via.placeholder.com/150?text=Erro+Imagem'}}
                                />
                                {isPremium && (
                                    <button 
                                        onClick={handleRemoveLogo}
                                        className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title={t('settings.remove_logo')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p>{t('settings.no_logo')}</p>
                            </div>
                        )}
                    </div>

                    {!isPremium && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <p className="text-yellow-700 dark:text-yellow-200 font-semibold text-sm">{t('settings.feature_locked')}</p>
                                <p className="text-yellow-600/80 dark:text-yellow-200/60 text-xs">{t('settings.upgrade_to_premium')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        )}

        {activeTab === 'accountant' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Convidar Contador</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Dê acesso seguro ao seu contador para que ele possa visualizar suas notas fiscais e relatórios financeiros sem precisar da sua senha.
              </p>
              
              <form onSubmit={handleInviteAccountant} className="max-w-md">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    E-mail do Contador
                  </label>
                  <input
                    type="email"
                    required
                    value={accountantEmail}
                    onChange={(e) => setAccountantEmail(e.target.value)}
                    placeholder="ex: contador@escritorio.com"
                    className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2.5 border transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={inviteStatus === 'loading'}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
                >
                  {inviteStatus === 'loading' ? 'Enviando...' : 'Enviar Convite'}
                </button>
              </form>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1 md:flex md:justify-between">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Seu contador receberá um e-mail com instruções para acessar sua conta de forma segura. Ele terá acesso apenas a leitura de dados fiscais.
                        </p>
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'fiscal' && (
            <div className="space-y-8 animate-fadeIn">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-5">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl">🔒</span>
                        <div>
                            <h4 className="text-red-800 dark:text-red-200 font-bold text-lg mb-2">⚠️ CERTIFICADO DIGITAL OBRIGATÓRIO</h4>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                                O <strong>Certificado Digital A1</strong> é <strong>OBRIGATÓRIO</strong> para emitir notas fiscais com validade legal.
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400">
                                ❌ Sem certificado = Não é possível emitir notas fiscais<br/>
                                ✅ Com certificado = Notas fiscais oficiais e com valor jurídico
                            </p>
                        </div>
                    </div>
                </div>

                {/* Fiscal Data Form */}
                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Dados da Empresa</h3>
                    
                    <div className="grid grid-cols-1 ipad-air:grid-cols-2 md:grid-cols-2 gap-6 ipad-air:gap-7">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('settings.cpf_cnpj')}
                            </label>
                            <input
                                type="text"
                                name="cpfCnpj"
                                value={formData.cpfCnpj}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder={t('settings.cpf_cnpj_placeholder')}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Regime Tributário
                            </label>
                            <select
                                name="taxRegime"
                                value={formData.taxRegime}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all"
                            >
                                <option value="mei">MEI (Microempreendedor Individual)</option>
                                <option value="simples">Simples Nacional</option>
                                <option value="presumido">Lucro Presumido</option>
                                <option value="real">Lucro Real</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {formData.taxRegime === 'mei' ? 'Inscrição Municipal (CCM)' : 'Inscrição Municipal'} <span className="text-xs text-gray-500 font-normal">(Opcional)</span>
                            </label>
                            <input
                                type="text"
                                name="municipalRegistration"
                                value={formData.municipalRegistration}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all"
                                placeholder={formData.taxRegime === 'mei' ? "Ex: 12345 (CCM)" : "Ex: 12345678"}
                            />
                        </div>
                    </div>

                    {formData.taxRegime === 'mei' && (
                         <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200">
                             <p><strong>💡 Dica para MEI:</strong></p>
                             <ul className="list-disc ml-5 mt-1 space-y-1">
                                 <li>Seu CCM (Inscrição Municipal) pode ser encontrado no alvará ou consulta na prefeitura.</li>
                                 <li>MEI Prestador de Serviços geralmente não possui Inscrição Estadual.</li>
                             </ul>
                         </div>
                    )}

                    <div className="flex justify-end gap-3">
                         <button
                            type="button"
                            onClick={handleFillTestData}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
                        >
                            Preencher Exemplo
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                        >
                            {loading ? 'Salvando...' : 'Salvar Dados'}
                        </button>
                    </div>
                </form>

                <hr className="border-slate-200 dark:border-white/10" />

                {/* Certificate Section */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Certificado Digital (A1)</h3>
                        {certStatus?.configured && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                                ATIVO (Expira em: {new Date(certStatus.expirationDate).toLocaleDateString()})
                            </span>
                        )}
                    </div>

                    <form onSubmit={handleCertUpload} className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Arquivo do Certificado (.pfx ou .p12)
                            </label>
                            <input
                                type="file"
                                accept=".pfx,.p12"
                                onChange={(e) => setCertFile(e.target.files[0])}
                                className="block w-full text-sm text-slate-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-purple-50 file:text-purple-700
                                    hover:file:bg-purple-100
                                    dark:file:bg-purple-900/30 dark:file:text-purple-300
                                "
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Senha do Certificado
                            </label>
                            <input
                                type="password"
                                value={certPassword}
                                onChange={(e) => setCertPassword(e.target.value)}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all"
                                placeholder="Digite a senha..."
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || !certFile}
                                className={`w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors ${loading ? 'opacity-50' : ''}`}
                            >
                                {loading ? 'Enviando...' : 'Configurar Certificado'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {activeTab === 'preferences' && (
            <div className="space-y-8 animate-fadeIn">
                
                {/* Language Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">{t('settings.language')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { code: 'pt', label: 'Português', flag: '🇧🇷' },
                            { code: 'en', label: 'English', flag: '🇺🇸' }
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => i18n.changeLanguage(lang.code)}
                                className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                                    i18n.language.startsWith(lang.code)
                                    ? 'bg-purple-600/10 dark:bg-purple-600/20 border-purple-500 ring-1 ring-purple-500'
                                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                                }`}
                            >
                                <span className="text-2xl">{lang.flag}</span>
                                <span className={`font-medium ${i18n.language.startsWith(lang.code) ? 'text-purple-700 dark:text-white' : 'text-slate-700 dark:text-white'}`}>{lang.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-white/10 my-6"></div>

                {/* Theme Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">{t('settings.theme')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { id: 'light', label: t('settings.theme_light'), icon: '☀️' },
                            { id: 'dark', label: t('settings.theme_dark'), icon: '🌙' },
                            { id: 'system', label: t('settings.theme_system'), icon: '💻' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setTheme(item.id)}
                                className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                                    theme === item.id
                                    ? 'bg-purple-600/10 dark:bg-purple-600/20 border-purple-500 ring-1 ring-purple-500'
                                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                                }`}
                            >
                                <span className="text-2xl">{item.icon}</span>
                                <span className={`font-medium ${theme === item.id ? 'text-purple-700 dark:text-white' : 'text-slate-700 dark:text-white'}`}>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        )}

        {activeTab === 'legal' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Documentos Legais</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Acesse nossos documentos de transparência e conformidade legal.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        to="/terms"
                        className="group p-6 bg-slate-50 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-700 rounded-xl transition-all"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors">
                                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                        Termos de Uso
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        Regras de utilização da plataforma
                                    </p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </div>
                    </Link>

                    <Link
                        to="/privacy"
                        className="group p-6 bg-slate-50 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-700 rounded-xl transition-all"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors">
                                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                        Política de Privacidade
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        Como tratamos seus dados (LGPD)
                                    </p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </div>
                    </Link>
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10 my-8"></div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Seus Direitos (LGPD)</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 space-y-3">
                        <p className="text-sm text-blue-900 dark:text-blue-200">
                            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                        </p>
                        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2 list-disc list-inside ml-2">
                            <li>Acessar e exportar seus dados</li>
                            <li>Corrigir informações incompletas ou incorretas</li>
                            <li>Solicitar exclusão de seus dados</li>
                            <li>Revogar consentimentos a qualquer momento</li>
                            <li>Se opor ao tratamento de dados</li>
                        </ul>
                        <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2">
                                Entre em contato conosco:
                            </p>
                            <a 
                                href="mailto:privacidade@luminidigital.com.br" 
                                className="inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                privacidade@luminidigital.com.br
                            </a>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10 my-8"></div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Certificações e Conformidade</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-center">
                            <div className="text-2xl mb-2">🔒</div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">HTTPS/SSL</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Criptografia</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-center">
                            <div className="text-2xl mb-2">⚖️</div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">LGPD</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Compliant</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-center">
                            <div className="text-2xl mb-2">🇧🇷</div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dados no Brasil</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Servidores locais</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-center">
                            <div className="text-2xl mb-2">🔐</div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Backup</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Automático</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Settings;