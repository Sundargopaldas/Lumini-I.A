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

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        // Remove simulated delay, real API takes time
        // Increase timeout for AI request as it might take longer
        const response = await api.get('/ai/insights', { timeout: 30000 });
        setInsights(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch AI insights', err);
        setError('Não foi possível conectar ao Consultor IA no momento.');
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'ai_prediction': return '🔮';
      case 'ai_consultant': return '🤖';
      default: return '💡';
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-red-500/10 border-red-500/20 text-red-200';
      case 'success': return 'bg-green-500/10 border-green-500/20 text-green-200';
      case 'ai_prediction': return 'bg-purple-500/10 border-purple-500/20 text-purple-200';
      case 'ai_consultant': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100';
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
        {loading && (
            <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
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
                  <h3 className="font-bold text-sm mb-2">{insight.title}</h3>
                  {insight.isMarkdown ? (
                      <div className="text-xs opacity-90 leading-relaxed text-slate-200">
                          <SimpleMarkdown text={insight.message} />
                      </div>
                  ) : (
                      <p className="text-xs opacity-90 leading-relaxed">{insight.message}</p>
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
