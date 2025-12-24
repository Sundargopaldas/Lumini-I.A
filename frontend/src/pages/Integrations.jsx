import { useState } from 'react';
import api from '../services/api';

const Integrations = () => {
  const [loading, setLoading] = useState({});
  const [connected, setConnected] = useState({
    nubank: false,
    hotmart: false,
    youtube: false
  });

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
      description: 'Import your digital product sales in real-time.'
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

  const handleConnect = (id) => {
    // Toggle connection state (Mock)
    setConnected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSync = async (id, name) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      const response = await api.post('/integrations/sync', { provider: name });
      alert(`✅ Success! ${response.data.message}`);
    } catch (error) {
        console.error('Sync error:', error);
        if (error.response && error.response.status === 403) {
            alert("🔒 This feature is for PRO users only. Please upgrade your plan.");
        } else {
            alert("❌ Failed to sync. Don't worry, your data is safe.");
        }
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  console.log('Rendering Integrations component');

  return (
    <div className="space-y-8">
      <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-start gap-3">
        <div className="text-2xl">🛡️</div>
        <div>
            <h3 className="text-blue-200 font-bold text-sm">Safe Integration Mode</h3>
            <p className="text-blue-200/70 text-xs mt-1">
                You can test integrations safely here. Syncing will add simulated transactions to your dashboard without affecting your real bank accounts.
            </p>
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
              <p className="text-sm text-gray-400 mb-6">{integration.description}</p>
            </div>

            <div className="space-y-3">
                {connected[integration.id] ? (
                    <>
                        <button 
                            onClick={() => handleSync(integration.id, integration.name)}
                            disabled={loading[integration.id]}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading[integration.id] ? (
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
                            onClick={() => handleConnect(integration.id)}
                            className="w-full bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium py-2 rounded-lg transition-colors text-sm"
                        >
                            Disconnect
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => handleConnect(integration.id)}
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
