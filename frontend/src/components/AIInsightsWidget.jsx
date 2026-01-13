import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

// Simple Markdown Renderer Component (if package not available, we can fallback to simple text or just basic replacement)
// For now, let's assume we render text with line breaks and basic bolding if ReactMarkdown isn't installed.
// Or better, let's process the text to replace ** with <b>

const SimpleMarkdown = ({ text }) => {
    if (!text) return null;
    
    // Split by newlines
    const lines = text.split('\n');
    
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                // Replace **bold** with <strong>bold</strong>
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                    <p key={i} className="min-h-[1rem]">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className="text-purple-300">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                        })}
                    </p>
                );
            })}
        </div>
    );
};

const AIInsightsWidget = () => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      // Remove simulated delay, real API takes time
      // Increase timeout for AI request as it might take longer
      const response = await api.get('/ai/insights', { timeout: 45000 });
      
      console.log('AI Insights response:', response.data);
      
      if (Array.isArray(response.data)) {
           setInsights(response.data);
      } else {
           console.error('AI Insights received invalid format:', response.data);
           // Fallback if backend sends object instead of array
           if (response.data && typeof response.data === 'object') {
               setInsights([response.data]);
           } else {
               setInsights([]);
           }
      }
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch AI insights', err);
      setError('Não foi possível conectar ao Consultor IA no momento. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh do Consultor IA');
      fetchInsights();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'ai_prediction': return '🔮';
      case 'ai_consultant': return '🤖';
      case 'tax_risk': return '🦁'; // Lion for Receita Federal
      default: return '💡';
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-red-500/10 border-red-500/20 text-red-200';
      case 'success': return 'bg-green-500/10 border-green-500/20 text-green-200';
      case 'ai_prediction': return 'bg-purple-500/10 border-purple-500/20 text-purple-200';
      case 'ai_consultant': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100';
      case 'tax_risk': return 'bg-orange-500/10 border-orange-500/20 text-orange-200';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-200';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg shadow-purple-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Consultor IA</h2>
        
        {/* Creator Mode Badge */}
        {insights.some(i => i.message && (i.message.includes('Creator Insight') || i.message.includes('AdSense'))) && (
             <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-rose-500 to-orange-500 rounded text-[10px] uppercase font-bold text-white tracking-wider shadow-sm border border-white/10">
                Creator Mode
             </span>
        )}

        {loading && (
            <span className="flex h-3 w-3 relative ml-auto">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
        )}

        {/* Botão de Refresh */}
        {!loading && (
          <button
            onClick={fetchInsights}
            className="ml-auto p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all group"
            title="Atualizar análise"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 text-slate-300 group-hover:text-white group-hover:rotate-180 transition-all duration-300" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        {/* Última atualização */}
        {lastUpdate && !loading && (
          <span className="text-xs text-slate-400 ml-2">
            {new Date(lastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="space-y-3 relative z-10 min-h-[150px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-8 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <p className="text-slate-400 text-sm animate-pulse">Consultando a Inteligência Artificial...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <p>{error}</p>
          </div>
        ) : insights.length > 0 ? (
          insights.map((insight, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${getBgColor(insight.type)} transition-all hover:scale-[1.02] cursor-default`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{getIcon(insight.type)}</span>
                <div className="w-full">
                  <h3 className="font-bold text-lg mb-2">{insight.title}</h3>
                  {insight.isMarkdown ? (
                      <div className="text-base opacity-90 leading-relaxed text-slate-200">
                          <SimpleMarkdown text={insight.message} />
                      </div>
                  ) : (
                      <p className="text-base opacity-90 leading-relaxed">{insight.message}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400">
            <p>Nenhum insight disponível ainda. Comece a adicionar transações!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsWidget;
