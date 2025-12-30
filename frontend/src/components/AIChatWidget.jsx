import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const SimpleMarkdown = ({ text }) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                    <p key={i} className="min-h-[1rem]">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                        })}
                    </p>
                );
            })}
        </div>
    );
};

const AIChatWidget = () => {
    const { t } = useTranslation();
    const { theme } = useTheme(); // Assuming we might want to adapt styles, but Tailwind dark mode handles most
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Olá! Sou o Lumini IA. Como posso ajudar nas suas finanças hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Support / WhatsApp Logic
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isPro = ['pro', 'premium', 'agency'].includes(user.plan?.toLowerCase());
    const whatsappNumber = "5511999999999"; 
    const supportMessage = encodeURIComponent(t('support.whatsapp_message') || "Olá, preciso de ajuda com o Lumini.");

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setLoading(true);

        try {
            // Prepare history for backend (exclude the very first welcome message if it's purely frontend, 
            // but actually we want to keep context. However, the first message is static.
            // Let's send the recent conversation.
            
            // Backend expects history as array of { role: 'user' | 'ai', text: '...' }
            // We exclude the last message we just added (userMessage) because we send it as 'message' param? 
            // Or we send it in history?
            // The backend route logic was: const { message, history } = req.body;
            // And then chatWithAI uses message as current, and history as past.
            
            const historyToSend = messages.filter(m => m.role !== 'system'); // exclude system if any

            const res = await api.post('/ai/chat', {
                message: userMessage,
                history: historyToSend
            });

            setMessages(prev => [...prev, { role: 'ai', text: res.data.message }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'ai', text: 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex flex-col items-end pointer-events-none">
            
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white dark:bg-slate-800 w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col mb-4 overflow-hidden pointer-events-auto animate-fade-in-up transition-colors absolute bottom-16 right-0">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Lumini Chat</h3>
                                <p className="text-purple-200 text-xs flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {isPro && (
                                <a
                                    href={`https://wa.me/${whatsappNumber}?text=${supportMessage}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors flex items-center justify-center"
                                    title={t('support.tooltip') || "Falar com Especialista"}
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                    </svg>
                                </a>
                            )}
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                        {messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`
                                        max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm
                                        ${msg.role === 'user' 
                                            ? 'bg-purple-600 text-white rounded-tr-none' 
                                            : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-600'
                                        }
                                    `}
                                >
                                    {msg.role === 'ai' ? (
                                        <SimpleMarkdown text={msg.text} />
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-700 rounded-2xl rounded-tl-none p-3 shadow-sm border border-slate-100 dark:border-slate-600">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Digite sua dúvida..."
                                className="flex-1 bg-slate-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                                disabled={loading}
                            />
                            <button 
                                type="submit" 
                                disabled={!input.trim() || loading}
                                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors shadow-lg shadow-purple-500/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    pointer-events-auto
                    h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
                    ${isOpen 
                        ? 'bg-slate-800 text-white rotate-90' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-110 animate-bounce-subtle'
                    }
                `}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default AIChatWidget;