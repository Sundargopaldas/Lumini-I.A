import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import ConnectModal from '../components/ConnectModal';
import CustomAlert from '../components/CustomAlert';

const Integrations = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState({});
  const [connectedIntegrations, setConnectedIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Custom Alert State
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertState({ isOpen: true, title, message, type, onConfirm });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const integrations = [
    // Phase 2: Open Finance & Payments
    {
      id: 'pluggy',
      name: 'Open Finance',
      type: 'Bank',
      logo: 'https://docs.pluggy.ai/img/logo.png',
      color: 'bg-blue-600',
      description: t('integrations.pluggy_desc'),
      isNew: true
    },
    {
      id: 'stripe',
      name: 'Stripe',
      type: 'Payment',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
      color: 'bg-indigo-600',
      description: t('integrations.stripe_desc'),
      isNew: true
    },
    {
      id: 'asaas',
      name: 'Asaas',
      type: 'Payment',
      logo: 'https://cdn-icons-png.flaticon.com/512/10095/10095689.png', // Logo atualizado
      color: 'bg-blue-500',
      description: t('integrations.asaas_desc'),
      isNew: true
    },
    // Existing
    {
      id: 'nubank',
      name: 'Nubank',
      type: 'Bank',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nubank_logo_2021.svg/2560px-Nubank_logo_2021.svg.png',
      color: 'bg-purple-800',
      description: t('integrations.nubank_desc')
    },
    {
      id: 'hotmart',
      name: 'Hotmart',
      type: 'Platform',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Hotmart_logo.svg/2560px-Hotmart_logo.svg.png',
      color: 'bg-orange-600',
      description: t('integrations.hotmart_desc'),
      hasWebhook: true
    },
    {
      id: 'youtube',
      name: 'YouTube',
      type: 'Platform',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/2560px-YouTube_full-color_icon_%282017%29.svg.png',
      color: 'bg-red-600',
      description: t('integrations.youtube_desc')
    }
  ];

  const roadmapItems = [
    {
        id: 'mobile',
        name: t('integrations.mobile_app'),
        description: t('integrations.mobile_app_desc'),
        type: 'Roadmap',
        icon: (
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        )
    }
  ];

  // Fetch initial data
  useEffect(() => {
    fetchIntegrations();
    fetchUserData();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await api.get('/integrations');
      setConnectedIntegrations(response.data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const fetchUserData = () => {
      // Assuming user data is stored in local storage from login
      // If not, we might need an endpoint, but for plan display purposes:
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) setUserData(user);
  };

  const handleOpenConnect = (integration) => {
      // Check limit client-side for better UX (fail fast)
      const isFree = userData?.plan === 'free';
      
      if (isFree) {
          showAlert("Premium Feature", "Integrations are available for PRO users only. Upgrade to unlock!", "locked");
          return;
      }

      setSelectedIntegration(integration);
      setIsModalOpen(true);
  };

  const handleConnectSuccess = async (apiKey) => {
    if (!selectedIntegration) return;

    try {
        const response = await api.post('/integrations/connect', {
            provider: selectedIntegration.name,
            apiKey
        });
        
        // Update local state
        setConnectedIntegrations(prev => [...prev, response.data]);
        // Let the modal show the success screen
        return true;

    } catch (error) {
        console.error('Connection error:', error);
        if (error.response && error.response.status === 403) {
            showAlert("Limit Reached", error.response.data.message, "locked");
        } else {
            showAlert("Connection Failed", error.response?.data?.message || 'Unknown error', "error");
        }
        throw error; // Propagate to modal to stop loading
    }
  };
  
  const handleDisconnect = async (integrationName) => {
      const integration = connectedIntegrations.find(i => i.provider === integrationName);
      if (!integration) return;

      showAlert(
        'Disconnect Integration',
        'Are you sure you want to disconnect? This will stop data syncing.',
        'confirm',
        async () => {
            try {
                await api.delete(`/integrations/${integration.id}`);
                setConnectedIntegrations(prev => prev.filter(i => i.id !== integration.id));
                showAlert("Success", "Integration disconnected successfully.", "success");
            } catch (error) {
                console.error('Disconnect error:', error);
                showAlert("Error", "Failed to disconnect.", "error");
            }
        }
      );
  };

  const handleSync = async (integrationName) => {
    setLoading(prev => ({ ...prev, [integrationName]: true }));
    try {
      const response = await api.post('/integrations/sync', { provider: integrationName });
      showAlert("Sync Success", response.data.message, "success");
    } catch (error) {
        console.error('Sync error:', error);
        showAlert("Sync Failed", error.response?.data?.message || 'Server error', "error");
    } finally {
      setLoading(prev => ({ ...prev, [integrationName]: false }));
    }
  };

  const isConnected = (name) => {
      return connectedIntegrations.some(i => i.provider === name);
  };

  return (
    <div className="space-y-8">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm}
      />

      <ConnectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        integration={selectedIntegration}
        onConnect={handleConnectSuccess}
      />

      {/* Pro Badge / Limit Info */}
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 dark:from-purple-600/20 dark:to-blue-600/20 border border-purple-500/20 dark:border-purple-500/30 p-4 rounded-xl flex items-start gap-3">
        <div className="text-2xl">⚡</div>
        <div>
            {userData?.plan === 'free' ? (
                <>
                    <h3 className="text-purple-800 dark:text-purple-200 font-bold text-sm">{t('integrations.free_plan_title')}</h3>
                    <p className="text-purple-700/70 dark:text-purple-200/70 text-xs mt-1">
                        {t('integrations.free_plan_desc')}
                    </p>
                </>
            ) : (
                <>
                    <h3 className="text-purple-800 dark:text-purple-200 font-bold text-sm">{t('integrations.pro_plan_title')}</h3>
                    <p className="text-purple-700/70 dark:text-purple-200/70 text-xs mt-1">
                        {t('integrations.pro_plan_desc')}
                    </p>
                </>
            )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('integrations.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('integrations.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg dark:hover:bg-white/10 transition-all">
            <div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gray-50 dark:bg-white p-2 overflow-hidden border border-gray-100 dark:border-none`}>
                 <img 
                    src={integration.logo} 
                    alt={integration.name} 
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                        const parent = e.target.parentNode;
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        if (parent) {
                            parent.innerText = integration.name[0]; // Fallback to initial
                            parent.classList.add('text-black', 'font-bold', 'text-xl');
                        }
                    }}
                 />
              </div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{integration.name}</h3>
                    {integration.isNew && (
                        <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                            Novo
                        </span>
                    )}
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded border border-gray-200 dark:border-none">{integration.type}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{integration.description}</p>
              
              {integration.hasWebhook && isConnected(integration.name) && (
                  <div className="mb-4 bg-gray-900 dark:bg-black/30 p-3 rounded border border-gray-800 dark:border-white/5">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{t('integrations.webhook_url')}</p>
                      <code className="text-xs text-orange-400 break-all select-all block">
                          https://api.luminia.com/v1/webhooks/hotmart
                      </code>
                  </div>
              )}
            </div>

            <div className="space-y-3">
                {isConnected(integration.name) ? (
                    <>
                        <button 
                            onClick={() => handleSync(integration.name)}
                            disabled={loading[integration.name]}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading[integration.name] ? (
                                t('integrations.syncing')
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {t('integrations.sync_now')}
                                </>
                            )}
                        </button>
                        <button 
                            onClick={() => handleDisconnect(integration.name)}
                            className="w-full bg-transparent border border-red-500/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium py-2 rounded-lg transition-colors text-sm"
                        >
                            {t('integrations.disconnect')}
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => handleOpenConnect(integration)}
                        className="w-full bg-gray-100 dark:bg-white text-gray-900 dark:text-purple-900 font-bold py-2 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 dark:border-none"
                    >
                        {t('integrations.connect')}
                    </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Roadmap Section */}
      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('integrations.roadmap_title') || "Em Breve (Roadmap)"}</h2>
            <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
                Fase 3
            </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roadmapItems.map((item) => (
                item.path ? (
                    <Link 
                        key={item.id} 
                        to={item.path}
                        className="group relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex items-start gap-4 hover:shadow-xl hover:border-purple-500/50 transition-all transform hover:-translate-y-1"
                    >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            {item.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center gap-2">
                                {item.name}
                                <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800 uppercase tracking-wider">
                                    Disponível
                                </span>
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                                {item.description}
                            </p>
                            <div className="mt-4 flex items-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                                Acessar Agora
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div key={item.id} className="group relative overflow-hidden bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 border-dashed rounded-2xl p-6 flex items-start gap-4 opacity-75 hover:opacity-100 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-not-allowed">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-slate-700 shadow-sm text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {item.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                {item.name}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                {item.description}
                            </p>
                            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                                Em Desenvolvimento
                            </div>
                        </div>
                    </div>
                )
            ))}
        </div>
      </div>
    </div>
  );
};

export default Integrations;
