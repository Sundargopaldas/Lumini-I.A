import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

const SubscriptionWidget = ({ user }) => {
  if (!user) return null;

  // Local state to handle sync updates
  const [localUser, setLocalUser] = useState(user);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
     setLocalUser(user);
  }, [user]);

  const handleSync = async () => {
      setSyncing(true);
      try {
          const res = await api.get('/auth/me');
          if (res.data) {
              localStorage.setItem('user', JSON.stringify(res.data));
              setLocalUser(res.data);
              // Dispatch storage event to notify other components
              window.dispatchEvent(new Event('storage'));
              alert('Plano sincronizado com sucesso!');
              window.location.reload(); // Force full reload
          }
      } catch (e) {
          console.error('Sync error', e);
          alert('Erro ao sincronizar. Tente novamente.');
      } finally {
          setSyncing(false);
      }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'premium': return 'bg-gradient-to-r from-purple-600 to-pink-600';
      case 'pro': return 'bg-gradient-to-r from-blue-600 to-indigo-600';
      case 'agency': return 'bg-gradient-to-r from-emerald-600 to-teal-600';
      default: return 'bg-slate-700';
    }
  };

  const getPlanName = (plan) => {
    switch (plan) {
      case 'premium': return 'Plano Premium';
      case 'pro': return 'Plano Pro';
      case 'agency': return 'Plano Agency';
      default: return 'Plano Gratuito';
    }
  };

  const plan = localUser.plan || 'free';
  const isFree = plan === 'free';

  return (
    <div className="w-full mb-8">
      <div className={`rounded-2xl p-6 shadow-lg ${getPlanColor(plan)} text-white relative overflow-hidden`}>
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <span className="text-3xl">{isFree ? '🌱' : '👑'}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{getPlanName(plan)}</h2>
              <p className="text-white/80">
                {isFree 
                  ? 'Faça um upgrade para desbloquear todos os recursos.' 
                  : 'Sua assinatura está ativa e você tem acesso total.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
             {isFree ? (
                <Link 
                  to="/plans" 
                  className="w-full md:w-auto px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-lg text-center"
                >
                  Fazer Upgrade 🚀
                </Link>
             ) : (
                <div className="flex gap-2">
                    <Link 
                      to="/plans" 
                      className="px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors border border-white/30 text-center"
                    >
                      Gerenciar
                    </Link>
                </div>
             )}
             
             <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-3 bg-transparent text-white/70 hover:text-white text-sm font-medium hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/20"
                title="Sincronizar Status"
             >
                {syncing ? '↻ ...' : '↻'}
             </button>
          </div>
        </div>

        {/* Free Plan Progress Bar (Mockup for future real limits) */}
        {isFree && (
            <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex justify-between text-sm mb-2 font-medium text-white/90">
                    <span>Notas Fiscais (Mês)</span>
                    <span>3 / 5</span>
                </div>
                <div className="w-full bg-slate-900/30 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-white h-2.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs text-white/60 mt-2">Limite renova em 01/03</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionWidget;
