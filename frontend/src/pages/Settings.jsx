import { useState, useEffect } from 'react';
import api from '../services/api';
import CustomAlert from '../components/CustomAlert';

const Settings = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Load user data on mount
  useEffect(() => {
    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
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
            title: 'Sucesso',
            message: 'Logotipo atualizado com sucesso!',
            type: 'success'
        });
    } catch (error) {
        console.error('Upload error:', error);
        setAlertState({
            isOpen: true,
            title: 'Erro',
            message: 'Falha ao enviar logotipo.',
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
        title: 'Remover Logotipo',
        message: 'Tem certeza que deseja remover o logotipo da empresa?',
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
                    title: 'Sucesso',
                    message: 'Logotipo removido.',
                    type: 'success'
                });
            } catch (error) {
                console.error('Delete error:', error);
                setAlertState({
                    isOpen: true,
                    title: 'Erro',
                    message: 'Falha ao remover logotipo.',
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
    <div className="space-y-8 max-w-4xl mx-auto">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm}
      />

      <div>
        <h1 className="text-2xl font-bold text-white">Configurações da Empresa</h1>
        <p className="text-gray-400 text-sm">Personalize sua experiência e documentos.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-8">
        
        {/* Logo Section */}
        <div className="space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-semibold text-white">Logotipo da Empresa</h3>
                    <p className="text-gray-400 text-sm">
                        Este logotipo será exibido nas Notas Fiscais (NFS-e) e relatórios PDF.
                        {!isPremium && <span className="text-yellow-500 block mt-1">Recurso exclusivo Premium/Agency.</span>}
                    </p>
                </div>
                {isPremium && (
                    <div className="relative group">
                        <label className={`cursor-pointer inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {loading ? 'Enviando...' : 'Alterar Logo'}
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
            <div className="bg-slate-900/50 rounded-lg p-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 min-h-[200px]">
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
                                title="Remover Logo"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-600 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p>Nenhum logo configurado</p>
                    </div>
                )}
            </div>

            {!isPremium && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3">
                    <span className="text-2xl">🔒</span>
                    <div>
                        <p className="text-yellow-200 font-semibold text-sm">Recurso Bloqueado</p>
                        <p className="text-yellow-200/60 text-xs">Faça upgrade para o plano Premium para personalizar seus documentos com sua marca.</p>
                    </div>
                </div>
            )}
        </div>

        <div className="border-t border-white/10 pt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Dados da Conta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nome de Usuário</label>
                    <input type="text" value={user.username || ''} disabled className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white opacity-60 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                    <input type="email" value={user.email || ''} disabled className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white opacity-60 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Plano Atual</label>
                    <div className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white opacity-60 flex items-center justify-between">
                        <span className="uppercase font-bold text-purple-400">{user.plan}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;