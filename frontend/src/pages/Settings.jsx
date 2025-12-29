import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from '../contexts/ThemeContext';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences'

  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [formData, setFormData] = useState({
    name: '',
    cpfCnpj: '',
    address: ''
  });

  // Load user data on mount
  useEffect(() => {
    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            setFormData({
                name: res.data.name || '',
                cpfCnpj: res.data.cpfCnpj || '',
                address: res.data.address || ''
            });
            if (res.data.logo) {
                const API_URL = import.meta.env.VITE_API_URL;
                const BASE_URL = API_URL ? API_URL.replace('/api', '') : '';
                setLogoPreview(`${BASE_URL}/uploads/logos/${res.data.logo}`);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };
    fetchUser();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await api.put('/auth/profile', formData);
        
        // Update local user state
        const updatedUser = { ...user, ...formData };
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
        setAlertState({
            isOpen: true,
            title: t('common.error'),
            message: error.response?.data?.message || t('settings.update_error') || 'Falha ao atualizar perfil.',
            type: 'error'
        });
    } finally {
        setLoading(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
        
        // Update local user state
        const updatedUser = { ...user, logo: res.data.logo };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update preview with server URL to be sure
        const API_URL = import.meta.env.VITE_API_URL;
        const BASE_URL = API_URL ? API_URL.replace('/api', '') : '';
        setLogoPreview(`${BASE_URL}/uploads/logos/${res.data.logo}`);

        setAlertState({
            isOpen: true,
            title: t('common.success'),
            message: t('settings.success_update'),
            type: 'success'
        });
    } catch (error) {
        console.error('Upload error:', error);
        setAlertState({
            isOpen: true,
            title: t('common.error'),
            message: error.response?.data?.message || t('settings.upload_error'),
            type: 'error'
        });
        // Revert preview on error (optional)
    } finally {
        setLoading(false);
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
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
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
      <div className="flex space-x-4 border-b border-slate-200 dark:border-white/10">
        <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile' 
                ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
            }`}
        >
            {t('settings.company_data')}
        </button>
        <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preferences' 
                ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
            }`}
        >
            {t('settings.appearance')}
        </button>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-8 space-y-8 backdrop-blur-md transition-colors shadow-sm dark:shadow-none">
        
        {activeTab === 'profile' && (
            <div className="space-y-8 animate-fadeIn">
                {/* Personal/Company Data Form */}
                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        <div className="space-y-2 md:col-span-2">
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
                                        accept="image/*"
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
                                    className="max-h-32 object-contain" 
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

        {activeTab === 'preferences' && (
            <div className="space-y-8 animate-fadeIn">
                
                {/* Language Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">{t('settings.language')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { code: 'pt', label: 'Português', flag: '🇧🇷' },
                            { code: 'en', label: 'English', flag: '🇺🇸' },
                            { code: 'es', label: 'Español', flag: '🇪🇸' }
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

      </div>
    </div>
  );
};

export default Settings;