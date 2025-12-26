import { useState, useEffect } from 'react';

const ConnectModal = ({ isOpen, onClose, integration, onConnect }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setLoading(false);
      setApiKey('');
    }
  }, [isOpen]);

  if (!isOpen || !integration) return null;

  const handleConnect = async () => {
    setLoading(true);
    try {
        // Simulate a small delay for better UX even if API is fast
        // For banks, we might want a longer delay to simulate "OAuth redirect"
        if (integration.type === 'Bank') {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        await onConnect(apiKey);
        setStep(2); // Success step
    } catch (error) {
        // Error is handled by parent (alert), just stop loading
        console.error("Connect failed", error);
    } finally {
        setLoading(false);
    }
  };

  const handleFinalize = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-lg p-1.5 flex items-center justify-center">
                <img src={integration.logo} alt={integration.name} className="max-w-full max-h-full object-contain" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-white">Connect {integration.name}</h3>
               <p className="text-xs text-gray-400">Via Safe Connection</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              {integration.type === 'Bank' ? (
                // BANK FLOW
                <>
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                    <div className="flex gap-3">
                      <div className="text-blue-400 text-xl">🛡️</div>
                      <div>
                        <h4 className="text-blue-100 font-bold text-sm mb-1">Bank-Level Security</h4>
                        <p className="text-blue-200/70 text-xs">
                          You will be redirected to <strong>{integration.name}</strong> to authorize access. 
                          We never see or store your banking passwords.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-gray-400 mt-4">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Read-only access to transactions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Encrypted data transmission
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> Revoke access at any time
                    </li>
                  </ul>

                  <button 
                    onClick={handleConnect}
                    disabled={loading}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Connecting to {integration.name}...
                      </>
                    ) : (
                      `Continue to ${integration.name}`
                    )}
                  </button>
                </>
              ) : (
                // PLATFORM FLOW (API Key / Webhook)
                <>
                   <p className="text-gray-300 text-sm mb-4">
                     To connect <strong>{integration.name}</strong>, please paste your API Key below.
                     You can find this in your {integration.name} settings.
                   </p>

                   <div>
                     <label className="text-xs text-gray-500 block mb-1">API Key / Access Token</label>
                     <input 
                       type="password" 
                       placeholder="ak_live_xxxxxxxxxxxx"
                       value={apiKey}
                       onChange={(e) => setApiKey(e.target.value)}
                       className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
                     />
                   </div>

                   <button 
                    onClick={handleConnect}
                    disabled={loading || !apiKey.trim()}
                    className={`w-full mt-6 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        loading || !apiKey.trim() 
                        ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {loading ? 'Verifying...' : 'Connect Platform'}
                  </button>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce">
                ✓
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Successfully Connected!</h3>
              <p className="text-gray-400 text-sm mb-6">
                Your transactions from <strong>{integration.name}</strong> are now syncing automatically.
              </p>
              <button 
                onClick={handleFinalize}
                className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;
