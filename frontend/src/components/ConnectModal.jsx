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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all">
      <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-colors">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900 p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center transition-colors">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white dark:bg-white rounded-lg p-1.5 flex items-center justify-center shadow-sm">
                <img src={integration.logo} alt={integration.name} className="max-w-full max-h-full object-contain" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Connect {integration.name}</h3>
               <p className="text-xs text-slate-500 dark:text-gray-400">Via Safe Connection</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white transition-colors">
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
                  <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-lg transition-colors">
                    <div className="flex gap-3">
                      <div className="text-blue-500 dark:text-blue-400 text-xl">🛡️</div>
                      <div>
                        <h4 className="text-blue-800 dark:text-blue-100 font-bold text-sm mb-1">Bank-Level Security</h4>
                        <p className="text-blue-700/70 dark:text-blue-200/70 text-xs">
                          You will be redirected to <strong>{integration.name}</strong> to authorize access. 
                          We never see or store your banking passwords.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-gray-400 mt-4 transition-colors">
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
                   <p className="text-slate-600 dark:text-gray-300 text-sm mb-4 transition-colors">
                     To connect <strong>{integration.name}</strong>, please paste your API Key below.
                     You can find this in your {integration.name} settings.
                   </p>

                   <div>
                     <label className="text-xs text-slate-500 dark:text-gray-500 block mb-1 transition-colors">API Key / Access Token</label>
                     <input 
                       type="text" 
                       value={apiKey}
                       onChange={(e) => setApiKey(e.target.value)}
                       placeholder="Paste your API Key here"
                       className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                     />
                   </div>

                   <button 
                    onClick={handleConnect}
                    disabled={loading || !apiKey}
                    className="w-full mt-6 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-200 text-white dark:text-black font-bold py-3 rounded-lg transition-all"
                  >
                    {loading ? 'Verifying...' : 'Connect Platform'}
                  </button>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce transition-colors">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Successfully Connected!</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-6 transition-colors">
                Your transactions from <strong>{integration.name}</strong> are now syncing automatically.
              </p>
              <button 
                onClick={handleFinalize}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-3 rounded-lg hover:bg-slate-800 dark:hover:bg-gray-200 transition-colors"
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
