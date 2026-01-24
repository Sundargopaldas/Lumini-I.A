import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';
import CustomAlert from './CustomAlert';

const SubscriptionWidget = ({ user }) => {
  const navigate = useNavigate();
  
  if (!user) return null;

  // Local state to handle sync updates
  const [localUser, setLocalUser] = useState(user);
  const [syncing, setSyncing] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [alert, setAlert] = useState({ 
    show: false, 
    message: '', 
    type: 'success', 
    title: '',
    onCloseAction: null 
  });

  useEffect(() => {
     setLocalUser(user);
  }, [user]);

  // Buscar contagem de documentos não visualizados
  useEffect(() => {
    const fetchUnviewedCount = async () => {
      try {
        const response = await api.get('/accountants/documents/unviewed/count');
        setUnviewedCount(response.data.count);
      } catch (error) {
        console.error('Error fetching unviewed documents count:', error);
      }
    };

    fetchUnviewedCount();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUnviewedCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
      setSyncing(true);
      try {
          const res = await api.get('/auth/me');
          if (res.data) {
              localStorage.setItem('user', JSON.stringify(res.data));
              setLocalUser(res.data);
              // Dispatch storage event to notify other components
              window.dispatchEvent(new Event('storage'));
              setAlert({
                show: true,
                message: 'Plano sincronizado com sucesso!',
                type: 'success',
                title: 'Sincronizado',
                onCloseAction: () => window.location.reload()
              });
          }
      } catch (e) {
          console.error('Sync error', e);
          setAlert({
            show: true,
            message: 'Erro ao sincronizar. Tente novamente.',
            type: 'error',
            title: 'Erro'
          });
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
    <div className="w-full mb-6">
      <div className="bg-slate-800 rounded-xl p-4 shadow-md border border-slate-700 relative overflow-hidden">
        {/* Left Color Strip */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getPlanColor(plan)}`}></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pl-3">
          
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getPlanColor(plan)} shadow-lg shadow-purple-500/20`}>
              <span className="text-xl text-white">{isFree ? '🌱' : '👑'}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{getPlanName(plan)}</h2>
              <p className="text-slate-400 text-sm">
                {isFree 
                  ? 'Faça upgrade para desbloquear.' 
                  : 'Sua assinatura está ativa.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
             {/* Botão Upgrade (apenas free) ou Gerenciar (apenas pagos) */}
             {isFree ? (
                <Link 
                  to="/plans" 
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shadow text-sm text-center"
                >
                  Upgrade 🚀
                </Link>
             ) : (
                <Link 
                  to="/plans" 
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors border border-slate-600 text-sm text-center"
                >
                  Gerenciar
                </Link>
             )}
             
             {/* Botão de Notificação de Documentos - APARECE PARA TODOS */}
             <button
               onClick={() => navigate('/meus-documentos')}
               className="relative px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors border border-slate-600 text-sm"
               title="Meus Documentos"
             >
               📄 Documentos
               {unviewedCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                   {unviewedCount}
                 </span>
               )}
             </button>
             
             {/* Botão Sincronizar */}
             <button
                onClick={handleSync}
                disabled={syncing}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Sincronizar Status"
             >
                {syncing ? '...' : '↻'}
             </button>
          </div>
        </div>

        {/* Free Plan Progress Bar (Compact) */}
        {isFree && (
            <div className="mt-4 pt-3 border-t border-slate-700 ml-3">
                <div className="flex justify-between text-xs mb-1 font-medium text-slate-400">
                    <span>Notas (Mês)</span>
                    <span>3 / 5</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
            </div>
        )}
      </div>
      
      <CustomAlert 
        isOpen={alert.show} 
        message={alert.message} 
        type={alert.type} 
        title={alert.title}
        onClose={() => {
            setAlert(prev => ({ ...prev, show: false }));
            if (alert.onCloseAction) alert.onCloseAction();
        }} 
      />
    </div>
  );
};

export default SubscriptionWidget;
