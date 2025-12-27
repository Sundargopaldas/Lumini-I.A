import { useState, useEffect } from 'react';
import api from '../services/api';
import ConnectModal from '../components/ConnectModal';
import CustomAlert from '../components/CustomAlert';

const Integrations = () => {
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
    {
      id: 'nubank',
      name: 'Nubank',
      type: 'Bank',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nubank_logo_2021.svg/2560px-Nubank_logo_2021.svg.png',
      color: 'bg-purple-800',
      description: 'Sync your expenses and credit card bills automatically.'
    },
    {
      id: 'hotmart',
      name: 'Hotmart',
      type: 'Platform',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Hotmart_logo.svg/2560px-Hotmart_logo.svg.png',
      color: 'bg-orange-600',
      description: 'Import your digital product sales in real-time.',
      hasWebhook: true
    },
    {
      id: 'youtube',
      name: 'YouTube',
      type: 'Platform',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/2560px-YouTube_full-color_icon_%282017%29.svg.png',
      color: 'bg-red-600',
      description: 'Track your AdSense revenue directly.'
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
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 p-4 rounded-xl flex items-start gap-3">
        <div className="text-2xl">⚡</div>
        <div>
            {userData?.plan === 'free' ? (
                <>
                    <h3 className="text-purple-200 font-bold text-sm">Free Plan: No Integrations Included</h3>
                    <p className="text-purple-200/70 text-xs mt-1">
                        Integrations are a PRO feature. Upgrade to connect your banks and platforms.
                    </p>
                </>
            ) : (
                <>
                    <h3 className="text-purple-200 font-bold text-sm">PRO Plan Active: Unlimited Integrations</h3>
                    <p className="text-purple-200/70 text-xs mt-1">
                        You have access to all integrations with no limits. Connect as many accounts as you need.
                    </p>
                </>
            )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
        <p className="text-gray-400">Connect your accounts to automate your financial tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/10 transition-colors">
            <div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-white p-2 overflow-hidden`}>
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
                <h3 className="text-xl font-bold text-white">{integration.name}</h3>
                <span className="text-xs font-medium text-gray-400 bg-white/10 px-2 py-1 rounded">{integration.type}</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">{integration.description}</p>
              
              {integration.hasWebhook && isConnected(integration.name) && (
                  <div className="mb-4 bg-black/30 p-3 rounded border border-white/5">
                      <p className="text-xs text-gray-500 mb-1">Your Webhook URL:</p>
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
                                'Syncing...'
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Sync Now
                                </>
                            )}
                        </button>
                        <button 
                            onClick={() => handleDisconnect(integration.name)}
                            className="w-full bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium py-2 rounded-lg transition-colors text-sm"
                        >
                            Disconnect
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => handleOpenConnect(integration)}
                        className="w-full bg-white text-purple-900 font-bold py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Connect
                    </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;
